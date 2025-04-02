import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  // Cấu hình chung
  name: process.env.APP_NAME || "User Service",
  port: parseInt(process.env.USER_SERVICE_PORT || "3001", 10),
  env: process.env.NODE_ENV || "development",
  debug: process.env.DEBUG === "true",

  // Cấu hình cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "3600", 10), // 1 hour
    prefix: "user:",
  },

  // Cấu hình phân trang
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
}));
