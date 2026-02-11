const BaseRepository = require('./BaseRepository');
const Trip = require('../models/Trip');

class TripRepository extends BaseRepository {
    constructor() {
        super(Trip);
    }

    async findActiveTripByDriver(driverId) {
        return await this.model.findOne({ driverId, status: 'Active' });
    }
}

module.exports = new TripRepository();
