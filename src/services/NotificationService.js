const logger = require('../utils/logger');
const { emitToRoom } = require('../sockets/socketHandler');
const admin = require('../config/firebase');
const { client: redisClient } = require('../config/redis');

class NotificationService {
    async sendPushNotification(role, userId, title, body, data = {}) {
        logger.info(`[PUSH NOTIFICATION] Role: ${role} | User: ${userId} | Title: ${title} | Body: ${body}`);
        
        try {
            // Fetch all tokens for this user from Redis
            const tokens = await redisClient.sMembers(`fcm:${role}:${userId}`);
            
            if (!tokens || tokens.length === 0) {
                logger.info(`[PUSH NOTIFICATION] Skipped - No FCM tokens found for ${role} ${userId}`);
                return false;
            }

            const isProximity = data.type === 'Proximity' || data.type === 'Emergency';
            // Play the loud bus-horn alert for emergency events, plus any
            // notification that explicitly opts in via alertSound.
            const useHorn = data.type === 'Emergency' || data.alertSound === true || data.alertSound === 'true';

            // Internal-only flag; don't ship it to the client payload.
            delete data.alertSound;

            // Automatically attach parent_id to the data payload for the mobile app
            if (role === 'parent') {
                data.parent_id = userId;
            }

            // Firebase strictly requires string values in data
            const stringifiedData = typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : {};
            for (let key in stringifiedData) {
                if (typeof stringifiedData[key] !== 'string') {
                    stringifiedData[key] = String(stringifiedData[key]);
                }
            }
            
            // Set Category based on alert type
            stringifiedData.category = isProximity ? 'alert' : 'notifications';

            const message = {
                notification: {
                    title,
                    body
                },
                data: stringifiedData,
                android: {
                    notification: {
                        channelId: useHorn ? 'alerts_channel' : 'notification',
                        sound: useHorn ? 'bus_horn' : 'notification'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: useHorn ? 'bus_horn.aiff' : 'notification.aiff'
                        }
                    }
                },
                tokens
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            
            logger.info(`[PUSH NOTIFICATION] Success: ${response.successCount}, Failed: ${response.failureCount}`);
            
            // Clean up failed tokens (e.g., Unregistered)
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                
                if (failedTokens.length > 0) {
                    await redisClient.sRem(`fcm:${role}:${userId}`, ...failedTokens);
                    logger.info(`[PUSH NOTIFICATION] Cleaned up ${failedTokens.length} invalid tokens.`);
                }
            }
            return true;
        } catch (error) {
            logger.error(`[PUSH NOTIFICATION] Failed: ${error.message}`);
            return false;
        }
    }

    async sendToTopic(topic, title, body) {
        logger.info(`[PUSH TOPIC] Topic: ${topic} | Title: ${title} | Body: ${body}`);
        return true;
    }

    async sendRealTimeAlert(room, event, data) {
        logger.info(`[SOCKET ALERT] Room: ${room} | Event: ${event}`);
        emitToRoom(room, event, data);
        return true;
    }
}

module.exports = new NotificationService();
