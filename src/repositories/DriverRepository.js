const BaseRepository = require('./BaseRepository');
const Driver = require('../models/Driver');

class DriverRepository extends BaseRepository {
    constructor() {
        super(Driver);
    }

    async findByPhone(phone) {
        return await this.model.findOne({ phone }).select('+otpSecret');
    }

    async updateLocation(driverId, lat, lng) {
        return await this.model.findByIdAndUpdate(driverId, {
            currentLocation: {
                type: 'Point',
                coordinates: [lng, lat]
            }
        }, { new: true });
    }
}

module.exports = new DriverRepository();
