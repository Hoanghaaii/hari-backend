import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Roles } from "@app/rbac/decorators";
import { RolesGuard } from "@app/rbac/guards";
import { UserRole } from "@app/common/enums";
import { CurrentUser } from "@app/common/decorators";
import { IdParamDto, SearchDto, PaginationDto } from "@app/common/dto";
import { LoginDto, RegisterDto, RefreshTokenDto } from "@app/common/dto/auth";
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
} from "@app/common/dto/user";

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // --- Health Check ---
  @Get()
  getInfo() {
    return {
      name: "Hari E-commerce API Gateway",
      version: "1.0.0",
      status: "running",
    };
  }

  @Get("health")
  checkHealth() {
    return this.gatewayService.checkHealth();
  }

  // --- Auth Endpoints ---
  @Post("auth/register")
  async register(@Body() registerDto: RegisterDto) {
    return this.gatewayService.register(registerDto);
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.gatewayService.login(loginDto);
  }

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.gatewayService.refreshToken(refreshTokenDto);
  }

  @Post("auth/logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser("userId") userId: string,
    @Body() body: { refreshToken: string }
  ) {
    return this.gatewayService.logout(userId, body.refreshToken);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user) {
    return user;
  }

  // --- User Endpoints ---
  @Post("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.gatewayService.createUser(createUserDto);
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUsers(@Query() filterDto: FilterUserDto) {
    return this.gatewayService.getUsers(filterDto);
  }

  @Get("users/:id")
  @UseGuards(JwtAuthGuard)
  async getUser(@Param() params: IdParamDto, @CurrentUser() currentUser) {
    // Chỉ admin có thể xem thông tin user khác
    if (
      params.id !== currentUser.userId &&
      !currentUser.roles.some((role) =>
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)
      )
    ) {
      // Return own profile if not admin and trying to access other user
      return this.gatewayService.getUser(currentUser.userId);
    }
    return this.gatewayService.getUser(params.id);
  }

  @Put("users/:id")
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param() params: IdParamDto,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser
  ) {
    // Chỉ admin có thể cập nhật thông tin user khác
    if (
      params.id !== currentUser.userId &&
      !currentUser.roles.some((role) =>
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)
      )
    ) {
      // Only update own profile if not admin and trying to update other user
      return this.gatewayService.updateUser(currentUser.userId, updateUserDto);
    }
    return this.gatewayService.updateUser(params.id, updateUserDto);
  }

  @Delete("users/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteUser(@Param() params: IdParamDto) {
    return this.gatewayService.deleteUser(params.id);
  }

  // --- Product Endpoints ---
  @Get("products")
  async getProducts(@Query() searchDto: SearchDto) {
    return this.gatewayService.getProducts(searchDto);
  }

  @Get("products/:id")
  async getProduct(@Param() params: IdParamDto) {
    return this.gatewayService.getProduct(params.id);
  }

  @Post("products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProduct(
    @Body() createProductDto: any,
    @CurrentUser("userId") userId: string
  ) {
    return this.gatewayService.createProduct({
      ...createProductDto,
      userId,
    });
  }

  @Put("products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateProduct(
    @Param() params: IdParamDto,
    @Body() updateProductDto: any,
    @CurrentUser() currentUser
  ) {
    return this.gatewayService.updateProduct(
      params.id,
      updateProductDto,
      currentUser
    );
  }

  @Delete("products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteProduct(@Param() params: IdParamDto, @CurrentUser() currentUser) {
    return this.gatewayService.deleteProduct(params.id, currentUser);
  }

  // --- Category Endpoints ---
  @Get("categories")
  async getCategories(@Query() paginationDto: PaginationDto) {
    return this.gatewayService.getCategories(paginationDto);
  }

  @Get("categories/:id")
  async getCategory(@Param() params: IdParamDto) {
    return this.gatewayService.getCategory(params.id);
  }

  @Post("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createCategory(@Body() createCategoryDto: any) {
    return this.gatewayService.createCategory(createCategoryDto);
  }

  @Put("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCategory(
    @Param() params: IdParamDto,
    @Body() updateCategoryDto: any
  ) {
    return this.gatewayService.updateCategory(params.id, updateCategoryDto);
  }

  @Delete("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteCategory(@Param() params: IdParamDto) {
    return this.gatewayService.deleteCategory(params.id);
  }
}
