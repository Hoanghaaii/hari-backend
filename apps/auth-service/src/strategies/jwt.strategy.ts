import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { AuthService } from "../services/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    // Kiểm tra xem token có trong blacklist hay không
    const isBlacklisted = await this.authService.isTokenBlacklisted(
      payload.jti
    );
    if (isBlacklisted) {
      throw new UnauthorizedException("Token đã bị vô hiệu hóa");
    }

    // Kiểm tra nếu là refresh token
    if (payload.type === "refresh") {
      throw new UnauthorizedException(
        "Không thể sử dụng refresh token cho xác thực"
      );
    }

    // Trả về payload để gắn vào request.user
    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
