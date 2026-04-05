const BaseRepository = require('./BaseRepository');
const AuditLog = require('../models/AuditLog');

class AuditLogRepository extends BaseRepository {
    constructor() {
        super(AuditLog);
    }

    async logAction({ userId, userRole, action, resource, resourceId, details = {} }) {
        try {
            return await this.create({
                userId,
                userRole,
                action,
                resource,
                resourceId,
                details
            });
        } catch (err) {
            console.error('Failed to create AuditLog:', err);
            // Don't throw, we don't want to break the main request if logging fails
        }
    }
}

module.exports = new AuditLogRepository();
