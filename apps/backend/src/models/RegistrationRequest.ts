import mongoose, { Schema, Document } from 'mongoose';

export enum RegistrationType {
  MEMBER = 'MEMBER',
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  SADAR_MUALIM = 'SADAR_MUALIM',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface RegistrationRequestDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  type: RegistrationType;
  status: RegistrationStatus;
  payload: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationRequestSchema = new Schema<RegistrationRequestDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: Object.values(RegistrationType), required: true },
    status: { type: String, enum: Object.values(RegistrationStatus), default: RegistrationStatus.PENDING },
    payload: { type: Schema.Types.Mixed, required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

export const RegistrationRequest = mongoose.model<RegistrationRequestDocument>('RegistrationRequest', RegistrationRequestSchema);
