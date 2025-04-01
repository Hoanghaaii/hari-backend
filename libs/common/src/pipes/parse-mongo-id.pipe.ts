import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MONGO_ID_REGEX } from '../constants';

/**
 * Pipe để validate và chuyển đổi string thành MongoDB ObjectId
 */
@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    // Validate MongoDB ID format
    if (!MONGO_ID_REGEX.test(value)) {
      throw new BadRequestException(`${value} không phải là ID hợp lệ`);
    }

    // Chuyển đổi string thành ObjectId
    return new Types.ObjectId(value);
  }
}
