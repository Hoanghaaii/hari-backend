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
  async createUser(
    @Payload() createUserDto: CreateUserDto
  ): Promise<UserDocument> {
    this.logger.log(`Processing create user request: ${createUserDto.email}`);
    return this.userService.createUser(createUserDto);
  }

  /**
   * Lấy người dùng theo ID
   */
  @MessagePattern(KafkaPattern.USER_GET_BY_ID)
  async getUserById(
    @Payload() payload: { id: string }
  ): Promise<UserDocument | null> {
    this.logger.log(`Processing get user by ID request: ${payload.id}`);
    return this.userService.findUserById(payload.id);
  }

  /**
   * Lấy người dùng theo email hoặc username
   */
  @MessagePattern(KafkaPattern.USER_GET_BY_EMAIL)
  async getUserByEmail(@Payload() payload: any): Promise<UserDocument | null> {
    this.logger.log(
      `Processing get user by email/username request: ${payload.data.usernameOrEmail}`
    );
    return this.userService.findUserByUsernameOrEmail(
      payload.data.usernameOrEmail,
      payload.data.includePassword || false
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
  async updateUser(
    @Payload() payload: { id: string; data: UpdateUserDto }
  ): Promise<UserDocument | null> {
    this.logger.log(`Processing update user request: ${payload.id}`);
    return this.userService.updateUser(payload.id, payload.data);
  }

  /**
   * Xóa người dùng
   */
  @MessagePattern(KafkaPattern.USER_DELETE)
  async deleteUser(
    @Payload() payload: { id: string }
  ): Promise<UserDocument | null> {
    this.logger.log(`Processing delete user request: ${payload.id}`);
    return this.userService.deleteUser(payload.id);
  }

  /**
   * Kiểm tra người dùng tồn tại
   */
  @MessagePattern(KafkaPattern.USER_EXISTS)
  async checkUserExists(
    @Payload() payload: { email: string; username: string }
  ): Promise<boolean> {
    this.logger.log(
      `Processing check user exists request: ${payload.email}, ${payload.username}`
    );
    return this.userService.checkUserExists(payload.email, payload.username);
  }

  /**
   * Cập nhật last login
   */
  @MessagePattern("user.update.last-login")
  async updateLastLogin(@Payload() payload: { id: string }): Promise<void> {
    this.logger.log(`Processing update last login request: ${payload.id}`);
    return this.userService.updateLastLogin(payload.id);
  }

  /**
   * Xác thực người dùng
   */
  @MessagePattern("user.verify")
  async verifyUser(
    @Payload() payload: { id: string }
  ): Promise<UserDocument | null> {
    this.logger.log(`Processing verify user request: ${payload.id}`);
    return this.userService.verifyUser(payload.id);
  }
}
