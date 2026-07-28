import mongoose, { Schema, Document } from 'mongoose';

export interface SurveyDocument extends Document {
  tenantId: mongoose.Types.ObjectId; title: string; description?: string;
  questions: Array<{
    _id: mongoose.Types.ObjectId; question: string;
    type: 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'boolean';
    options?: string[]; isRequired: boolean;
  }>;
  responses: Array<{
    memberId?: mongoose.Types.ObjectId; respondedAt: Date;
    answers: Array<{ questionId: mongoose.Types.ObjectId; answer: string | string[] }>;
  }>;
  isActive: boolean; expiresAt?: Date;
}
const SurveySchema = new Schema<SurveyDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true }, description: String,
  questions: [{
    question: String,
    type: { type: String, enum: ['text', 'single_choice', 'multiple_choice', 'rating', 'boolean'] },
    options: [String], isRequired: { type: Boolean, default: false },
  }],
  responses: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    respondedAt: { type: Date, default: Date.now },
    answers: [{ questionId: Schema.Types.ObjectId, answer: Schema.Types.Mixed }],
  }],
  isActive: { type: Boolean, default: true }, expiresAt: Date,
}, { timestamps: true });
export const Survey = mongoose.model<SurveyDocument>('Survey', SurveySchema);
