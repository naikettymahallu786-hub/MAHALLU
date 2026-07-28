import mongoose, { Schema, Document } from 'mongoose';

export interface HomeworkDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  subject: string;
  title: string;
  description?: string;
  dueDate: Date;
  attachments: Array<{ url: string; fileName: string; fileType: string }>;
  submissions: Array<{
    studentId: mongoose.Types.ObjectId;
    submittedAt: Date;
    attachments: Array<{ url: string; fileName: string }>;
    grade?: number;
    feedback?: string;
    gradedAt?: Date;
  }>;
}

const HomeworkSchema = new Schema<HomeworkDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  attachments: [{ url: String, fileName: String, fileType: String }],
  submissions: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: { type: Date, default: Date.now },
    attachments: [{ url: String, fileName: String }],
    grade: Number,
    feedback: String,
    gradedAt: Date,
  }],
}, { timestamps: true });

HomeworkSchema.index({ tenantId: 1, classId: 1, dueDate: -1 });
HomeworkSchema.index({ tenantId: 1, teacherId: 1 });

export const Homework = mongoose.model<HomeworkDocument>('Homework', HomeworkSchema);
