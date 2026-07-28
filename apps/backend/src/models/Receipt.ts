import mongoose, { Schema, Document } from 'mongoose';

export interface ReceiptDocument extends Document {
  tenantId: mongoose.Types.ObjectId; receiptNo: string;
  paymentId: mongoose.Types.ObjectId; pdfUrl?: string; publicId?: string;
  printedAt?: Date; sentVia?: string[];
}
const ReceiptSchema = new Schema<ReceiptDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  receiptNo: { type: String, required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  pdfUrl: String, publicId: String,
  printedAt: Date, sentVia: [String],
}, { timestamps: true });
ReceiptSchema.index({ tenantId: 1, receiptNo: 1 }, { unique: true });
export const Receipt = mongoose.model<ReceiptDocument>('Receipt', ReceiptSchema);
