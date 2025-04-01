import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import { MONGO_ID_REGEX } from '../constants';

/**
 * DTO để validate ID trong params
 */
export class IdParamDto {
  @ApiProperty({
    description: 'MongoDB ObjectId',
    example: '5f7d337c69cc2140dc9a509a',
  })
  @IsNotEmpty()
  @Matches(MONGO_ID_REGEX, {
    message: 'id must be a valid MongoDB ObjectId',
  })
  id: string;
}
