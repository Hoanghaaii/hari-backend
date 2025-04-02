import { Controller, Logger, UseFilters } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { KafkaPattern } from "@app/kafka/constants";
import { KafkaExceptionFilter } from "@app/common/filters";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
} from "@app/common/dto/auth";
import { AuthService } from "../services/auth.service";

@Controller()
@UseFilters(KafkaExceptionFilter)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Xử lý đăng ký
   */
  @MessagePattern(KafkaPattern.AUTH_REGISTER)
  async register(
    @Payload() registerDto: RegisterDto
  ): Promise<AuthResponseDto> {
    this.logger.log(`Processing registration request: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * Xử lý đăng nhập
   */
  @MessagePattern(KafkaPattern.AUTH_LOGIN)
  async login(@Payload() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Processing login request: ${loginDto.usernameOrEmail}`);
    return this.authService.login(loginDto);
  }

  /**
   * Xử lý refresh token
   */
  @MessagePattern(KafkaPattern.AUTH_REFRESH_TOKEN)
  async refreshToken(
    @Payload() refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    this.logger.log("Processing refresh token request");
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Xử lý đăng xuất
   */
  @MessagePattern(KafkaPattern.AUTH_LOGOUT)
  async logout(
    @Payload() payload: { userId: string; refreshToken: string }
  ): Promise<{ success: boolean }> {
    this.logger.log(`Processing logout request for userId: ${payload.userId}`);
    return this.authService.logout(payload.userId, payload.refreshToken);
  }

  /**
   * Xử lý đăng xuất khỏi tất cả thiết bị
   */
  @MessagePattern("auth.logout.all")
  async logoutAll(
    @Payload() payload: { userId: string }
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Processing logout from all devices for userId: ${payload.userId}`
    );
    return this.authService.logoutFromAllDevices(payload.userId);
  }

  /**
   * Xác thực token
   */
  @MessagePattern(KafkaPattern.AUTH_VALIDATE_TOKEN)
  async validateToken(@Payload() payload: { token: string }): Promise<boolean> {
    this.logger.log("Processing token validation request");
    return this.authService.validateToken(payload.token);
  }

  /**
   * Tạo token cho user (dùng trong trường hợp đặc biệt)
   */
  @MessagePattern(KafkaPattern.AUTH_GENERATE_TOKEN)
  async generateToken(
    @Payload()
    payload: {
      userId: string;
      username?: string;
      email?: string;
      roles: string[];
      deviceId?: string;
    }
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    this.logger.log(
      `Processing generate token request for userId: ${payload.userId}`
    );

    // Chuyển đổi roles từ string[] sang UserRole[]
    const userRoles = payload.roles as any[];

    return this.authService["generateAuthTokens"]({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: userRoles,
      deviceId: payload.deviceId,
    });
  }

  /**
   * Kiểm tra token có trong blacklist không
   */
  @MessagePattern("auth.token.blacklist.check")
  async isTokenBlacklisted(
    @Payload() payload: { tokenId: string }
  ): Promise<boolean> {
    return this.authService.isTokenBlacklisted(payload.tokenId);
  }
}
