import mongoose, { Schema, Document } from 'mongoose';
import { IMember, Gender, MemberStatus } from '@mahallu/shared-types';

export interface MemberDocument extends Omit<IMember, '_id' | 'tenantId' | 'familyId' | 'userId' | 'dateOfBirth'>, Document {
  tenantId: mongoose.Types.ObjectId;
  familyId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
}

const FileAttachmentSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  size: { type: Number },
}, { _id: false });

const MemberSchema = new Schema<MemberDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    nameML: { type: String, trim: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    photo: FileAttachmentSchema,
    aadhaarNumber: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    occupation: { type: String, trim: true },
    qualification: { type: String, trim: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    relationship: { type: String },
    status: { type: String, enum: Object.values(MemberStatus), default: MemberStatus.ACTIVE },
    qrCode: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// Compound indexes
MemberSchema.index({ tenantId: 1, memberId: 1 }, { unique: true });
MemberSchema.index({ tenantId: 1, phone: 1 });
MemberSchema.index({ tenantId: 1, status: 1 });
MemberSchema.index({ tenantId: 1, familyId: 1 });
MemberSchema.index({ tenantId: 1, name: 'text', nameML: 'text' }); // Full-text search

// Virtual: age
MemberSchema.virtual('age').get(function (this: MemberDocument) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

export const Member = mongoose.model<MemberDocument>('Member', MemberSchema);
if (!mongoose.models.member) {
  mongoose.model('member', MemberSchema);
}
