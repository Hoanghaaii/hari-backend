import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";
import { Trim } from "../../decorators";

/**
 * DTO để đăng nhập
 */
export class LoginDto {
  @ApiProperty({
    description: "Username hoặc email",
    example: "johndoe@example.com",
  })
  @IsNotEmpty()
  @IsString()
  @Trim()
  usernameOrEmail: string;

  @ApiProperty({
    description: "Password",
    example: "P@ssw0rd123",
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: "Device ID (optional)",
    example: "browser-chrome-windows-UUIDA1B2C3",
    required: false,
  })
  @IsString()
  @IsOptional() // Thêm decorator này để rõ ràng rằng trường là tùy chọn
  deviceId?: string;

  @ApiProperty({
    description: "User agent string",
    example: "useragent",
    required: false,
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: "IP address",
    example: "ip address",
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}
