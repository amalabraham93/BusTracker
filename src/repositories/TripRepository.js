const BaseRepository = require('./BaseRepository');
const Trip = require('../models/Trip');

class TripRepository extends BaseRepository {
    constructor() {
        super(Trip);
    }

    async findActiveTripByDriver(driverId) {
        return await this.model.findOne({ driverId, status: 'Active' });
    }

    async findActiveTripByRouteAndBus(routeId, busId) {
        return await this.model.findOne({ routeId, busId, status: 'Active' }).populate('driverId', 'currentLocation name');
    }
}

module.exports = new TripRepository();
