import mongoose, { Schema, Document } from 'mongoose';

export interface SubscriptionDocument extends Document {
  tenantId: mongoose.Types.ObjectId; familyId: mongoose.Types.ObjectId;
  amount: number; period: 'monthly' | 'quarterly' | 'annual';
  startDate: Date; dueDate: Date; status: 'active' | 'overdue' | 'cancelled';
  lastPaidAt?: Date; paymentId?: mongoose.Types.ObjectId;
}
const SubscriptionSchema = new Schema<SubscriptionDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'monthly' },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'overdue', 'cancelled'], default: 'active' },
  lastPaidAt: Date,
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });
SubscriptionSchema.index({ tenantId: 1, familyId: 1 });
export const Subscription = mongoose.model<SubscriptionDocument>('Subscription', SubscriptionSchema);
