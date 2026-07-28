import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '@mahallu/shared-types';

export interface AttendanceDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  entityType: 'student' | 'teacher' | 'member';
  entityId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  madrasaId?: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedById: mongoose.Types.ObjectId;
  note?: string;
}

const AttendanceSchema = new Schema<AttendanceDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    entityType: { type: String, enum: ['student', 'teacher', 'member'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, refPath: 'entityType' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    madrasaId: { type: Schema.Types.ObjectId, ref: 'Madrasa' },
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(AttendanceStatus), required: true },
    markedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: String,
  },
  { timestamps: true },
);

AttendanceSchema.index({ tenantId: 1, entityId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ tenantId: 1, classId: 1, date: 1 });
AttendanceSchema.index({ tenantId: 1, date: -1 });

export const Attendance = mongoose.model<AttendanceDocument>('Attendance', AttendanceSchema);
