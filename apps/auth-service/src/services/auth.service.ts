import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { KafkaService } from "@app/kafka";
import { CacheService } from "@app/cache";
import { UserRole } from "@app/common/enums";
import { KafkaPattern } from "@app/kafka/constants";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
} from "@app/common/dto/auth";
import {
  ResourceNotFoundException,
  BusinessException,
} from "@app/common/exceptions";
import { TokenService } from "./token.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly kafkaService: KafkaService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Đăng ký người dùng mới
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for ${registerDto.email}`);

    try {
      // Kiểm tra user có tồn tại chưa thông qua UserService
      const userExists = await this.checkUserExists(
        registerDto.email,
        registerDto.username
      );

      if (userExists) {
        throw new BusinessException("Email hoặc username đã tồn tại");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(registerDto.password);

      // Gọi sang UserService để tạo user thông qua Kafka
      const userResponse: any = await this.kafkaService.send(
        KafkaPattern.USER_CREATE,
        {
          ...registerDto,
          password: hashedPassword,
          roles: [UserRole.USER], // Mặc định role là USER
          isVerified: false,
          status: "pending",
        }
      );

      // Tạo token cho user mới
      const { accessToken, refreshToken, expiresIn } =
        await this.generateAuthTokens({
          userId: userResponse.id,
          username: userResponse.username,
          email: userResponse.email,
          roles: userResponse.roles,
          deviceId: registerDto.deviceId,
          userAgent: registerDto.userAgent,
          ipAddress: registerDto.ipAddress,
        });

      // Tạo response
      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn,
        user: {
          id: userResponse.id,
          username: userResponse.username,
          email: userResponse.email,
          firstName: userResponse.firstName,
          lastName: userResponse.lastName,
          isVerified: userResponse.isVerified,
          roles: userResponse.roles,
        },
      };
    } catch (error) {
      this.logger.error(
        `Registration failed for ${registerDto.email}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Đăng nhập người dùng
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for ${loginDto.usernameOrEmail}`);

    try {
      // Tìm user bằng username hoặc email
      const user = await this.findUserByUsernameOrEmail(
        loginDto.usernameOrEmail
      );

      if (!user) {
        throw new UnauthorizedException("Thông tin đăng nhập không chính xác");
      }

      // Kiểm tra trạng thái tài khoản
      if (user.status !== "active") {
        throw new ForbiddenException(
          `Tài khoản đã bị ${user.status === "banned" ? "khóa" : "tạm khóa"}`
        );
      }

      // Kiểm tra password
      const isPasswordValid = await this.verifyPassword(
        loginDto.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException("Thông tin đăng nhập không chính xác");
      }

      // Tạo token
      const { accessToken, refreshToken, expiresIn } =
        await this.generateAuthTokens({
          userId: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          deviceId: loginDto.deviceId,
          userAgent: loginDto.userAgent,
          ipAddress: loginDto.ipAddress,
        });

      // Tạo response
      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error(
        `Login failed for ${loginDto.usernameOrEmail}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    this.logger.log("Token refresh attempt");

    try {
      // Xác thực và đổi refresh token
      const { accessToken, refreshToken, expiresIn } =
        await this.tokenService.verifyAndRotateRefreshToken(
          refreshTokenDto.refreshToken,
          refreshTokenDto.deviceId
        );

      // Lấy thông tin user từ token
      const payload = this.tokenService.decodeToken(accessToken);

      if (!payload || !payload.userId) {
        throw new UnauthorizedException("Token không hợp lệ");
      }

      // Lấy thông tin user từ UserService
      const user = await this.findUserById(payload.userId);

      if (!user) {
        throw new ResourceNotFoundException("User", payload.userId);
      }

      // Tạo response
      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Đăng xuất
   */
  async logout(
    userId: string,
    refreshToken: string
  ): Promise<{ success: boolean }> {
    this.logger.log(`Logout attempt for userId: ${userId}`);

    try {
      // Thu hồi refresh token
      const revoked = await this.tokenService.revokeRefreshToken(refreshToken);

      return { success: revoked };
    } catch (error) {
      this.logger.error(
        `Logout failed for userId ${userId}: ${error.message}`,
        error.stack
      );
      return { success: false };
    }
  }

  /**
   * Đăng xuất khỏi tất cả thiết bị
   */
  async logoutFromAllDevices(userId: string): Promise<{ success: boolean }> {
    this.logger.log(`Logout from all devices for userId: ${userId}`);

    try {
      // Thu hồi tất cả refresh token của user
      const revoked = await this.tokenService.revokeAllUserTokens(userId);

      return { success: revoked };
    } catch (error) {
      this.logger.error(
        `Logout from all devices failed for userId ${userId}: ${error.message}`,
        error.stack
      );
      return { success: false };
    }
  }

  /**
   * Xác thực token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Xác thực access token
      await this.tokenService.verifyAccessToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kiểm tra xem token có bị blacklist không
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    return this.tokenService.isTokenBlacklisted(tokenId);
  }

  /**
   * Tạo access token và refresh token
   */
  private async generateAuthTokens(payload: {
    userId: string;
    username?: string;
    email?: string;
    roles: UserRole[];
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Tạo access token
    const accessToken = await this.tokenService.generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    });

    // Tạo refresh token
    const refreshTokenResult = await this.tokenService.generateRefreshToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      deviceId: payload.deviceId,
      userAgent: payload.userAgent,
      ipAddress: payload.ipAddress,
    });

    // Lấy thời gian hết hạn của access token
    const tokenPayload = this.jwtService.decode(accessToken) as JwtPayload;
    const expiresIn = tokenPayload.exp
      ? tokenPayload.exp - Math.floor(Date.now() / 1000)
      : 900; // 15 phút nếu không lấy được

    return {
      accessToken,
      refreshToken: refreshTokenResult.token,
      expiresIn,
    };
  }

  /**
   * Kiểm tra user đã tồn tại chưa (dùng cho đăng ký)
   */
  private async checkUserExists(
    email: string,
    username: string
  ): Promise<boolean> {
    try {
      const result = await this.kafkaService.send<any, boolean>(
        KafkaPattern.USER_EXISTS,
        {
          email,
          username,
        }
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error checking if user exists: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm user theo username hoặc email (dùng cho đăng nhập)
   */
  private async findUserByUsernameOrEmail(
    usernameOrEmail: string
  ): Promise<any> {
    try {
      const user = await this.kafkaService.send(
        KafkaPattern.USER_GET_BY_EMAIL,
        {
          usernameOrEmail,
        }
      );

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by username or email: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm user theo id
   */
  private async findUserById(userId: string): Promise<any> {
    try {
      const user = await this.kafkaService.send(KafkaPattern.USER_GET_BY_ID, {
        id: userId,
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by id: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
