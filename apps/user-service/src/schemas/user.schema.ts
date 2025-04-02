import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole, UserStatus } from "@app/common/enums";

@Schema({
  collection: "users",
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    index: true,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false, // Không trả về password khi query
  })
  password: string;

  @Prop({
    trim: true,
  })
  firstName?: string;

  @Prop({
    trim: true,
  })
  lastName?: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
    index: true,
  })
  status: UserStatus;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    type: Date,
  })
  lastLoginAt?: Date;

  @Prop({
    type: String,
  })
  avatar?: string;

  @Prop({
    type: String,
  })
  phoneNumber?: string;

  @Prop({
    type: Object,
    default: {},
  })
  settings: Record<string, any>;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, any>;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Thêm indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
