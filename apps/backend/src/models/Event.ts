import mongoose, { Schema, Document } from 'mongoose';

export interface EventDocument extends Document {
  tenantId: mongoose.Types.ObjectId; title: string; description?: string;
  date: Date; endDate?: Date; venue?: string; capacity?: number;
  registrations: Array<{ memberId: mongoose.Types.ObjectId; registeredAt: Date; paymentId?: mongoose.Types.ObjectId; attended: boolean }>;
  isFeatured: boolean; isPaid: boolean; fee?: number;
  banner?: { url: string; publicId?: string };
  idCardBgImage?: { url: string; publicId?: string };
  committeeMembers: Array<{ memberId: mongoose.Types.ObjectId; role: string }>;
}
const EventSchema = new Schema<EventDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true }, description: String,
  date: { type: Date, required: true }, endDate: Date, venue: String, capacity: Number,
  registrations: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    registeredAt: { type: Date, default: Date.now },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    attended: { type: Boolean, default: false },
  }],
  isFeatured: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false }, fee: Number,
  banner: { url: String, publicId: String },
  idCardBgImage: { url: String, publicId: String },
  committeeMembers: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    role: { type: String, required: true },
  }],
}, { timestamps: true });
EventSchema.index({ tenantId: 1, date: -1 });
export const Event = mongoose.model<EventDocument>('Event', EventSchema);
