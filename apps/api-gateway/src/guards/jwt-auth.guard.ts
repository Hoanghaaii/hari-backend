import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GatewayService } from "../gateway.service";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private gatewayService: GatewayService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Không tìm thấy token xác thực");
    }

    try {
      const payload = await this.gatewayService.validateToken(token);
      // Gán thông tin user vào request
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
