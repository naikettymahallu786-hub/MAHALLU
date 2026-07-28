import mongoose, { Schema, Document } from 'mongoose';

export interface PlotRequestDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  cemeteryId: mongoose.Types.ObjectId;
  plotNo: string;
  requestedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlotRequestSchema = new Schema<PlotRequestDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    cemeteryId: { type: Schema.Types.ObjectId, ref: 'Cemetery', required: true },
    plotNo: { type: String, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String },
  },
  { timestamps: true }
);

PlotRequestSchema.index({ tenantId: 1, cemeteryId: 1, plotNo: 1 });
PlotRequestSchema.index({ tenantId: 1, requestedBy: 1 });
PlotRequestSchema.index({ tenantId: 1, status: 1 });

export const PlotRequest = mongoose.model<PlotRequestDocument>('PlotRequest', PlotRequestSchema);
