import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationException } from '../exceptions';

/**
 * Pipe để validate các DTO
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Nếu không có metatype hoặc không cần validate
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Chuyển đổi plain object thành instance của class
    const object = plainToInstance(metatype, value);

    // Validate object
    const errors = await validate(object, {
      whitelist: true, // Loại bỏ các thuộc tính không được khai báo
      forbidNonWhitelisted: true, // Báo lỗi nếu có thuộc tính không được khai báo
      forbidUnknownValues: true, // Ngăn chặn giá trị không được khai báo
      validationError: {
        target: false, // Không trả về object gốc
        value: false, // Không trả về giá trị đã nhập
      },
    });

    // Nếu không có lỗi
    if (errors.length === 0) {
      return object;
    }

    // Xử lý và trả về lỗi
    const formattedErrors = errors.map((error) => {
      // Extract constraint messages
      const constraints = error.constraints
        ? Object.values(error.constraints)
        : ['Invalid value'];

      return {
        property: error.property,
        messages: constraints,
      };
    });

    this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);
    
    throw new ValidationException('Dữ liệu không hợp lệ', { errors: formattedErrors });
  }

  /**
   * Kiểm tra xem có cần validate không
   */
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.some((type) => metatype === type);
  }
}
