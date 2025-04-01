import { Document, Types } from 'mongoose';

/**
 * Interface cơ bản cho tất cả MongoDB documents
 */
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
