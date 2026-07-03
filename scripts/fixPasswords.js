require('dotenv').config();
const mongoose = require('mongoose');
const Parent = require('../src/models/Parent');
const logger = require('../src/utils/logger');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB. Fixing passwords...');

        const parents = await Parent.find();
        let fixedCount = 0;

        for (const parent of parents) {
            const studentDoc = await mongoose.connection.db.collection('students').findOne({ parentPhone: parent.phone });
            if (studentDoc && studentDoc.parentPassword) {
                await mongoose.connection.db.collection('parents').updateOne(
                    { _id: parent._id },
                    { $set: { password: studentDoc.parentPassword } }
                );
                fixedCount++;
            } else {
                logger.info('No parentPassword found for ' + parent.phone);
            }
        }

        logger.info('Fixed ' + fixedCount + ' parent passwords.');
        process.exit(0);
    } catch (error) {
        logger.error('Failed:', error);
        process.exit(1);
    }
}
fix();
