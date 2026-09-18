// backend/test-save.js
const mongoose = require('mongoose');
require('dotenv').config();

// Define schema (same as your server)
const aqiReadingSchema = new mongoose.Schema({
    city: String,
    aqi: Number,
    aqi_category: String,
    pollutants: {
        pm2_5: Number,
        pm10: Number,
        no2: Number,
        so2: Number,
        co: Number,
        o3: Number
    },
    weather: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        wind_speed: Number
    },
    timestamp: { type: Date, default: Date.now }
});

const AQIReading = mongoose.model('AQIReading', aqiReadingSchema);

async function testSave() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!');

        // Create a test record
        const testData = new AQIReading({
            city: 'TEST_CITY',
            aqi: 150,
            aqi_category: 'Unhealthy',
            pollutants: {
                pm2_5: 75.5,
                pm10: 120.3,
                no2: 45.2,
                so2: 12.1,
                co: 1.2,
                o3: 65.4
            },
            weather: {
                temperature: 28,
                humidity: 65,
                pressure: 1012,
                wind_speed: 3.5
            }
        });

        // Save to database
        await testData.save();
        console.log('✅ TEST DATA SAVED SUCCESSFULLY!');

        // Count documents
        const count = await AQIReading.countDocuments();
        console.log(`📊 Total documents in collection: ${count}`);

        await mongoose.disconnect();
        console.log('👋 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSave();