import mongoose, { Schema, Document } from 'mongoose';

export interface DeathRecordDocument extends Document {
  tenantId: mongoose.Types.ObjectId; memberId: mongoose.Types.ObjectId;
  dateOfDeath: Date; timeOfDeath?: string; causeOfDeath?: string;
  janazahDate?: Date; janazahVenue?: string; imamId?: mongoose.Types.ObjectId;
  burialDate?: Date; burialPlace?: string;
  cemeteryId?: mongoose.Types.ObjectId; plotId?: string;
  expenses: Array<{ description: string; amount: number; paidById?: mongoose.Types.ObjectId }>;
  certificateId?: mongoose.Types.ObjectId;
}
const DeathRecordSchema = new Schema<DeathRecordDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  dateOfDeath: { type: Date, required: true }, timeOfDeath: String, causeOfDeath: String,
  janazahDate: Date, janazahVenue: String,
  imamId: { type: Schema.Types.ObjectId, ref: 'Member' },
  burialDate: Date, burialPlace: String,
  cemeteryId: { type: Schema.Types.ObjectId, ref: 'Cemetery' }, plotId: String,
  expenses: [{ description: String, amount: Number, paidById: { type: Schema.Types.ObjectId, ref: 'Member' } }],
  certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
}, { timestamps: true });
DeathRecordSchema.index({ tenantId: 1, memberId: 1 });
export const DeathRecord = mongoose.model<DeathRecordDocument>('DeathRecord', DeathRecordSchema);
