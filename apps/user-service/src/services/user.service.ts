import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
} from "@app/common/dto/user";
import { CacheService } from "@app/cache";
import { UserStatus } from "@app/common/enums";
import { User, UserDocument } from "../schemas";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly cachePrefix = "user:";

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Tạo người dùng mới
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    console.log(
      "🔍 ~ createUser ~ apps/user-service/src/services/user.service.ts:33 ~ createUserDto:",
      createUserDto
    );

    try {
      // Kiểm tra xem email hoặc username đã tồn tại chưa
      const exists = await this.checkUserExists(
        createUserDto.email,
        createUserDto.username
      );
      if (exists) {
        throw new ConflictException("Email hoặc username đã tồn tại");
      }

      // Tạo user
      const user = new this.userModel(createUserDto);
      const savedUser = await user.save();

      // Xóa cache
      await this.clearUserCache();

      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm người dùng theo ID
   */
  async findUserById(id: string): Promise<UserDocument | null> {
    this.logger.log(`Finding user by ID: ${id}`);

    try {
      // Kiểm tra cache
      const cacheKey = `${this.cachePrefix}id:${id}`;
      const cachedUser = await this.cacheService.get<UserDocument>(cacheKey);

      if (cachedUser) {
        return cachedUser;
      }

      // Tìm trong database
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        return null;
      }

      // Lưu vào cache
      await this.cacheService.set(cacheKey, user, 3600);

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by ID: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm người dùng theo email
   */
  async findUserByEmail(
    email: string,
    includePassword = false
  ): Promise<UserDocument | null> {
    this.logger.log(`Finding user by email: ${email}`);

    try {
      let query = this.userModel.findOne({ email: email.toLowerCase() });

      if (includePassword) {
        query = query.select("+password");
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm người dùng theo username
   */
  async findUserByUsername(
    username: string,
    includePassword = false
  ): Promise<UserDocument | null> {
    this.logger.log(`Finding user by username: ${username}`);

    try {
      let query = this.userModel.findOne({ username: username });

      if (includePassword) {
        query = query.select("+password");
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by username: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm người dùng theo username hoặc email
   */
  async findUserByUsernameOrEmail(
    usernameOrEmail: string,
    includePassword = false
  ): Promise<UserDocument | null> {
    this.logger.log(`Finding user by username or email: ${usernameOrEmail}`);

    try {
      // Check if input is email
      const isEmail = usernameOrEmail.includes("@");

      let query;
      if (isEmail) {
        query = this.userModel.findOne({
          email: usernameOrEmail.toLowerCase(),
        });
      } else {
        query = this.userModel.findOne({ username: usernameOrEmail });
      }

      if (includePassword) {
        query = query.select("+password");
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by username or email: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Tìm danh sách người dùng với filter và phân trang
   */
  async findUsers(filterDto: FilterUserDto): Promise<{
    items: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Finding users with filter: ${JSON.stringify(filterDto)}`);

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        ...filters
      } = filterDto;

      // Xây dựng filter
      const query: any = {};

      if (filters.email) {
        query.email = { $regex: new RegExp(filters.email, "i") };
      }

      if (filters.username) {
        query.username = { $regex: new RegExp(filters.username, "i") };
      }

      if (filters.firstName) {
        query.firstName = { $regex: new RegExp(filters.firstName, "i") };
      }

      if (filters.lastName) {
        query.lastName = { $regex: new RegExp(filters.lastName, "i") };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.role) {
        query.roles = filters.role;
      }

      if (filters.isVerified !== undefined) {
        query.isVerified = filters.isVerified;
      }

      // Thực hiện query
      const sort: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.userModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
        this.userModel.countDocuments(query).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error finding users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin người dùng
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserDocument | null> {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      // Kiểm tra nếu email đã tồn tại
      if (updateUserDto.email) {
        const user = await this.userModel.findById(id).exec();

        if (!user) {
          throw new NotFoundException(
            `Không tìm thấy người dùng với ID: ${id}`
          );
        }

        if (updateUserDto.email !== user.email) {
          const existingEmail = await this.userModel
            .findOne({
              email: updateUserDto.email.toLowerCase(),
              _id: { $ne: id },
            })
            .exec();

          if (existingEmail) {
            throw new ConflictException("Email đã tồn tại");
          }
        }
      }

      // Cập nhật người dùng
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
        .exec();

      if (!updatedUser) {
        return null;
      }

      // Xóa cache
      await this.clearUserCache(id);

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Xóa người dùng
   */
  async deleteUser(id: string): Promise<UserDocument | null> {
    this.logger.log(`Deleting user with ID: ${id}`);

    try {
      const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        return null;
      }

      // Xóa cache
      await this.clearUserCache(id);

      return deletedUser;
    } catch (error) {
      this.logger.error(`Error deleting user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Kiểm tra xem email hoặc username đã tồn tại chưa
   */
  async checkUserExists(email: string, username: string): Promise<boolean> {
    this.logger.log(
      `Checking if user exists with email: ${email} or username: ${username}`
    );

    try {
      const count = await this.userModel
        .countDocuments({
          $or: [{ email: email.toLowerCase() }, { username }],
        })
        .exec();

      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error checking if user exists: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái người dùng
   */
  async updateUserStatus(
    id: string,
    status: UserStatus
  ): Promise<UserDocument | null> {
    this.logger.log(
      `Updating user status to ${status} for user with ID: ${id}`
    );

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: { status } }, { new: true })
        .exec();

      if (!updatedUser) {
        return null;
      }

      // Xóa cache
      await this.clearUserCache(id);

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user status: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Cập nhật xác thực người dùng
   */
  async verifyUser(id: string): Promise<UserDocument | null> {
    this.logger.log(`Verifying user with ID: ${id}`);

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              isVerified: true,
              status: UserStatus.ACTIVE,
            },
          },
          { new: true }
        )
        .exec();

      if (!updatedUser) {
        return null;
      }

      // Xóa cache
      await this.clearUserCache(id);

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error verifying user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật lần đăng nhập cuối
   */
  async updateLastLogin(id: string): Promise<void> {
    this.logger.log(`Updating last login for user with ID: ${id}`);

    try {
      await this.userModel
        .findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } })
        .exec();

      // Xóa cache
      await this.clearUserCache(id);
    } catch (error) {
      this.logger.error(
        `Error updating last login: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Xóa cache cho một người dùng
   */
  private async clearUserCache(userId?: string): Promise<void> {
    try {
      if (userId) {
        await this.cacheService.delete(`${this.cachePrefix}id:${userId}`);
      } else {
        await this.cacheService.deleteByPattern(`${this.cachePrefix}*`);
      }
    } catch (error) {
      this.logger.error(
        `Error clearing user cache: ${error.message}`,
        error.stack
      );
    }
  }
}
