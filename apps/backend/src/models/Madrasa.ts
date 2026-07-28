import mongoose, { Schema, Document } from 'mongoose';

export interface MadrasaDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string; registrationNo?: string;
  principalId?: mongoose.Types.ObjectId;
  address: Record<string, unknown>;
  phone?: string; email?: string;
  classes: mongoose.Types.ObjectId[];
  subjects: string[];
  academicYear: string;
  affiliatedTo?: string;
}

const MadrasaSchema = new Schema<MadrasaDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
  name: { type: String, required: true },
  registrationNo: String,
  principalId: { type: Schema.Types.ObjectId, ref: 'Member' },
  address: { type: Schema.Types.Mixed },
  phone: String, email: String,
  classes: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  subjects: [String],
  academicYear: { type: String, default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` },
  affiliatedTo: String,
}, { timestamps: true });

export const Madrasa = mongoose.model<MadrasaDocument>('Madrasa', MadrasaSchema);
