import mongoose, { Schema, Document } from 'mongoose';

export interface ZakatDocument extends Document {
  tenantId: mongoose.Types.ObjectId; year: number;
  totalCollected: number; totalDistributed: number;
  applicants: Array<{
    memberId: mongoose.Types.ObjectId; amountRequested: number; amountApproved?: number;
    status: 'pending' | 'approved' | 'rejected' | 'distributed'; notes?: string;
    verifiedBy?: mongoose.Types.ObjectId; verifiedAt?: Date;
  }>;
  status: 'open' | 'closed';
}
const ZakatSchema = new Schema<ZakatDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  year: { type: Number, required: true },
  totalCollected: { type: Number, default: 0 },
  totalDistributed: { type: Number, default: 0 },
  applicants: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    amountRequested: Number, amountApproved: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'distributed'], default: 'pending' },
    notes: String, verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }, verifiedAt: Date,
  }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });
ZakatSchema.index({ tenantId: 1, year: 1 }, { unique: true });
export const Zakat = mongoose.model<ZakatDocument>('Zakat', ZakatSchema);
