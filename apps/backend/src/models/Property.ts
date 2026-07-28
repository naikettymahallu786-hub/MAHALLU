import mongoose, { Schema, Document } from 'mongoose';
import { PropertyType } from '@mahallu/shared-types';

export interface PropertyDocument extends Document {
  tenantId: mongoose.Types.ObjectId; propertyCode: string; type: PropertyType; name: string;
  address: Record<string, unknown>; area?: number; rentAmount?: number;
  quantity?: number; availableQuantity?: number;
  status: 'vacant' | 'occupied' | 'maintenance'; documents: Array<{ url: string; fileName?: string; fileType?: string }>;
  currentLeaseId?: mongoose.Types.ObjectId;
}
const PropertySchema = new Schema<PropertyDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  propertyCode: { type: String, required: true },
  type: { type: String, enum: Object.values(PropertyType), required: true },
  name: { type: String, required: true },
  address: { type: Schema.Types.Mixed },
  area: Number, rentAmount: Number,
  quantity: { type: Number, default: 1 },
  availableQuantity: { type: Number, default: 1 },
  status: { type: String, enum: ['vacant', 'occupied', 'maintenance'], default: 'vacant' },
  documents: [{ url: String, fileName: String, fileType: String }],
  currentLeaseId: { type: Schema.Types.ObjectId, ref: 'Lease' },
}, { timestamps: true });
PropertySchema.index({ tenantId: 1, propertyCode: 1 }, { unique: true });
export const Property = mongoose.model<PropertyDocument>('Property', PropertySchema);
