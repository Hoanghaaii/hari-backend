import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { KafkaService } from "@app/kafka";
import { MongoDatabaseService } from "@app/database";
import { CacheService } from "@app/cache";
import { KafkaPattern } from "@app/kafka/constants";
import { UnauthorizedException } from "@app/common/exceptions";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
} from "@app/common/dto/auth";
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
} from "@app/common/dto/user";
import { SearchDto, PaginationDto } from "@app/common/dto";
import { Connection } from "mongoose";

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly kafkaService: KafkaService,
    private readonly dbService: MongoDatabaseService,
    private readonly cacheService: CacheService
  ) {}

  // --- Health Check ---
  async checkHealth() {
    const services = {
      database: await this.checkDatabaseHealth(),
      cache: await this.checkCacheHealth(),
      kafka: await this.checkKafkaHealth(),
    };

    const isHealthy = Object.values(services).every(
      (service) => service.status === "up"
    );

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabaseHealth() {
    try {
      const connection: Connection = this.dbService.getConnection(); // Lấy connection từ dbService
      const isConnected = connection.readyState === 1; // Kiểm tra trạng thái kết nối

      // Lấy thông tin chi tiết từ connection
      const connectionDetails = {
        host: connection.host, // Tên host (ví dụ: "localhost")
        port: connection.port, // Cổng (ví dụ: 27017)
        databaseName: connection.name, // Tên database (ví dụ: "hari")
        // Không có connectionString đầy đủ, nhưng có thể tự xây dựng
        reconstructedConnectionString: `mongodb://${connection.host}:${connection.port}/${connection.name}`,
      };

      this.logger.log(
        `Database connection details: ${JSON.stringify(connectionDetails)}`
      );

      return {
        status: isConnected ? "up" : "down",
        message: isConnected ? "Connected" : "Disconnected",
        connectionDetails: {
          host: connection.host,
          port: connection.port,
          databaseName: connection.name,
          reconstructedConnectionString:
            connectionDetails.reconstructedConnectionString,
        },
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: "down",
        message: error.message,
        connectionDetails: null, // Trả về null nếu có lỗi
      };
    }
  }

  private async checkCacheHealth() {
    try {
      // Set key to check connection
      const key = "health-check";
      await this.cacheService.set(key, "ok", 10);
      const value = await this.cacheService.get(key);

      return {
        status: value === "ok" ? "up" : "down",
        message: value === "ok" ? "Connected" : "Disconnected",
      };
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`);
      return {
        status: "down",
        message: error.message,
      };
    }
  }

  private async checkKafkaHealth() {
    try {
      const client = this.kafkaService.getClient();
      // Just check if client exists
      const isConnected = !!client;

      return {
        status: isConnected ? "up" : "down",
        message: isConnected ? "Connected" : "Disconnected",
      };
    } catch (error) {
      this.logger.error(`Kafka health check failed: ${error.message}`);
      return {
        status: "down",
        message: error.message,
      };
    }
  }

  // --- Auth Service ---
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      return await this.kafkaService.send(
        KafkaPattern.AUTH_REGISTER,
        registerDto
      );
    } catch (error) {
      this.logger.error(`Error registering user: ${error.message}`);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      return await this.kafkaService.send(KafkaPattern.AUTH_LOGIN, loginDto);
    } catch (error) {
      this.logger.error(`Error logging in: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    try {
      return await this.kafkaService.send(
        KafkaPattern.AUTH_REFRESH_TOKEN,
        refreshTokenDto
      );
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`);
      throw error;
    }
  }

  async logout(
    userId: string,
    refreshToken: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.kafkaService.send(KafkaPattern.AUTH_LOGOUT, {
        userId,
        refreshToken,
      });
    } catch (error) {
      this.logger.error(`Error logging out: ${error.message}`);
      throw error;
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      // Xác minh token
      const payload = this.jwtService.verify(token);

      // Kiểm tra với auth-service nếu token hợp lệ
      const isValid = await this.kafkaService.send(
        KafkaPattern.AUTH_VALIDATE_TOKEN,
        { token }
      );

      if (!isValid) {
        throw new UnauthorizedException("Invalid token");
      }

      return payload;
    } catch (error) {
      this.logger.error(`Error validating token: ${error.message}`);
      throw new UnauthorizedException("Invalid token");
    }
  }

  // --- User Service ---
  async createUser(createUserDto: CreateUserDto) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.USER_CREATE,
        createUserDto
      );
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  async getUsers(filterDto: FilterUserDto) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.USER_FIND_ALL,
        filterDto
      );
    } catch (error) {
      this.logger.error(`Error finding users: ${error.message}`);
      throw error;
    }
  }

  async getUser(id: string) {
    try {
      return await this.kafkaService.send(KafkaPattern.USER_GET_BY_ID, { id });
    } catch (error) {
      this.logger.error(`Error finding user: ${error.message}`);
      throw error;
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.kafkaService.send(KafkaPattern.USER_UPDATE, {
        id,
        data: updateUserDto,
      });
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      return await this.kafkaService.send(KafkaPattern.USER_DELETE, { id });
    } catch (error) {
      this.logger.error(`Error removing user: ${error.message}`);
      throw error;
    }
  }

  // --- Product Service ---
  async getProducts(searchDto: SearchDto) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.PRODUCT_SEARCH,
        searchDto
      );
    } catch (error) {
      this.logger.error(`Error finding products: ${error.message}`);
      throw error;
    }
  }

  async getProduct(id: string) {
    try {
      return await this.kafkaService.send(KafkaPattern.PRODUCT_GET_BY_ID, {
        id,
      });
    } catch (error) {
      this.logger.error(`Error finding product: ${error.message}`);
      throw error;
    }
  }

  async createProduct(createProductDto: any) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.PRODUCT_CREATE,
        createProductDto
      );
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`);
      throw error;
    }
  }

  async updateProduct(id: string, updateProductDto: any, currentUser: any) {
    try {
      // Include the current user in the request to check ownership in the product service
      return await this.kafkaService.send(KafkaPattern.PRODUCT_UPDATE, {
        id,
        data: updateProductDto,
        userId: currentUser.userId,
        roles: currentUser.roles,
      });
    } catch (error) {
      this.logger.error(`Error updating product: ${error.message}`);
      throw error;
    }
  }

  async deleteProduct(id: string, currentUser: any) {
    try {
      // Include the current user in the request to check ownership in the product service
      return await this.kafkaService.send(KafkaPattern.PRODUCT_DELETE, {
        id,
        userId: currentUser.userId,
        roles: currentUser.roles,
      });
    } catch (error) {
      this.logger.error(`Error removing product: ${error.message}`);
      throw error;
    }
  }

  // --- Category Service ---
  async getCategories(paginationDto: PaginationDto) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.CATEGORY_FIND_ALL,
        paginationDto
      );
    } catch (error) {
      this.logger.error(`Error finding categories: ${error.message}`);
      throw error;
    }
  }

  async getCategory(id: string) {
    try {
      return await this.kafkaService.send(KafkaPattern.CATEGORY_GET_BY_ID, {
        id,
      });
    } catch (error) {
      this.logger.error(`Error finding category: ${error.message}`);
      throw error;
    }
  }

  async createCategory(createCategoryDto: any) {
    try {
      return await this.kafkaService.send(
        KafkaPattern.CATEGORY_CREATE,
        createCategoryDto
      );
    } catch (error) {
      this.logger.error(`Error creating category: ${error.message}`);
      throw error;
    }
  }

  async updateCategory(id: string, updateCategoryDto: any) {
    try {
      return await this.kafkaService.send(KafkaPattern.CATEGORY_UPDATE, {
        id,
        data: updateCategoryDto,
      });
    } catch (error) {
      this.logger.error(`Error updating category: ${error.message}`);
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      return await this.kafkaService.send(KafkaPattern.CATEGORY_DELETE, { id });
    } catch (error) {
      this.logger.error(`Error removing category: ${error.message}`);
      throw error;
    }
  }
}
