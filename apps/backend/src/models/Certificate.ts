import mongoose, { Schema, Document } from 'mongoose';
import { CertificateType } from '@mahallu/shared-types';

export interface CertificateDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  certificateNo: string;
  type: CertificateType;
  recipientId: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  issuedAt: Date;
  expiresAt?: Date;
  pdfUrl?: string;
  publicId?: string;
  data: Record<string, unknown>;
  eSign?: {
    isSigned: boolean;
    signedBy?: string;
    designation?: string;
  };
  eStamp?: {
    isStamped: boolean;
    sealTitle?: string;
  };
  isRevoked: boolean;
}

const CertificateSchema = new Schema<CertificateDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    certificateNo: { type: String, required: true },
    type: { type: String, enum: Object.values(CertificateType), required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    pdfUrl: String,
    publicId: String,
    data: { type: Schema.Types.Mixed, default: {} },
    eSign: {
      isSigned: { type: Boolean, default: true },
      signedBy: { type: String, default: 'Secretary, Mahallu Committee' },
      designation: { type: String, default: 'Authorized Signatory' },
    },
    eStamp: {
      isStamped: { type: Boolean, default: true },
      sealTitle: { type: String, default: 'Official Seal of Mahallu' },
    },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CertificateSchema.index({ tenantId: 1, certificateNo: 1 }, { unique: true });
CertificateSchema.index({ tenantId: 1, recipientId: 1, type: 1 });
CertificateSchema.index({ tenantId: 1, type: 1 });

export const Certificate = mongoose.model<CertificateDocument>('Certificate', CertificateSchema);
