const BaseRepository = require('./BaseRepository');
const Student = require('../models/Student');

class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    async findByParentPhone(phone) {
        return await this.model.find({ parentPhone: phone })
            .populate('schoolId', 'name email address phone')
            .populate('assignedBus', 'busNumber busId capacity')
            .populate('assignedRoute', 'routeName startPoint endPoint');
    }

    async findNearbyStudents(lat, lng, radiusInKm, filter = {}) {
        const numLat = Number(lat);
        const numLng = Number(lng);
        console.log(`Checking nearby students within ${radiusInKm}km - filter:`, filter);
        return await this.model.find({
            ...filter,
            pickupLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [numLng, numLat]
                    },
                    $maxDistance: radiusInKm * 1000 // Convert km to meters
                }
            }
        });
    }
}

module.exports = new StudentRepository();
