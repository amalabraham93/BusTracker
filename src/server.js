const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const app = require('./app');
const { initSocket } = require('./sockets/socketHandler');
const logger = require('./utils/logger');

// Load env vars
dotenv.config();

// Handling Uncaught Exception
process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err);
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

// Connect to Database
(async () => {
    try {
        await connectDB();
        await connectRedis();
    } catch (err) {
        logger.error('Startup Error:', err);
    }
})();

const server = http.createServer(app);

// Init Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`App running on port ${PORT}...`);
});

// Handling Unhandled Rejection
process.on('unhandledRejection', err => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
