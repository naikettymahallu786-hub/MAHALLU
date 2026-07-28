import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '@mahallu/shared-types';

export interface UserDocument extends Omit<IUser, '_id' | 'tenantId' | 'memberId'>, Document {
  tenantId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.STUDENT,
    },
    passwordHash: { type: String, required: true, select: false },
    refreshTokens: [{ type: String, select: false }],
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    fcmToken: { type: String },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    permissions: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.twoFactorSecret;
        return ret;
      },
    },
  },
);

// Compound indexes for tenant isolation
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
UserSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (this: UserDocument, next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<UserDocument>('User', UserSchema);
