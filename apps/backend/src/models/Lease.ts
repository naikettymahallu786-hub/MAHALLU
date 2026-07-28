import mongoose, { Schema, Document } from 'mongoose';
import { LeaseStatus } from '@mahallu/shared-types';

export interface LeaseDocument extends Document {
  tenantId: mongoose.Types.ObjectId; propertyId: mongoose.Types.ObjectId;
  tenantMemberId: mongoose.Types.ObjectId; startDate: Date; endDate: Date;
  rentAmount: number; status: LeaseStatus;
  rentHistory: Array<{ month: string; amount: number; paidAt: Date; paymentId: mongoose.Types.ObjectId }>;
  documents: Array<{ url: string; fileName?: string }>;
}
const LeaseSchema = new Schema<LeaseDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  tenantMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentAmount: { type: Number, required: true },
  status: { type: String, enum: Object.values(LeaseStatus), default: LeaseStatus.PENDING },
  rentHistory: [{ month: String, amount: Number, paidAt: Date, paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' } }],
  documents: [{ url: String, fileName: String }],
}, { timestamps: true });
LeaseSchema.index({ tenantId: 1, propertyId: 1 });
export const Lease = mongoose.model<LeaseDocument>('Lease', LeaseSchema);
