import AuditLog from '@/models/AuditLog';

/**
 * Utility to log admin actions in Next.js route handlers
 * @param {Object} reqOrUser - Next.js Request or user object
 * @param {String} action - Action taken (CREATE, UPDATE, DELETE)
 * @param {String} resource - Resource name (e.g. User, Subject)
 * @param {String} resourceId - ID of resource
 * @param {Object} details - Additional metadata
 */
export const logAuditAction = async (reqOrUser, action, resource, resourceId = null, details = {}) => {
  try {
    let user = null;
    let ipAddress = '127.0.0.1';

    if (reqOrUser && reqOrUser.role) {
      user = reqOrUser;
    } else if (reqOrUser && reqOrUser.user) {
      user = reqOrUser.user;
      if (reqOrUser.headers && typeof reqOrUser.headers.get === 'function') {
        ipAddress = reqOrUser.headers.get('x-forwarded-for') || '127.0.0.1';
      } else if (reqOrUser.ip) {
        ipAddress = reqOrUser.ip;
      }
    }

    if (!user || user.role !== 'SUPER_ADMIN') {
      return;
    }

    const logEntry = new AuditLog({
      adminId: user.id || user._id,
      action,
      resource,
      resourceId,
      details,
      ipAddress
    });

    await logEntry.save();
  } catch (error) {
    console.error('Audit Logging failed:', error);
  }
};
