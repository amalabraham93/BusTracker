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
            if (status === 'Boarded') message = `Your student ${student.name} marked as boarded.`;
            if (status === 'Dropped') message = `Your student ${student.name} marked as dropped.`;
            if (status === 'Absent') message = `Your student ${student.name} marked as absent.`;

            if (student.parentId) {
                await NotificationService.sendPushNotification(
                    'parent',
                    student.parentId.toString(),
                    'Attendance Update',
                    message
                );
            }

            try {
                const { getIo } = require('../sockets/socketHandler');
                getIo().to(`trip:${tripId}`).emit('attendanceMarked', {
                    status,
                    studentId,
                    name: student.name,
                    tripId,
                    parent_id: student.parentId
                });
            } catch (e) {
                // Ignore if socket isn't initialized
            }
        }

        return attendance;
    }
}

module.exports = new AttendanceService();
