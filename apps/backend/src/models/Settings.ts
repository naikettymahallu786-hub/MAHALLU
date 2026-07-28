import mongoose, { Schema, Document } from 'mongoose';

export interface SettingsDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  general: { mahalluName: string; logo?: string; phone: string; email: string; address: string };
  notifications: { whatsappEnabled: boolean; smsEnabled: boolean; emailEnabled: boolean; pushEnabled: boolean };
  finance: { currency: string; financialYearStart: string; autoReceiptEnabled: boolean };
  madrasa: { feeReminderDays: number; attendanceNotification: boolean; autoReportCard: boolean };
  integrations: { razorpayEnabled: boolean; whatsappApiKey?: string; googleMapsKey?: string };
  theme: { primaryColor: string; mode: 'light' | 'dark' | 'system'; language: string };
  iqamahTimes?: { Fajr: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string; Jumuah: string };
}
const SettingsSchema = new Schema<SettingsDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
  general: { mahalluName: String, logo: String, phone: String, email: String, address: String },
  notifications: {
    whatsappEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
  },
  finance: { currency: { type: String, default: 'INR' }, financialYearStart: { type: String, default: 'April' }, autoReceiptEnabled: { type: Boolean, default: true } },
  madrasa: { feeReminderDays: { type: Number, default: 5 }, attendanceNotification: { type: Boolean, default: true }, autoReportCard: { type: Boolean, default: true } },
  integrations: { razorpayEnabled: { type: Boolean, default: false }, whatsappApiKey: String, googleMapsKey: String },
  theme: { primaryColor: { type: String, default: '#059669' }, mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }, language: { type: String, default: 'ml' } },
  iqamahTimes: {
    Fajr: { type: String, default: '05:30' },
    Dhuhr: { type: String, default: '13:30' },
    Asr: { type: String, default: '16:30' },
    Maghrib: { type: String, default: '18:45' },
    Isha: { type: String, default: '20:00' },
    Jumuah: { type: String, default: '13:30' },
  }
}, { timestamps: true });
export const Settings = mongoose.model<SettingsDocument>('Settings', SettingsSchema);
