const TripRepository = require('../repositories/TripRepository');
const DriverRepository = require('../repositories/DriverRepository');
const StudentRepository = require('../repositories/StudentRepository');
const NotificationService = require('./NotificationService');
const { client: redisClient } = require('../config/redis');
const { getIo } = require('../sockets/socketHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class TripService {
    async startTrip(driverId, busId, routeId, schoolId) {
        // 1. Create Trip Record
        const trip = await TripRepository.create({
            driverId,
            busId,
            routeId,
            schoolId,
            status: 'Active',
            startTime: new Date()
        });

        // 2. Set Driver Status
        await DriverRepository.update(driverId, {
            isActive: true,
            currentTripId: trip._id
        });

        // 3. Cache Active Trip in Redis
        await redisClient.set(`driver:trip:${driverId}`, trip._id.toString(), { EX: 86400 }); // 24 hours

        // 4. Notify Parents
        // Find students on this route/bus
        // For MVP, broadcasting to route room via socket is fast
        try {
            getIo().to(`route:${routeId}`).emit('tripStarted', { tripId: trip._id });
        } catch (e) {
            logger.warn('Socket not active for trip start');
        }

        // Ideally fetch parents and send Push Notifications here
        return trip;
    }

    async updateLocation(driverId, lat, lng) {
        // 1. Update Driver Location in DB (and Redis if needed for pure speed)
        await DriverRepository.updateLocation(driverId, lat, lng);

        // 2. Get Trip Info
        const tripId = await redisClient.get(`driver:trip:${driverId}`);
        if (!tripId) return; // No active trip

        const trip = await TripRepository.findById(tripId);
        if (!trip) return;

        // 3. Broadcast to Socket Room
        try {
            getIo().to(`route:${trip.routeId}`).emit('locationUpdate', { lat, lng, tripId });
        } catch (e) {
            // Socket might fail if not init
        }

        // 4. Proximity Check (2KM)
        // Optimization: Use Redis to store "notified" state for students per trip
        // Key: trip:{tripId}:student:{studentId}:notified

        // Find nearby students (who haven't been notified yet?)
        // To exclude notified, we'd need to fetch all notified keys... might be expensive.
        // Better: Fetch nearby students from DB, then check Redis for each.

        const nearbyStudents = await StudentRepository.findNearbyStudents(lat, lng, 2);

        for (const student of nearbyStudents) {
            // Check if already notified
            const key = `trip:${tripId}:student:${student._id}:notified`;
            const isNotified = await redisClient.get(key);

            if (!isNotified) {
                // Send Notification
                await NotificationService.sendPushNotification(
                    student.parentPhone,
                    'Bus Nearby',
                    `The bus is within 2km of pickup.`
                );

                // Mark as notified (expire in 12 hours)
                await redisClient.set(key, 'true', { EX: 43200 });
            }
        }
    }
}

module.exports = new TripService();
