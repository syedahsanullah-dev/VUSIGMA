import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'],
    required: true,
  },
  resource: {
    type: String,
    required: true, // e.g., 'Subject', 'Question', 'User'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId, // Can be null if creating multiple or if it's a general action
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Storing what changed or any other relevant info
  },
  ipAddress: {
    type: String,
  }
}, { timestamps: true });

// Create an index on adminId and resource for faster querying
auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
