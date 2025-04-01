import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "../interfaces/response.interface";

/**
 * Interceptor để tự động bọc phản hồi từ controllers
 *
 * Kiểm tra nếu controller đã trả về định dạng chuẩn { status, statusCode, ... }
 * Nếu chưa, tự động bọc phản hồi vào định dạng chuẩn
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Nhận Request để lấy đường dẫn
        const req = context.switchToHttp().getRequest();
        const path = req?.url || "";

        // Nếu phản hồi đã là ApiResponse (đã có thuộc tính status), giữ nguyên
        if (
          data &&
          typeof data === "object" &&
          "status" in data &&
          (data.status === "success" || data.status === "error")
        ) {
          return data;
        }

        // Nếu response có _statusCode, _message hoặc _data (định dạng đặc biệt)
        if (data && typeof data === "object") {
          const {
            _statusCode,
            _message,
            _data,
            _requestId,
            _metadata,
            ...rest
          } = data as any;

          // Nếu có _data hoặc _statusCode hoặc _message, sử dụng chúng
          if (
            _data !== undefined ||
            _statusCode !== undefined ||
            _message !== undefined
          ) {
            return {
              status: "success",
              statusCode: _statusCode || HttpStatus.OK,
              message: _message || "Success",
              data: _data !== undefined ? _data : rest,
              metadata: {
                timestamp: new Date().toISOString(),
                path,
                requestId: _requestId || `req-${Date.now()}`,
                ..._metadata,
              },
            };
          }
        }

        // Mặc định, bọc phản hồi vào định dạng chuẩn
        return {
          status: "success",
          statusCode: HttpStatus.OK,
          message: "Success",
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            path,
          },
        };
      })
    );
  }
}
