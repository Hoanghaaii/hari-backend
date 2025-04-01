import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../enums';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * DTO cho user profile trong auth response
 */
@Exclude()
export class UserProfileDto {
  @Expose()
  @ApiProperty({
    description: 'User ID',
    example: '5f9f1b9b9c9d9c9d9c9d9c9d',
  })
  id: string;
  
  @Expose()
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;
  
  @Expose()
  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
  })
  email: string;
  
  @Expose()
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  firstName?: string;
  
  @Expose()
  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  lastName?: string;
  
  @Expose()
  @ApiProperty({
    description: 'Is verified',
    example: true,
  })
  isVerified: boolean;
  
  @Expose()
  @ApiProperty({
    description: 'User roles',
    example: [UserRole.USER],
    enum: UserRole,
    isArray: true,
  })
  roles: UserRole[];
}

/**
 * DTO cho authentication response
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Expires in (seconds)',
    example: 900, // 15 minutes
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User profile',
    type: UserProfileDto,
  })
  @Type(() => UserProfileDto)
  user: UserProfileDto;
}
