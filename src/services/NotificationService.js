const logger = require('../utils/logger');
const { emitToRoom } = require('../sockets/socketHandler');

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

    async sendRealTimeAlert(room, event, data) {
        logger.info(`[SOCKET ALERT] Room: ${room} | Event: ${event}`);
        emitToRoom(room, event, data);
        return true;
    }
}

module.exports = new NotificationService();
