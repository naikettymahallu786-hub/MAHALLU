import mongoose, { Schema, Document } from 'mongoose';

export interface IImportExportLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  type: 'IMPORT' | 'EXPORT';
  entity: string;
  fileName: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  totalRecords: number;
  successCount: number;
  failedCount: number;
  errorDetails: Array<{ row: number; message: string }>;
  performedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImportExportLogSchema = new Schema<IImportExportLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: ['IMPORT', 'EXPORT'], required: true },
    entity: { type: String, default: 'FAMILIES_MEMBERS' },
    fileName: { type: String, required: true },
    status: { type: String, enum: ['COMPLETED', 'FAILED', 'PROCESSING'], default: 'PROCESSING' },
    totalRecords: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    errorDetails: [
      {
        row: { type: Number },
        message: { type: String },
      },
    ],
    performedBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const ImportExportLog = mongoose.model<IImportExportLog>('ImportExportLog', ImportExportLogSchema);
