import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  name: process.env.APP_NAME || "Hari Backend",
  port: parseInt(process.env.API_GATEWAY_PORT || "3000", 10),
  env: process.env.NODE_ENV || "development",
  debug: process.env.DEBUG === "true",
  url:
    process.env.APP_URL ||
    `http://localhost:${process.env.API_GATEWAY_PORT || "3000"}`,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4000",
  apiPrefix: process.env.API_PREFIX || "api",
}));
