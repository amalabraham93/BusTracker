const redis = require('redis');
const logger = require('../utils/logger');

let client;
try {
    client = redis.createClient({
        url: 'redis://default:NitC2sZsNEhlvljnewEJHoWfoOIoQWEf@redis-11615.crce206.ap-south-1-1.ec2.cloud.redislabs.com:11615'
    });

    client.on('error', (err) => logger.error('Redis Client Error', err));
    client.on('connect', () => logger.info('Redis Client Connected'));

} catch (e) {
    logger.error('Redis Creation Error:', e);
}

const connectRedis = async () => {
    try {
        await client.connect();
    } catch (err) {
        logger.error('Could not connect to Redis', err);
    }
};

module.exports = { client, connectRedis };
