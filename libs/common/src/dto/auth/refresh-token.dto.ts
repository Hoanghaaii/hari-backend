import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { JWT_REGEX } from '../../constants';

/**
 * DTO để refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(JWT_REGEX, {
    message: 'Invalid refresh token format',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Device ID (optional)',
    example: 'browser-chrome-windows-UUIDA1B2C3',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  deviceId?: string;
}
