import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from './pagination.dto';

/**
 * DTO cơ bản cho search
 */
export class SearchDto extends PaginationDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    required: false,
    minLength: 1,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  q?: string;
}
