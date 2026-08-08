import mongoose, { Schema, Document } from 'mongoose';

export interface EventTemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'textarea';
}

export interface ProgramSessionSchedule {
  dayNumber?: number;
  dateText?: string;
  sessionTime?: string;
  sessionTitle?: string;
  president?: string;
  inaugurator?: string;
  keynoteSpeaker?: string;
  chiefGuests?: string;
  felicitations?: string;
  voteOfThanks?: string;
  notes?: string;
}

export interface EventTemplateDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  description?: string;
  bannerUrl?: string;
  variables: EventTemplateVariable[];
  programSchedule: ProgramSessionSchedule[];
  noticeTemplateText: string;
  isMasterTemplate?: boolean;
}

const EventTemplateSchema = new Schema<EventTemplateDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General Conference' },
    description: String,
    bannerUrl: String,
    variables: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        defaultValue: String,
        placeholder: String,
        type: { type: String, default: 'text' },
      },
    ],
    programSchedule: [
      {
        dayNumber: Number,
        dateText: String,
        sessionTime: String,
        sessionTitle: String,
        president: String,
        inaugurator: String,
        keynoteSpeaker: String,
        chiefGuests: String,
        felicitations: String,
        voteOfThanks: String,
        notes: String,
      },
    ],
    noticeTemplateText: { type: String, required: true },
    isMasterTemplate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EventTemplateSchema.index({ tenantId: 1, category: 1 });

export const EventTemplate = mongoose.model<EventTemplateDocument>('EventTemplate', EventTemplateSchema);
