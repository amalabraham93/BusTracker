require('dotenv').config();
const mongoose = require('mongoose');
const School = require('./src/models/School');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const school = await School.findOne();
        if(!school) {
            console.log("No school found");
            return;
        }
        console.log("Found school:", school.name);
        
        // Try update with Mongoose method directly
        const result = await School.findByIdAndUpdate(school._id, { address: "Test Addr" }, { returnDocument: 'after', runValidators: true });
        console.log("Update result address:", result.address);
    } catch(e) {
        console.error("Error during update:", e);
    }
    process.exit(0);
}
test();
