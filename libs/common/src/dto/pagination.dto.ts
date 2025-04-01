import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DEFAULT_PAGINATION } from '../constants';

/**
 * DTO cơ bản cho pagination
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGINATION.PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DEFAULT_PAGINATION.MAX_LIMIT)
  limit?: number = DEFAULT_PAGINATION.LIMIT;

  @IsOptional()
  @IsString()
  sortBy?: string = DEFAULT_PAGINATION.SORT_BY;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = DEFAULT_PAGINATION.SORT_ORDER as 'asc' | 'desc';
}

/**
 * DTO cho pagination response
 */
export class PaginationResponseDto<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
