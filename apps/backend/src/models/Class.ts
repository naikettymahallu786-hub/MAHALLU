import mongoose, { Schema, Document } from 'mongoose';

// Class model
export interface ClassDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  madrasaId: mongoose.Types.ObjectId;
  name: string;
  level: number;
  teacherId?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  subjects: string[];
  schedule: Array<{ day: string; startTime: string; endTime: string; subject: string }>;
  academicYear: string;
}

const ClassSchema = new Schema<ClassDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  madrasaId: { type: Schema.Types.ObjectId, ref: 'Madrasa', required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  subjects: [String],
  schedule: [{ day: String, startTime: String, endTime: String, subject: String }],
  academicYear: String,
}, { timestamps: true });

ClassSchema.index({ tenantId: 1, madrasaId: 1, name: 1 }, { unique: true });

export const Class = mongoose.model<ClassDocument>('Class', ClassSchema);
