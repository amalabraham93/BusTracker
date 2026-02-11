const BaseRepository = require('./BaseRepository');
const Route = require('../models/Route');

class RouteRepository extends BaseRepository {
    constructor() {
        super(Route);
    }
}

module.exports = new RouteRepository();
