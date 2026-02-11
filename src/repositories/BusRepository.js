const BaseRepository = require('./BaseRepository');
const Bus = require('../models/Bus');

class BusRepository extends BaseRepository {
    constructor() {
        super(Bus);
    }
}

module.exports = new BusRepository();
