import mongoose, { Schema, Document } from 'mongoose';
import { CertificateType } from '@mahallu/shared-types';

export interface CertificateRequestDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  type: CertificateType;
  purpose: string;
  details?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  certificateId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateRequestSchema = new Schema<CertificateRequestDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    type: { type: String, enum: Object.values(CertificateType), required: true },
    purpose: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    notes: { type: String },
  },
  { timestamps: true }
);

CertificateRequestSchema.index({ tenantId: 1, requestedBy: 1 });
CertificateRequestSchema.index({ tenantId: 1, status: 1 });

export const CertificateRequest = mongoose.model<CertificateRequestDocument>('CertificateRequest', CertificateRequestSchema);
