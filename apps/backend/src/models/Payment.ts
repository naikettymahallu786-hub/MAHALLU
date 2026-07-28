import mongoose, { Schema, Document } from 'mongoose';
import { PaymentType, PaymentStatus, PaymentGateway } from '@mahallu/shared-types';

export interface PaymentDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  paymentNo: string;
  type: PaymentType;
  amount: number;
  paidById: mongoose.Types.ObjectId;
  paidForId?: mongoose.Types.ObjectId;
  gateway: PaymentGateway;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  status: PaymentStatus;
  description?: string;
  receiptId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt?: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    paymentNo: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidById: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    paidForId: { type: Schema.Types.ObjectId, ref: 'Member' },
    gateway: { type: String, enum: Object.values(PaymentGateway), required: true },
    gatewayPaymentId: String,
    gatewayOrderId: String,
    gatewaySignature: String,
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    description: String,
    receiptId: { type: Schema.Types.ObjectId, ref: 'Receipt' },
    metadata: { type: Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

PaymentSchema.index({ tenantId: 1, paymentNo: 1 }, { unique: true });
PaymentSchema.index({ tenantId: 1, status: 1 });
PaymentSchema.index({ tenantId: 1, type: 1 });
PaymentSchema.index({ tenantId: 1, paidById: 1 });
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, status: 1, type: 1 });
PaymentSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
PaymentSchema.index({ gatewayPaymentId: 1 }, { sparse: true });

export const Payment = mongoose.model<PaymentDocument>('Payment', PaymentSchema);
