import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from '@mahallu/shared-types';

export interface TenantDocument extends Omit<ITenant, '_id'>, Document {}

const TenantSchema = new Schema<TenantDocument>(
  {
    name: { type: String, required: true, trim: true },
    mahalluCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    domain: { type: String, lowercase: true, trim: true },
    logo: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Kerala' },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      gps: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      language: { type: String, enum: ['en', 'ml', 'ar'], default: 'ml' },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      prayerTimeMethod: { type: String, default: '1' },
      iqamahTimes: { type: Map, of: String },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

TenantSchema.index({ email: 1 });

export const Tenant = mongoose.model<TenantDocument>('Tenant', TenantSchema);
