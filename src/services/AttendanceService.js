const AttendanceRepository = require('../repositories/AttendanceRepository');
const StudentRepository = require('../repositories/StudentRepository');
const DriverRepository = require('../repositories/DriverRepository'); // To easier find active trip?
const TripRepository = require('../repositories/TripRepository');
const NotificationService = require('./NotificationService');
const { client: redisClient } = require('../config/redis');
const AppError = require('../utils/AppError');

class AttendanceService {
    async markAttendance(driverId, studentId, status) {
        // 1. Get active trip for driver
        const tripId = await redisClient.get(`driver:trip:${driverId}`);
        if (!tripId) {
            throw new AppError('No active trip found for this driver', 400);
        }

        // 2. Create Attendance Record
        const attendance = await AttendanceRepository.create({
            studentId,
            driverId,
            tripId,
            status,
            date: new Date()
        });

        // 3. Notify Parent
        const student = await StudentRepository.findById(studentId);
        if (student) {
            let message = '';
            if (status === 'Boarded') message = `${student.name} has boarded the bus.`;
            if (status === 'Dropped') message = `${student.name} has been dropped off.`;
            if (status === 'Absent') message = `${student.name} is marked absent.`;

            await NotificationService.sendPushNotification(
                student.parentPhone,
                'Attendance Update',
                message
            );
        }

        return attendance;
    }
}

module.exports = new AttendanceService();
