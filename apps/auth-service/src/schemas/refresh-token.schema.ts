import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

/**
 * Interface để định nghĩa các virtual properties
 */
export interface RefreshToken extends Document {
  tokenHash: string;
  salt: string;
  userId: MongooseSchema.Types.ObjectId;
  isRevoked: boolean;
  expiresAt: Date;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isExpired: boolean;
  isValid: boolean;

  // Methods
  verifyToken(token: string, crypto: any): boolean;
}

@Schema({
  collection: "refresh_tokens",
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.tokenHash;
      delete ret.salt;
      return ret;
    },
  },
})
export class RefreshTokenClass {
  @Prop({
    required: true,
    index: true,
    select: false,
  })
  tokenHash: string;

  @Prop({
    required: true,
    select: false,
  })
  salt: string;

  @Prop({
    required: true,
    index: true,
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isRevoked: boolean;

  @Prop({
    required: true,
    type: Date,
    index: { expireAfterSeconds: 0 },
  })
  expiresAt: Date;

  @Prop({
    type: String,
    required: false,
    index: true,
  })
  deviceId?: string;

  @Prop({
    type: String,
    required: false,
    maxlength: 255,
  })
  userAgent?: string;

  @Prop({
    type: String,
    required: false,
    match: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
  })
  ipAddress?: string;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  lastUsedAt: Date;
}

export type RefreshTokenDocument = RefreshToken;
export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenClass);

// Indexes
RefreshTokenSchema.index({ userId: 1, deviceId: 1 });

// Virtuals
RefreshTokenSchema.virtual("isExpired").get(function (this: RefreshToken) {
  return this.expiresAt < new Date();
});

RefreshTokenSchema.virtual("isValid").get(function (this: RefreshToken) {
  return !this.isRevoked && !this.isExpired;
});

// Methods
RefreshTokenSchema.methods.verifyToken = function (
  this: RefreshToken,
  token: string,
  crypto: any
): boolean {
  const hash = crypto
    .pbkdf2Sync(token, this.salt, 1000, 64, "sha512")
    .toString("hex");
  return this.tokenHash === hash;
};

// Config
RefreshTokenSchema.set("autoIndex", process.env.NODE_ENV !== "production");
