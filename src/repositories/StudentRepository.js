const BaseRepository = require('./BaseRepository');
const Student = require('../models/Student');

class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    async findByParentPhone(phone) {
        return await this.model.find({ parentPhone: phone })
            .populate('schoolId', 'name address')
            .populate('assignedBus', 'busNumber')
            .populate('assignedRoute', 'routeName');
    }

    async findNearbyStudents(lat, lng, radiusInKm, excludeIds = []) {
        console.log(`Checking nearby students within ${radiusInKm}km - Excluded: ${excludeIds.length}`);
        return await this.model.find({
            _id: { $nin: excludeIds },
            pickupLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radiusInKm * 1000 // Convert km to meters
                }
            }
        });
    }
}

module.exports = new StudentRepository();
