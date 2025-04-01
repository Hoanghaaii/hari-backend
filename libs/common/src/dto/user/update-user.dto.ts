import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PASSWORD_RULES, STRONG_PASSWORD_REGEX } from '../../constants';
import { ToLowerCase, Trim } from '../../decorators';

/**
 * DTO để cập nhật user
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Trim()
  @ToLowerCase()
  email?: string;

  @ApiProperty({
    description: 'Password',
    example: 'P@ssw0rd123',
    required: false,
    minLength: PASSWORD_RULES.MIN_LENGTH,
    maxLength: PASSWORD_RULES.MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @Length(PASSWORD_RULES.MIN_LENGTH, PASSWORD_RULES.MAX_LENGTH)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
  })
  password?: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Trim()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Trim()
  lastName?: string;
}
