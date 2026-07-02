require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Parent = require('../src/models/Parent');
const logger = require('../src/utils/logger');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB. Starting migration...');

        // Find all distinct parent phones in the Student collection
        const distinctPhones = await Student.distinct('parentPhone');
        logger.info(`Found ${distinctPhones.length} distinct parent phones to migrate.`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const phone of distinctPhones) {
            if (!phone) continue;

            // Check if Parent already exists
            let parent = await Parent.findOne({ phone });

            if (!parent) {
                // Get the first student to extract email and password
                const studentData = await Student.findOne({ parentPhone: phone }).select('+parentPassword');
                
                if (studentData) {
                    parent = await Parent.create({
                        phone: studentData.parentPhone,
                        email: studentData.parentEmail,
                        password: studentData.parentPassword // already hashed
                    });
                    createdCount++;
                }
            }

            if (parent) {
                // Update all students with this parentPhone to have parentId
                const result = await Student.updateMany(
                    { parentPhone: phone, parentId: { $exists: false } },
                    { $set: { parentId: parent._id } }
                );
                updatedCount += result.modifiedCount;
            }
        }

        logger.info(`Migration complete! Created ${createdCount} parents and updated ${updatedCount} students.`);
        process.exit(0);
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
