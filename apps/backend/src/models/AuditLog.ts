import mongoose, { Schema, Document } from 'mongoose';
import { IAuditLog } from '@mahallu/shared-types';

export interface AuditLogDocument extends Omit<IAuditLog, '_id' | 'tenantId' | 'userId' | 'entityId'>, Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entityId?: mongoose.Types.ObjectId;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT'],
      required: true,
    },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    changes: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
    // TTL index — auto-delete logs after 1 year
    expireAfterSeconds: 365 * 24 * 60 * 60,
  },
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1 });
AuditLogSchema.index({ tenantId: 1, entity: 1, entityId: 1 });

export const AuditLog = mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
