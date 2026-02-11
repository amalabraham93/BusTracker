const logger = require('../utils/logger');

class NotificationService {
    async sendPushNotification(token, title, body, data = {}) {
        // Mock FCM/OneSignal implementation
        logger.info(`[PUSH NOTIFICATION] To: ${token} | Title: ${title} | Body: ${body}`);
        return true;
    }

    async sendToTopic(topic, title, body) {
        logger.info(`[PUSH TOPIC] Topic: ${topic} | Title: ${title} | Body: ${body}`);
        return true;
    }
}

module.exports = new NotificationService();
