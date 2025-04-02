export const KAFKA_CONFIG = "KAFKA_CONFIG";
export const KAFKA_CLIENT = "KAFKA_CLIENT";

// Các topic mặc định
export enum KafkaTopic {
  // User topics
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",

  // Auth topics
  USER_REGISTERED = "auth.user.registered",
  USER_LOGGED_IN = "auth.user.logged_in",
  USER_LOGGED_OUT = "auth.user.logged_out",

  // Product topics
  PRODUCT_CREATED = "product.created",
  PRODUCT_UPDATED = "product.updated",
  PRODUCT_DELETED = "product.deleted",

  // Order topics
  ORDER_CREATED = "order.created",
  ORDER_UPDATED = "order.updated",
  ORDER_DELETED = "order.deleted",

  // Notification topics
  NOTIFICATION_SEND = "notification.send",

  // Cache topics
  CACHE_INVALIDATE = "cache.invalidate",
}

// Các pattern mặc định
export enum KafkaPattern {
  // User patterns
  USER_GET_BY_ID = "user.get.by.id",
  USER_GET_BY_EMAIL = "user.get.by.email",
  USER_CREATE = "user.create",
  USER_FIND_ALL = "user.find.all",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",

  // Auth patterns
  AUTH_VALIDATE_TOKEN = "auth.validate.token",
  AUTH_GENERATE_TOKEN = "auth.generate.token",
  AUTH_REFRESH_TOKEN = "auth.refresh.token",
  AUTH_LOGOUT = "auth.logout",
  AUTH_LOGIN = "auth.login",
  AUTH_REGISTER = "auth.register",

  // Product patterns
  PRODUCT_GET_BY_ID = "product.get.by.id",
  PRODUCT_SEARCH = "product.search",
  PRODUCT_CREATE = "product.create",
  PRODUCT_UPDATE = "product.update",
  PRODUCT_DELETE = "product.delete",

  // Category patterns
  CATEGORY_FIND_ALL = "category.findAll",
  CATEGORY_GET_BY_ID = "category.get.by.id",
  CATEGORY_CREATE = "category.create",
  CATEGORY_UPDATE = "category.update",
  CATEGORY_DELETE = "category.delete",

  // Order patterns
  ORDER_GET_BY_ID = "order.get.by.id",
  ORDER_GET_BY_USER = "order.get.by.user",
}

// Các group ID mặc định
export enum KafkaGroupId {
  API_GATEWAY = "api-gateway-group",
  USER_SERVICE = "user-service-group",
  AUTH_SERVICE = "auth-service-group",
  PRODUCT_SERVICE = "product-service-group",
  ORDER_SERVICE = "order-service-group",
  AI_SERVICE = "ai-service-group",
}
