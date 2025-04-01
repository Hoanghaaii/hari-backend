# Hari Backend

Hệ thống thương mại điện tử (e-commerce) xây dựng trên kiến trúc microservices, sử dụng NestJS làm framework chính và Kafka làm message broker.

## Cấu trúc Dự án

Dự án được tổ chức theo mô hình monorepo, gồm hai phần chính:

### 1. Apps (Các ứng dụng)

- **API Gateway**: Cổng giao tiếp với client, điều hướng request đến các service tương ứng
- **Auth Service**: Xử lý xác thực, phân quyền, quản lý token
- **User Service**: Quản lý thông tin người dùng
- **Product Service**: Quản lý sản phẩm và danh mục sản phẩm
- **AI Service**: Tích hợp AI (Gemini) để tạo nội dung thông minh

### 2. Libs (Thư viện dùng chung)

- **Common**: Chứa các module, service, decorator, filter dùng chung giữa các service
  - Kafka Module: Cấu hình và quản lý kết nối Kafka
  - Validation: Xử lý validate dữ liệu
  - DTO: Định nghĩa các Data Transfer Objects
  - Filters: Xử lý lỗi
  - RBAC: Cấu hình phân quyền

## Công nghệ sử dụng

- **Backend Framework**: NestJS
- **Database**: MongoDB với Mongoose
- **Message Broker**: Kafka
- **Cache**: Redis
- **Authentication**: JWT, Passport.js
- **AI Integration**: Google Generative AI (Gemini)

## Yêu cầu hệ thống

- Node.js >= 18
- Docker và Docker Compose
- MongoDB
- Kafka
- Redis

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/yourusername/hari-backend.git
cd hari-backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env từ .env.example:
```bash
cp .env.example .env
```

4. Cập nhật các biến môi trường trong file .env

5. Chạy hệ thống với Docker Compose:
```bash
docker-compose up -d
```

## Phát triển

1. Chạy các service riêng lẻ:
```bash
# API Gateway
npm run start:dev api-gateway

# User Service
npm run start:dev user-service

# Product Service
npm run start:dev product-service

# Auth Service
npm run start:dev auth-service

# AI Service
npm run start:dev ai-service
```

2. Chạy tests:
```bash
npm run test
```

## API Documentation

API documentation được cung cấp thông qua Swagger UI tại:
- API Gateway: http://localhost:3000/api

## License

MIT 