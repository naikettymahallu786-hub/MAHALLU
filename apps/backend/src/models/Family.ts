import mongoose, { Schema, Document } from 'mongoose';

export interface FamilyDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  familyCode: string;
  headMemberId: mongoose.Types.ObjectId;
  members: Array<{
    memberId: mongoose.Types.ObjectId;
    relationship: string;
    isHead: boolean;
  }>;
  address: {
    line1: string; line2?: string; city: string; district: string;
    state: string; pincode: string; country: string;
    gps?: { type: string; coordinates: [number, number] };
  };
  wardNo?: string;
  outstandingBalance: number;
  qrCode?: string;
  photo?: { url: string; publicId?: string };
  recurringDonationType: 'monthly' | 'yearly' | 'none';
  recurringDonationAmount: number;
  recurringPaymentDay?: number;
  recurringPaymentMonth?: number;
  nextPaymentDueDate?: Date;
  lastPaymentDate?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const FamilySchema = new Schema<FamilyDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    familyCode: { type: String, required: true, trim: true },
    headMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    members: [{
      memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
      relationship: { type: String, required: true },
      isHead: { type: Boolean, default: false },
    }],
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Kerala' },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      gps: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    wardNo: String,
    outstandingBalance: { type: Number, default: 0 },
    qrCode: String,
    photo: { url: String, publicId: String },
    recurringDonationType: { type: String, enum: ['monthly', 'yearly', 'none'], default: 'none' },
    recurringDonationAmount: { type: Number, default: 0 },
    recurringPaymentDay: { type: Number, default: 1, min: 1, max: 31 },
    recurringPaymentMonth: { type: Number, default: 1, min: 1, max: 12 },
    nextPaymentDueDate: Date,
    lastPaymentDate: Date,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

FamilySchema.index({ tenantId: 1, familyCode: 1 }, { unique: true });
FamilySchema.index({ tenantId: 1, headMemberId: 1 });
FamilySchema.index({ 'address.gps': '2dsphere' });

export const Family = mongoose.model<FamilyDocument>('Family', FamilySchema);
