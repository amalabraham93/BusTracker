const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        socket.on('joinRoute', (routeId, callback) => {
            socket.join(`route:${routeId}`);
            logger.info(`Client ${socket.id} joined route:${routeId}`);
            if (typeof callback === 'function') {
                callback({ status: 'success', message: `Joined route:${routeId}` });
            }
        });

        socket.on('joinTrip', (tripId, callback) => {
            socket.join(`trip:${tripId}`);
            logger.info(`Client ${socket.id} joined trip:${tripId}`);
            if (typeof callback === 'function') {
                callback({ status: 'success', message: `Joined trip:${tripId}` });
            }
        });

        socket.on('joinSchool', (schoolId, callback) => {
            socket.join(`school:${schoolId}`);
            logger.info(`Client ${socket.id} joined school:${schoolId}`);
            if (typeof callback === 'function') {
                callback({ status: 'success', message: `Joined school:${schoolId}` });
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
        logger.info(`Emitted ${event} to ${room}`);
    }
};

module.exports = { initSocket, getIo, emitToRoom };
