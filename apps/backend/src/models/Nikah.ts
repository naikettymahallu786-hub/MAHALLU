import mongoose, { Schema, Document } from 'mongoose';

export interface NikahDocument extends Document {
  tenantId: mongoose.Types.ObjectId; nikahNo: string;
  brideId?: mongoose.Types.ObjectId; brideName: string; brideFatherName: string;
  groomId?: mongoose.Types.ObjectId; groomName: string; groomFatherName: string;
  imamId: mongoose.Types.ObjectId;
  witnesses: Array<{ name: string; memberId?: mongoose.Types.ObjectId; phone?: string }>;
  mehr: number; mehrCurrency: string;
  date: Date; venue?: string;
  documents: Array<{ url: string; fileName?: string; fileType?: string }>;
  certificateId?: mongoose.Types.ObjectId;
}
const NikahSchema = new Schema<NikahDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  nikahNo: { type: String, required: true },
  brideId: { type: Schema.Types.ObjectId, ref: 'Member' },
  brideName: { type: String, required: true }, brideFatherName: { type: String, required: true },
  groomId: { type: Schema.Types.ObjectId, ref: 'Member' },
  groomName: { type: String, required: true }, groomFatherName: { type: String, required: true },
  imamId: { type: Schema.Types.ObjectId, ref: 'Member' },
  witnesses: [{ name: String, memberId: { type: Schema.Types.ObjectId, ref: 'Member' }, phone: String }],
  mehr: { type: Number, required: true }, mehrCurrency: { type: String, default: 'INR' },
  date: { type: Date, required: true }, venue: String,
  documents: [{ url: String, fileName: String, fileType: String }],
  certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
}, { timestamps: true });
NikahSchema.index({ tenantId: 1, nikahNo: 1 }, { unique: true });
export const Nikah = mongoose.model<NikahDocument>('Nikah', NikahSchema);
