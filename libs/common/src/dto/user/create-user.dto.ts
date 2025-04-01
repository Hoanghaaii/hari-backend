import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PASSWORD_RULES, STRONG_PASSWORD_REGEX, USERNAME_REGEX } from '../../constants';
import { ToLowerCase, Trim } from '../../decorators';

/**
 * DTO để tạo user mới
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 20)
  @Matches(USERNAME_REGEX, {
    message: 'Username chỉ được chứa chữ cái, số và các ký tự _.-',
  })
  @Trim()
  username: string;

  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @Trim()
  @ToLowerCase()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'P@ssw0rd123',
    minLength: PASSWORD_RULES.MIN_LENGTH,
    maxLength: PASSWORD_RULES.MAX_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @Length(PASSWORD_RULES.MIN_LENGTH, PASSWORD_RULES.MAX_LENGTH)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
  })
  password: string;

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
