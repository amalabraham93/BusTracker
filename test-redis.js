const redis = require('redis');

const url = 'redis://default:NitC2sZsNEhlvljnewEJHoWfoOIoQWEf@redis-11615.crce206.ap-south-1-1.ec2.cloud.redislabs.com:11615';

console.log('Testing Redis Connection...');
console.log('URL:', url);

(async () => {
    try {
        const client = redis.createClient({ url });

        client.on('error', (err) => console.error('Redis Client Error:', err));
        client.on('connect', () => console.log('Redis Client Connected!'));
        client.on('ready', () => console.log('Redis Client Ready!'));

        console.log('Connecting...');
        await client.connect();
        console.log('Connected successfully!');

        await client.set('test_key', 'Hello Redis Cloud');
        const value = await client.get('test_key');
        console.log('Retrieved value:', value);

        await client.disconnect();
        console.log('Disconnected.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
