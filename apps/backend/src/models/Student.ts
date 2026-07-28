import mongoose, { Schema, Document } from 'mongoose';

export interface StudentDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  admissionNo: string;
  memberId: mongoose.Types.ObjectId;
  madrasaId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  guardianId: mongoose.Types.ObjectId;
  familyId?: mongoose.Types.ObjectId;
  admissionDate: Date;
  status: 'active' | 'promoted' | 'transferred' | 'withdrawn';
  qrCode?: string;
  idCardUrl?: string;
  hifzProgress?: {
    completedJuz: number[];
    currentJuz: number;
    currentSurah: string;
    lastAssessedAt: Date;
  };
  tajweedLevel?: string;
  feePaid: number;
  feeBalance: number;
  isDeleted: boolean;
  deletedAt?: Date;
}

const StudentSchema = new Schema<StudentDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    admissionNo: { type: String, required: true, trim: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    madrasaId: { type: Schema.Types.ObjectId, ref: 'Madrasa', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    guardianId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    admissionDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'promoted', 'transferred', 'withdrawn'],
      default: 'active',
    },
    qrCode: String,
    idCardUrl: String,
    hifzProgress: {
      completedJuz: [{ type: Number }],
      currentJuz: { type: Number, default: 1 },
      currentSurah: String,
      lastAssessedAt: Date,
    },
    tajweedLevel: String,
    feePaid: { type: Number, default: 0 },
    feeBalance: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

StudentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, madrasaId: 1, classId: 1 });
StudentSchema.index({ tenantId: 1, memberId: 1 });
StudentSchema.index({ tenantId: 1, guardianId: 1 });
StudentSchema.index({ tenantId: 1, status: 1 });

export const Student = mongoose.model<StudentDocument>('Student', StudentSchema);
if (!mongoose.models.student) {
  mongoose.model('student', StudentSchema);
}
