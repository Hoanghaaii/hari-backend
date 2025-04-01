import { Logger } from '@nestjs/common';
import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, Types } from 'mongoose';
import { DatabaseException } from '@app/common/exceptions';
import { BaseDocument } from '../interfaces/base-document.interface';

/**
 * Repository cơ bản định nghĩa các phương thức CRUD
 */
export abstract class BaseRepository<T extends BaseDocument> {
  protected readonly logger: Logger;
  
  constructor(protected readonly model: Model<T>) {
    this.logger = new Logger(this.constructor.name);
  }
  
  /**
   * Tạo một document mới
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = new this.model(data);
      return (await entity.save()).toObject() as unknown as T;
    } catch (error) {
      this.logger.error(`Error creating document: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Tạo nhiều documents
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    try {
      const result = await this.model.insertMany(data);
      return result.map(doc => doc.toObject()) as unknown as T[];
    } catch (error) {
      this.logger.error(`Error creating multiple documents: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Tìm một document theo filter
   */
  async findOne(filter: FilterQuery<T>, projection?: any): Promise<T | null> {
    try {
      const doc = await this.model.findOne(filter, projection).exec();
      return doc ? (doc.toObject() as unknown as T) : null;
    } catch (error) {
      this.logger.error(`Error finding document: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Tìm một document theo ID
   */
  async findById(id: string | Types.ObjectId, projection?: any): Promise<T | null> {
    try {
      const doc = await this.model.findById(id, projection).exec();
      return doc ? (doc.toObject() as unknown as T) : null;
    } catch (error) {
      this.logger.error(`Error finding document by ID: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Tìm nhiều documents theo filter
   */
  async find(
    filter: FilterQuery<T> = {},
    options: {
      projection?: any;
      sort?: any;
      limit?: number;
      skip?: number;
      populate?: string | string[];
    } = {},
  ): Promise<T[]> {
    try {
      let query = this.model.find(filter, options.projection);
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      const docs = await query.exec();
      return docs.map(doc => doc.toObject()) as unknown as T[];
    } catch (error) {
      this.logger.error(`Error finding documents: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Đếm số lượng documents phù hợp với filter
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      this.logger.error(`Error counting documents: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Lấy documents với phân trang
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      projection?: any;
      populate?: string | string[];
    } = {},
  ): Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      const [items, total] = await Promise.all([
        this.find(filter, {
          projection: options.projection,
          sort: options.sort,
          skip,
          limit,
          populate: options.populate,
        }),
        this.count(filter),
      ]);
      
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error finding documents with pagination: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Cập nhật một document theo filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    try {
      const doc = await this.model.findOneAndUpdate(filter, update, options).exec();
      return doc ? (doc.toObject() as unknown as T) : null;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Cập nhật một document theo ID
   */
  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    try {
      const doc = await this.model.findByIdAndUpdate(id, update, options).exec();
      return doc ? (doc.toObject() as unknown as T) : null;
    } catch (error) {
      this.logger.error(`Error updating document by ID: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Cập nhật nhiều documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await this.model.updateMany(filter, update).exec();
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error(`Error updating multiple documents: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Xóa một document theo filter
   */
  async deleteOne(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.model.deleteOne(filter).exec();
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Xóa một document theo ID
   */
  async deleteById(id: string | Types.ObjectId): Promise<T | null> {
    try {
      const doc = await this.model.findByIdAndDelete(id).exec();
      return doc ? (doc.toObject() as unknown as T) : null;
    } catch (error) {
      this.logger.error(`Error deleting document by ID: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
  
  /**
   * Xóa nhiều documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.model.deleteMany(filter).exec();
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.logger.error(`Error deleting multiple documents: ${error.message}`);
      throw DatabaseException.fromMongoError(error);
    }
  }
}
