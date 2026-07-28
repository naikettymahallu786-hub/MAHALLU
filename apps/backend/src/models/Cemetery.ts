import mongoose, { Schema, Document } from 'mongoose';

export interface CemeteryDocument extends Document {
  tenantId: mongoose.Types.ObjectId; name: string;
  address: Record<string, unknown>;
  capacity: number;
  plots: Array<{
    plotNo: string; row: string; section: string; 
    status?: 'available' | 'booked' | 'occupied';
    isOccupied: boolean;
    bookedById?: mongoose.Types.ObjectId;
    deceasedId?: mongoose.Types.ObjectId; occupiedAt?: Date;
    gps?: { type: string; coordinates: [number, number] };
    photos: string[];
  }>;
}
const CemeterySchema = new Schema<CemeteryDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
  name: { type: String, required: true },
  address: { type: Schema.Types.Mixed },
  capacity: { type: Number, default: 0 },
  plots: [{
    plotNo: String, row: String, section: String,
    status: { type: String, enum: ['available', 'booked', 'occupied'], default: 'available' },
    isOccupied: { type: Boolean, default: false },
    bookedById: { type: Schema.Types.ObjectId, ref: 'Member' },
    deceasedId: { type: Schema.Types.ObjectId, ref: 'Member' },
    occupiedAt: Date,
    gps: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    photos: [String],
  }],
}, { timestamps: true });
CemeterySchema.index({ 'plots.gps': '2dsphere' });
export const Cemetery = mongoose.model<CemeteryDocument>('Cemetery', CemeterySchema);
