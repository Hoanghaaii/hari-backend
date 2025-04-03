import { Controller, Logger, UseFilters } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { KafkaExceptionFilter } from "@app/common/filters";
import { KafkaPattern } from "@app/kafka/constants";
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
} from "@app/common/dto/user";
import { UserService } from "../services/user.service";
import { UserDocument } from "../schemas";

@Controller()
@UseFilters(KafkaExceptionFilter)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Tạo người dùng mới
   */
  @MessagePattern(KafkaPattern.USER_CREATE)
  async createUser(@Payload() createUserDto: any): Promise<UserDocument> {
    this.logger.log(`Processing create user request: ${createUserDto.email}`);
    return this.userService.createUser(createUserDto.data);
  }

  /**
   * Lấy người dùng theo ID
   */
  @MessagePattern(KafkaPattern.USER_GET_BY_ID)
  async getUserById(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(`Processing get user by ID request: ${payload.data.id}`);
    return this.userService.findUserById(payload.data.id);
  }

  /**
   * Lấy người dùng theo email hoặc username
   */
  @MessagePattern(KafkaPattern.USER_GET_BY_EMAIL)
  async getUserByEmail(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(
      `Processing get user by email/username request: ${payload.data.data.usernameOrEmail}`
    );
    return this.userService.findUserByUsernameOrEmail(
      payload.data.data.usernameOrEmail,
      payload.data.data.includePassword || false
    );
  }

  /**
   * Tìm kiếm người dùng với filter
   */
  @MessagePattern(KafkaPattern.USER_FIND_ALL)
  async findUsers(@Payload() filterDto: FilterUserDto): Promise<{
    items: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Processing find users request`);
    return this.userService.findUsers(filterDto);
  }

  /**
   * Cập nhật thông tin người dùng
   */
  @MessagePattern(KafkaPattern.USER_UPDATE)
  async updateUser(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(`Processing update user request: ${payload.data.id}`);
    return this.userService.updateUser(payload.data.id, payload.data.data);
  }

  /**
   * Xóa người dùng
   */
  @MessagePattern(KafkaPattern.USER_DELETE)
  async deleteUser(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(`Processing delete user request: ${payload.data.id}`);
    return this.userService.deleteUser(payload.data.id);
  }

  /**
   * Kiểm tra người dùng tồn tại
   */
  @MessagePattern(KafkaPattern.USER_EXISTS)
  async checkUserExists(@Payload() payload: any): Promise<boolean> {
    try {
      this.logger.log(
        `Processing check user exists request: ${payload.data.email}, ${payload.data.username}`
      );
      return this.userService.checkUserExists(
        payload.data.email,
        payload.data.username
      );
    } catch (error) {
      this.logger.error(
        `Error checking user exists: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Cập nhật last login
   */
  @MessagePattern("user.update.last-login")
  async updateLastLogin(@Payload() payload: any): Promise<void> {
    this.logger.log(`Processing update last login request: ${payload.data.id}`);
    return this.userService.updateLastLogin(payload.data.id);
  }

  /**
   * Xác thực người dùng
   */
  @MessagePattern("user.verify")
  async verifyUser(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(`Processing verify user request: ${payload.data.id}`);
    return this.userService.verifyUser(payload.data.id);
  }
}
