import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  // Cấu hình chung
  name: process.env.APP_NAME || "Auth Service",
  port: parseInt(process.env.AUTH_SERVICE_PORT || "3003", 10),
  env: process.env.NODE_ENV || "development",
  debug: process.env.DEBUG === "true",

  // Cấu hình JWT
  jwt: {
    secret: process.env.JWT_SECRET || "jwt-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // Cấu hình Redis (nếu sử dụng)
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    ttl: parseInt(process.env.REDIS_TTL || "3600", 10), // 1 hour
    prefix: "auth:",
  },
}));
