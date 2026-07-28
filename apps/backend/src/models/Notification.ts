import mongoose, { Schema, Document } from 'mongoose';
import { NotificationChannel } from '@mahallu/shared-types';

export interface NotificationDocument extends Document {
  tenantId: mongoose.Types.ObjectId; channel: NotificationChannel;
  recipientId?: mongoose.Types.ObjectId; recipientPhone?: string; recipientEmail?: string;
  title: string; body: string; data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  scheduledAt?: Date; sentAt?: Date; error?: string;
}
const NotificationSchema = new Schema<NotificationDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  channel: { type: String, enum: Object.values(NotificationChannel), required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
  recipientPhone: String, recipientEmail: String,
  title: { type: String, required: true }, body: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' },
  scheduledAt: Date, sentAt: Date, error: String,
}, { timestamps: true });
NotificationSchema.index({ tenantId: 1, status: 1, scheduledAt: 1 });
export const Notification = mongoose.model<NotificationDocument>('Notification', NotificationSchema);
