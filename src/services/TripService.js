const TripRepository = require('../repositories/TripRepository');
const DriverRepository = require('../repositories/DriverRepository');
const StudentRepository = require('../repositories/StudentRepository');
const NotificationService = require('./NotificationService');
const { client: redisClient } = require('../config/redis');
const { getIo } = require('../sockets/socketHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class TripService {
    async startTrip(driverId, busId, routeId, schoolId, type) {
        // 1. Create Trip Record
        const trip = await TripRepository.create({
            driverId,
            busId,
            routeId,
            schoolId,
            type,
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
        try {
            const populatedTrip = await TripRepository.model.findById(trip._id).populate('routeId busId');
            getIo().to(`route:${routeId}`).emit('tripStarted', { 
                tripId: trip._id, 
                type,
                student_name: '',
                student_id: '',
                route_name: populatedTrip.routeId ? populatedTrip.routeId.routeName : '',
                busNumber: populatedTrip.busId ? populatedTrip.busId.busNumber : '',
                busId: populatedTrip.busId ? populatedTrip.busId._id.toString() : ''
            });
        } catch (e) {
            logger.warn('Socket not active for trip start');
        }

        // Fetch parents and send Push Notifications
        const students = await StudentRepository.model.find({ assignedRoute: trip.routeId, assignedBus: trip.busId, isActive: true });
        const parentIds = [...new Set(students.filter(s => s.parentId).map(s => s.parentId.toString()))];
        const title = 'Trip Started';
        const message = `The ${type.toLowerCase()} trip has started.`;
        for (const pid of parentIds) {
            await NotificationService.sendPushNotification('parent', pid, title, message, { type });
        }
        
        return trip;
    }

    async endTrip(driverId) {
        const tripId = await redisClient.get(`driver:trip:${driverId}`);
        if (!tripId) {
            throw new AppError('No active trip found', 404);
        }

        const trip = await TripRepository.findById(tripId);
        if (!trip) {
            throw new AppError('Trip not found', 404);
        }

        // 1. Update Trip Record
        trip.status = 'Completed';
        trip.endTime = new Date();
        await trip.save();

        // 2. Clear Driver Status & Redis
        await DriverRepository.update(driverId, {
            isActive: false,
            currentTripId: null
        });
        await redisClient.del(`driver:trip:${driverId}`);

        // 3. Notify Parents via Socket and Push
        try {
            const populatedTrip = await TripRepository.model.findById(trip._id).populate('routeId busId');
            getIo().to(`trip:${tripId}`).emit('tripEnded', { 
                tripId,
                type: populatedTrip.type,
                student_name: '',
                student_id: '',
                route_name: populatedTrip.routeId ? populatedTrip.routeId.routeName : '',
                busNumber: populatedTrip.busId ? populatedTrip.busId.busNumber : '',
                busId: populatedTrip.busId ? populatedTrip.busId._id.toString() : ''
            });
        } catch (e) {
            logger.warn('Socket not active for trip end');
        }

        // Notify parents of boarded students on Pickup trips
        if (trip.type === 'Pickup') {
            const AttendanceRepository = require('../repositories/AttendanceRepository');
            const boardedAttendances = await AttendanceRepository.model.find({ tripId: trip._id, status: 'Boarded' }).populate('studentId');
            const parentIds = [...new Set(boardedAttendances.filter(a => a.studentId && a.studentId.parentId).map(a => a.studentId.parentId.toString()))];
            
            for (const pid of parentIds) {
                if (pid) {
                    await NotificationService.sendPushNotification(
                        'parent',
                        pid,
                        'Trip Ended',
                        'Your student reached school safely.',
                        { type: 'Pickup' }
                    );
                }
            }
        }

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
            getIo().to(`trip:${tripId}`).emit('locationUpdate', { 
                driverId, 
                lat: Number(lat), 
                lng: Number(lng), 
                tripId 
            });
        } catch (e) {
            // Socket might fail if not init
        }

        // 4. Proximity Checks (2KM and 500m)
        // Optimization: Use Redis to store "notified" state for students per trip for each distance tier
        const studentFilter = { 
            assignedRoute: trip.routeId._id || trip.routeId, 
            assignedBus: trip.busId._id || trip.busId, 
            isActive: true 
        };

        // 500m Check (Do this FIRST so we don't send 2km if they are already within 500m)
        const students500m = await StudentRepository.findNearbyStudents(lat, lng, 0.5, studentFilter);
        logger.info(`[Proximity Check] 500m check found ${students500m.length} students.`);
        for (const student of students500m) {
            const key500m = `trip:${tripId}:student:${student._id}:notified:500m`;
            if (!await redisClient.get(key500m)) {
                logger.info(`[Proximity Check] Triggering 500m alert for student ${student.name}`);
                if (student.parentId) {
                    await NotificationService.sendPushNotification(
                        'parent',
                        student.parentId.toString(),
                        'Bus Arriving Soon',
                        `The bus is within 500m of your pickup location.`,
                        { type: 'Proximity', alertSound: 'true' }
                    );
                }
                await redisClient.set(key500m, 'true', { EX: 43200 });
                
                // Mark 1km and 2km as notified as well to prevent double-firing
                const key1km = `trip:${tripId}:student:${student._id}:notified:1km`;
                await redisClient.set(key1km, 'true', { EX: 43200 });
                const key2km = `trip:${tripId}:student:${student._id}:notified:2km`;
                await redisClient.set(key2km, 'true', { EX: 43200 });
            }
        }

        // 1km Check (Do this before 2km)
        const students1km = await StudentRepository.findNearbyStudents(lat, lng, 1, studentFilter);
        logger.info(`[Proximity Check] 1km check found ${students1km.length} students.`);
        for (const student of students1km) {
            const key1km = `trip:${tripId}:student:${student._id}:notified:1km`;
            if (!await redisClient.get(key1km)) {
                logger.info(`[Proximity Check] Triggering 1km alert for student ${student.name}`);
                if (student.parentId) {
                    await NotificationService.sendPushNotification(
                        'parent',
                        student.parentId.toString(),
                        'Bus Getting Closer',
                        `The bus is within 1km of your pickup location.`,
                        { type: 'Proximity', alertSound: 'true' }
                    );
                }
                await redisClient.set(key1km, 'true', { EX: 43200 });
                
                // Mark 2km as notified as well to prevent double-firing
                const key2km = `trip:${tripId}:student:${student._id}:notified:2km`;
                await redisClient.set(key2km, 'true', { EX: 43200 });
            }
        }

        // 2km Check
        const students2km = await StudentRepository.findNearbyStudents(lat, lng, 2, studentFilter);
        logger.info(`[Proximity Check] 2km check found ${students2km.length} students.`);
        for (const student of students2km) {
            const key2km = `trip:${tripId}:student:${student._id}:notified:2km`;
            if (!await redisClient.get(key2km)) {
                logger.info(`[Proximity Check] Triggering 2km alert for student ${student.name}`);
                if (student.parentId) {
                    await NotificationService.sendPushNotification(
                        'parent',
                        student.parentId.toString(),
                        'Bus Nearby',
                        `The bus is within 2km of your pickup location.`,
                        { type: 'Proximity', alertSound: 'true' }
                    );
                }
                await redisClient.set(key2km, 'true', { EX: 43200 });
            }
        }
    }
}

module.exports = new TripService();
