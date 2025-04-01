import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../../enums';
import { PaginationDto } from '../pagination.dto';
import { ToBoolean, ToLowerCase, Trim } from '../../decorators';

/**
 * DTO để filter users
 */
export class FilterUserDto extends PaginationDto {
  @ApiProperty({
    description: 'Username',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  username?: string;

  @ApiProperty({
    description: 'Email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Trim()
  @ToLowerCase()
  email?: string;

  @ApiProperty({
    description: 'First name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  lastName?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Is verified',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  isVerified?: boolean;
}
