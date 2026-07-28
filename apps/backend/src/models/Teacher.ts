import mongoose, { Schema, Document } from 'mongoose';

export interface TeacherDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  madrasaId: mongoose.Types.ObjectId;
  employeeId: string;
  subjects: string[];
  qualification: string;
  experience?: number;
  salary: number;
  joiningDate: Date;
  status: 'active' | 'resigned' | 'terminated';
  documents: Array<{ url: string; publicId?: string; fileName?: string; fileType?: string; size?: number }>;
  bankAccount?: { bankName: string; accountNo: string; ifscCode: string; accountType: string };
  assignedStudents?: mongoose.Types.ObjectId[];
  schedule?: Array<{ day: string; startTime: string; endTime: string; subject: string }>;
}

const TeacherSchema = new Schema<TeacherDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  madrasaId: { type: Schema.Types.ObjectId, ref: 'Madrasa', required: true },
  employeeId: { type: String, required: true },
  subjects: [String],
  qualification: { type: String, required: true },
  experience: Number,
  salary: { type: Number, required: true },
  joiningDate: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['active', 'resigned', 'terminated'], default: 'active' },
  documents: [{ url: String, publicId: String, fileName: String, fileType: String, size: Number }],
  bankAccount: { bankName: String, accountNo: String, ifscCode: String, accountType: String },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  schedule: [{ day: String, startTime: String, endTime: String, subject: String }],
}, { timestamps: true });

TeacherSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
TeacherSchema.index({ tenantId: 1, madrasaId: 1 });

export const Teacher = mongoose.model<TeacherDocument>('Teacher', TeacherSchema);
if (!mongoose.models.teacher) {
  mongoose.model('teacher', TeacherSchema);
}
