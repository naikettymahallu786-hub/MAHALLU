import mongoose, { Schema, Document } from 'mongoose';

export interface DonationDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId;
  familyId?: mongoose.Types.ObjectId;
  donorName?: string;
  amount: number;
  campaign?: string;
  purpose?: string;
  paymentId: mongoose.Types.ObjectId;
  isAnonymous: boolean;
  receiptId?: mongoose.Types.ObjectId;
  status?: 'pending' | 'paid' | 'partial';
  dueDate?: Date;
}

const DonationSchema = new Schema<DonationDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'Member' },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
  donorName: String,
  amount: { type: Number, required: true, min: 1 },
  campaign: String,
  purpose: String,
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  isAnonymous: { type: Boolean, default: false },
  receiptId: { type: Schema.Types.ObjectId, ref: 'Receipt' },
  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'paid' },
  dueDate: Date,
}, { timestamps: true });

DonationSchema.index({ tenantId: 1, donorId: 1 });
DonationSchema.index({ tenantId: 1, campaign: 1 });
DonationSchema.index({ tenantId: 1, createdAt: -1 });
DonationSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const Donation = mongoose.model<DonationDocument>('Donation', DonationSchema);
