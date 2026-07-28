import mongoose, { Schema, Document } from 'mongoose';

export interface ExamDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  madrasaId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  title: string;
  subjects: string[];
  date: Date;
  totalMarks: number;
  passMark: number;
  results: Array<{
    studentId: mongoose.Types.ObjectId;
    marks: Array<{ subject: string; marksObtained: number; totalMarks: number }>;
    totalObtained: number;
    percentage: number;
    grade: string;
    isPassed: boolean;
    remarks?: string;
  }>;
  isPublished: boolean;
}

const ExamSchema = new Schema<ExamDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  madrasaId: { type: Schema.Types.ObjectId, ref: 'Madrasa', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  subjects: [String],
  date: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  passMark: { type: Number, required: true },
  results: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    marks: [{ subject: String, marksObtained: Number, totalMarks: Number }],
    totalObtained: Number,
    percentage: Number,
    grade: String,
    isPassed: Boolean,
    remarks: String,
  }],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

ExamSchema.index({ tenantId: 1, classId: 1, date: -1 });

export const Exam = mongoose.model<ExamDocument>('Exam', ExamSchema);
