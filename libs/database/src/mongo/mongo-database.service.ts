import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { DatabaseException } from '@app/common/exceptions';

@Injectable()
export class MongoDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(MongoDatabaseService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Chạy khi module được khởi tạo
   */
  async onModuleInit() {
    this.logger.log('Checking MongoDB connection...');
    if (this.connection.readyState === 1) {
      this.logger.log('MongoDB connected successfully');
    } else {
      this.logger.error('MongoDB connection failed');
    }
  }

  /**
   * Lấy connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Tạo ObjectId từ string
   */
  createObjectId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch (error) {
      throw new DatabaseException(`Invalid ObjectId: ${id}`);
    }
  }

  /**
   * Kiểm tra xem chuỗi có phải là ObjectId hợp lệ không
   */
  isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  /**
   * Bắt đầu một session
   */
  async startSession() {
    return this.connection.startSession();
  }

  /**
   * Chạy transaction
   */
  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      const result = await callback();
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
