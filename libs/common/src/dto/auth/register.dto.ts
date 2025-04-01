import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateUserDto } from '../user/create-user.dto';

/**
 * DTO để đăng ký
 * Mở rộng từ CreateUserDto và thêm các trường cho registration
 */
export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: 'Device ID (optional)',
    example: 'browser-chrome-windows-UUIDA1B2C3',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: 'User Agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @ApiProperty({
    description: 'IP Address',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
