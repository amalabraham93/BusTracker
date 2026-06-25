require('dotenv').config();
const mongoose = require('mongoose');
const { client: redisClient, connectRedis } = require('./src/config/redis');
const School = require('./src/models/School');
const Trip = require('./src/models/Trip');
const Driver = require('./src/models/Driver');

async function fixStuckTrips() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected.');

        console.log('Connecting to Redis...');
        await connectRedis();

        const schoolEmail = 'pkn@yopmail.com';
        const school = await School.findOne({ email: schoolEmail });
        
        if (!school) {
            console.log(`School with email ${schoolEmail} not found!`);
            process.exit(1);
        }
        console.log(`Found school: ${school.name} (${school._id})`);

        const activeTrips = await Trip.find({ schoolId: school._id, status: 'Active' });
        console.log(`Found ${activeTrips.length} active trips for this school.`);

        for (const trip of activeTrips) {
            console.log(`Ending trip ${trip._id} for driver ${trip.driverId}...`);
            
            // 1. Update Trip Record
            trip.status = 'Completed';
            trip.endTime = new Date();
            await trip.save();

            // 2. Clear Driver Status & Redis
            await Driver.findByIdAndUpdate(trip.driverId, {
                isActive: false,
                currentTripId: null
            });
            await redisClient.del(`driver:trip:${trip.driverId}`);
            console.log(`Trip ${trip._id} successfully ended.`);
        }

        console.log('All active trips ended.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        await redisClient.quit();
        console.log('Disconnected.');
        process.exit(0);
    }
}

fixStuckTrips();
