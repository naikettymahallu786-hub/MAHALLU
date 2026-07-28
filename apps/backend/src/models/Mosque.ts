import mongoose, { Schema, Document } from 'mongoose';

export interface MosqueDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string; nameAr?: string;
  registrationNo?: string;
  yearEstablished?: number;
  address: Record<string, unknown>;
  phone?: string; email?: string;
  imamId?: mongoose.Types.ObjectId;
  muazzinId?: mongoose.Types.ObjectId;
  capacity?: number;
  facilities: string[];
  committee: Array<{ memberId: mongoose.Types.ObjectId; position: string; startDate: Date; endDate?: Date }>;
  assets: Array<{ name: string; description?: string; value?: number; purchasedAt?: Date; condition: string }>;
  bankAccounts: Array<{ bankName: string; accountNo: string; ifscCode: string; accountType: string; balance?: number }>;
}

const MosqueSchema = new Schema<MosqueDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
  name: { type: String, required: true },
  nameAr: String,
  registrationNo: String,
  yearEstablished: Number,
  address: { type: Schema.Types.Mixed },
  phone: String, email: String,
  imamId: { type: Schema.Types.ObjectId, ref: 'Member' },
  muazzinId: { type: Schema.Types.ObjectId, ref: 'Member' },
  capacity: Number,
  facilities: [String],
  committee: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    position: String, startDate: Date, endDate: Date,
  }],
  assets: [{ name: String, description: String, value: Number, purchasedAt: Date, condition: { type: String, enum: ['good', 'fair', 'poor'], default: 'good' } }],
  bankAccounts: [{ bankName: String, accountNo: String, ifscCode: String, accountType: String, balance: Number }],
}, { timestamps: true });

export const Mosque = mongoose.model<MosqueDocument>('Mosque', MosqueSchema);
