import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";

import {
  RefreshToken,
  RefreshTokenClass,
  RefreshTokenDocument,
} from "../schemas/refresh-token.schema";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UserRole } from "@app/common/enums";
import { CacheService } from "@app/cache";
import { JWT_CONSTANTS } from "@app/common/constants";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;
  private readonly blacklistPrefix = "auth:blacklist:";

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    @InjectModel("RefreshToken")
    private readonly refreshTokenModel: Model<RefreshTokenDocument>
  ) {
    this.accessTokenExpiration = this.configService.get<string>(
      "JWT_EXPIRES_IN",
      JWT_CONSTANTS.ACCESS_TOKEN_EXPIRATION
    );
    this.refreshTokenExpiration = this.configService.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
      JWT_CONSTANTS.REFRESH_TOKEN_EXPIRATION
    );
  }

  /**
   * Tạo access token
   */
  async generateAccessToken(payload: {
    userId: string;
    username?: string;
    email?: string;
    roles: UserRole[];
  }): Promise<string> {
    const jwtPayload: JwtPayload = {
      sub: payload.userId,
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      jti: uuidv4(), // Token unique ID
      type: "access",
    };

    return this.jwtService.sign(jwtPayload, {
      expiresIn: this.accessTokenExpiration,
    });
  }

  /**
   * Tạo refresh token
   */
  async generateRefreshToken(payload: {
    userId: string;
    username?: string;
    email?: string;
    roles: UserRole[];
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ token: string; expiresAt: Date }> {
    const tokenId = uuidv4();

    // Tính thời gian hết hạn
    const expiresIn = this.parseExpirationTime(this.refreshTokenExpiration);
    const expiresAt = new Date(Date.now() + expiresIn);

    // Tạo JWT payload
    const jwtPayload: JwtPayload = {
      sub: payload.userId,
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      jti: tokenId,
      type: "refresh",
    };

    // Ký JWT
    const token = this.jwtService.sign(jwtPayload, {
      expiresIn: this.refreshTokenExpiration,
    });

    // Hash token trước khi lưu vào DB
    const hashedToken = await this.hashToken(token);

    // Tạo refresh token trong database
    await this.refreshTokenModel.create({
      token: hashedToken,
      userId: payload.userId,
      expiresAt,
      deviceId: payload.deviceId,
      userAgent: payload.userAgent,
      ipAddress: payload.ipAddress,
      lastUsedAt: new Date(),
    });

    return { token, expiresAt };
  }

  /**
   * Xác thực và đổi refresh token
   */
  async verifyAndRotateRefreshToken(
    refreshToken: string,
    deviceId?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Xác thực refresh token
      const payload = await this.verifyRefreshToken(refreshToken);

      // Tìm refresh token trong database
      const tokenRecord = await this.findRefreshTokenByToken(refreshToken);

      if (!tokenRecord) {
        throw new UnauthorizedException("Refresh token không hợp lệ");
      }

      // Kiểm tra xem token có bị thu hồi hoặc hết hạn không
      if (tokenRecord.isRevoked) {
        throw new UnauthorizedException("Refresh token đã bị thu hồi");
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException("Refresh token đã hết hạn");
      }

      // Kiểm tra xem token có đúng với device không
      if (
        deviceId &&
        tokenRecord.deviceId &&
        tokenRecord.deviceId !== deviceId
      ) {
        throw new UnauthorizedException(
          "Refresh token không phù hợp với thiết bị"
        );
      }

      // Thu hồi token cũ
      await this.revokeRefreshToken(refreshToken);

      // Tạo mới access token
      const accessToken = await this.generateAccessToken({
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        roles: payload.roles,
      });

      // Tạo mới refresh token
      const newRefreshToken = await this.generateRefreshToken({
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        roles: payload.roles,
        deviceId: tokenRecord.deviceId,
        userAgent: tokenRecord.userAgent,
        ipAddress: tokenRecord.ipAddress,
      });

      // Parse expiration time in seconds
      const expiresIn =
        this.parseExpirationTime(this.accessTokenExpiration) / 1000;

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(
        `Error rotating refresh token: ${error.message}`,
        error.stack
      );
      throw new UnauthorizedException("Không thể đổi refresh token");
    }
  }

  /**
   * Tìm refresh token trong database bằng token
   */
  async findRefreshTokenByToken(
    token: string
  ): Promise<RefreshTokenDocument | null> {
    // Hash token trước khi tìm
    const hashedToken = await this.hashToken(token);
    return this.refreshTokenModel.findOne({ token: hashedToken }).exec();
  }

  /**
   * Thu hồi refresh token
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    try {
      // Tìm và cập nhật token
      const hashedToken = await this.hashToken(token);
      const result = await this.refreshTokenModel
        .updateOne({ token: hashedToken }, { isRevoked: true })
        .exec();

      // Thêm token vào blacklist
      const payload = this.jwtService.decode(token) as JwtPayload;
      if (payload && payload.jti) {
        await this.blacklistToken(payload.jti, payload.exp);
      }

      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(
        `Error revoking refresh token: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Thu hồi tất cả refresh token của user
   */
  async revokeAllUserTokens(userId: string): Promise<boolean> {
    try {
      // Tìm tất cả token chưa bị thu hồi
      const tokens = await this.refreshTokenModel
        .find({
          userId,
          isRevoked: false,
        })
        .exec();

      // Thu hồi từng token
      if (tokens.length > 0) {
        await this.refreshTokenModel
          .updateMany({ userId, isRevoked: false }, { isRevoked: true })
          .exec();

        // Thêm vào blacklist
        tokens.forEach(async (tokenDoc) => {
          try {
            // Lấy token gốc và decode để lấy JTI
            // Note: Không thể decode từ token đã hash, nhưng ta có thể lấy thông tin từ record
            // Ở đây, ta sẽ cần tạo một blacklist khác dựa trên userId và expiresAt của từng token
            const blacklistKey = `${this.blacklistPrefix}user:${userId}:${tokenDoc._id}`;
            const ttl = Math.max(
              0,
              Math.floor((tokenDoc.expiresAt.getTime() - Date.now()) / 1000)
            );

            await this.cacheService.set(blacklistKey, "revoked", ttl);
          } catch (error) {
            this.logger.error(`Error blacklisting token: ${error.message}`);
          }
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error revoking all user tokens: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Xác thực refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      if (!payload || payload.type !== "refresh") {
        throw new UnauthorizedException("Token không phải là refresh token");
      }

      // Kiểm tra xem token có trong blacklist không
      if (payload.jti && (await this.isTokenBlacklisted(payload.jti))) {
        throw new UnauthorizedException("Refresh token đã bị thu hồi");
      }

      return payload;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Refresh token đã hết hạn");
      }

      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Refresh token không hợp lệ");
      }

      throw error;
    }
  }

  /**
   * Xác thực access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      if (!payload || payload.type !== "access") {
        throw new UnauthorizedException("Token không phải là access token");
      }

      // Kiểm tra xem token có trong blacklist không
      if (payload.jti && (await this.isTokenBlacklisted(payload.jti))) {
        throw new UnauthorizedException("Access token đã bị thu hồi");
      }

      return payload;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Access token đã hết hạn");
      }

      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Access token không hợp lệ");
      }

      throw error;
    }
  }

  /**
   * Thêm token vào blacklist
   */
  async blacklistToken(tokenId: string, expiry?: number): Promise<void> {
    try {
      let ttl = 3600; // 1 hour default

      if (expiry) {
        // Tính thời gian còn lại cho đến khi token hết hạn
        const expiryTime = expiry * 1000; // Convert to milliseconds
        const now = Date.now();

        if (expiryTime > now) {
          ttl = Math.floor((expiryTime - now) / 1000); // Convert to seconds
        } else {
          // Token đã hết hạn, không cần đưa vào blacklist
          return;
        }
      }

      const key = `${this.blacklistPrefix}${tokenId}`;
      await this.cacheService.set(key, "revoked", ttl);
    } catch (error) {
      this.logger.error(
        `Error blacklisting token: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Kiểm tra xem token có trong blacklist không
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const key = `${this.blacklistPrefix}${tokenId}`;
      const result = await this.cacheService.get(key);
      return result === "revoked";
    } catch (error) {
      this.logger.error(
        `Error checking blacklisted token: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Hash token trước khi lưu vào DB
   */
  private async hashToken(token: string): Promise<string> {
    // Sử dụng một thuật toán hash nhanh vì chúng ta chỉ cần so sánh
    return bcrypt.hashSync(token, 10);
  }

  /**
   * Parse expiration time từ string (e.g., '1h', '7d') sang milliseconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const regex = /^(\d+)([smhdw])$/;
    const match = expiresIn.match(regex);

    if (!match) {
      return 3600 * 1000; // Default 1 hour in milliseconds
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000; // seconds
      case "m":
        return value * 60 * 1000; // minutes
      case "h":
        return value * 60 * 60 * 1000; // hours
      case "d":
        return value * 24 * 60 * 60 * 1000; // days
      case "w":
        return value * 7 * 24 * 60 * 60 * 1000; // weeks
      default:
        return value * 1000; // default to seconds
    }
  }

  /**
   * Decode token để lấy payload mà không kiểm tra
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.error(`Error decoding token: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Dọn dẹp token đã hết hạn
   * Hàm này nên được gọi định kỳ bằng cron job
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.refreshTokenModel
        .deleteMany({
          $or: [
            { expiresAt: { $lt: new Date() } },
            {
              isRevoked: true,
              expiresAt: {
                $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // Đã thu hồi và quá 30 ngày
          ],
        })
        .exec();

      return result.deletedCount;
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired tokens: ${error.message}`,
        error.stack
      );
      return 0;
    }
  }
}
