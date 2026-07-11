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
            // Auto-leave previous trip rooms to prevent jumping markers on the frontend
            socket.rooms.forEach(room => {
                if (room.startsWith('trip:') && room !== `trip:${tripId}`) {
                    socket.leave(room);
                }
            });

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

        socket.on('locationUpdate', async (data) => {
            const { tripId, lat, lng } = data;
            if (!tripId || !lat || !lng) return;

            try {
                // Lazy load to avoid circular dependency with TripService
                const TripRepository = require('../repositories/TripRepository');
                const TripService = require('../services/TripService');
                
                const trip = await TripRepository.model.findById(tripId).select('driverId');
                if (trip && trip.driverId) {
                    // This will update DB, do proximity checks, and broadcast the location to parents
                    await TripService.updateLocation(trip.driverId, lat, lng);
                }
            } catch (err) {
                logger.error('Error handling socket locationUpdate: ' + err.message);
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
