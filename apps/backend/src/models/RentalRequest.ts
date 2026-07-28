import mongoose, { Schema, Document } from 'mongoose';

export interface RentalRequestDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  quantityRequested: number;
  startDate?: Date;
  endDate?: Date;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentalRequestSchema = new Schema<RentalRequestDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    quantityRequested: { type: Number, required: true, min: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    purpose: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'], default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true }
);

RentalRequestSchema.index({ tenantId: 1, requestedBy: 1 });
RentalRequestSchema.index({ tenantId: 1, status: 1 });

export const RentalRequest = mongoose.model<RentalRequestDocument>('RentalRequest', RentalRequestSchema);
