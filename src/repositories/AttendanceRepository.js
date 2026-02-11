const BaseRepository = require('./BaseRepository');
const Attendance = require('../models/Attendance');

class AttendanceRepository extends BaseRepository {
    constructor() {
        super(Attendance);
    }

    async findByStudentAndDate(studentId, date) {
        // Simplified date check (start of day to end of day)
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        return await this.model.find({
            studentId,
            date: { $gte: start, $lte: end }
        });
    }
}

module.exports = new AttendanceRepository();
