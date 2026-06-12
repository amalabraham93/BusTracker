require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const School = require('../src/models/School');
const Driver = require('../src/models/Driver');
const Student = require('../src/models/Student');

async function migratePasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const isHash = (password) => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);

        let schoolCount = 0;
        let driverCount = 0;
        let studentCount = 0;

        // 1. Migrate Schools
        const schools = await School.find({}).select('+password');
        for (const school of schools) {
            if (school.password && !isHash(school.password)) {
                school.password = await bcrypt.hash(school.password, 12);
                await School.updateOne({ _id: school._id }, { password: school.password });
                schoolCount++;
            }
        }
        console.log(`Migrated ${schoolCount} School records.`);

        // 2. Migrate Drivers
        const drivers = await Driver.find({}).select('+password');
        for (const driver of drivers) {
            if (driver.password && !isHash(driver.password)) {
                driver.password = await bcrypt.hash(driver.password, 12);
                await Driver.updateOne({ _id: driver._id }, { password: driver.password });
                driverCount++;
            }
        }
        console.log(`Migrated ${driverCount} Driver records.`);

        // 3. Migrate Students (Parents)
        const students = await Student.find({}).select('+parentPassword');
        for (const student of students) {
            if (student.parentPassword && !isHash(student.parentPassword)) {
                student.parentPassword = await bcrypt.hash(student.parentPassword, 12);
                await Student.updateOne({ _id: student._id }, { parentPassword: student.parentPassword });
                studentCount++;
            }
        }
        console.log(`Migrated ${studentCount} Student records.`);

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

migratePasswords();
