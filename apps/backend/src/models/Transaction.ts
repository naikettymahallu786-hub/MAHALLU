import mongoose, { Schema, Document } from 'mongoose';

export interface TransactionDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  date: Date;
  description: string;
  referenceNo?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    referenceNo: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TransactionSchema.index({ tenantId: 1, date: -1 });
TransactionSchema.index({ tenantId: 1, type: 1, date: -1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
