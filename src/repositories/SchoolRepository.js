const BaseRepository = require('./BaseRepository');
const School = require('../models/School');

class SchoolRepository extends BaseRepository {
    constructor() {
        super(School);
    }

    async findByEmail(email) {
        return await this.model.findOne({ email }).select('+password');
    }
}

module.exports = new SchoolRepository();
