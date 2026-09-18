// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const OpenWeatherService = require('./services/openWeatherService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== INITIALIZE SERVICES ====================
let weatherService;
if (process.env.OPENWEATHER_API_KEY) {
    weatherService = new OpenWeatherService(process.env.OPENWEATHER_API_KEY);
    console.log('🌤️ OpenWeather API configured');
} else {
    console.log('⚠️ OpenWeather API key not found. Using mock data.');
}

// ==================== DATABASE CONNECTION ====================
let dbConnected = false;

// MongoDB Atlas connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log('✅ Connected to MongoDB Atlas');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            dbConnected = true;
            seedInitialCities();
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Failed:', err.message);
            dbConnected = false;
        });
} else {
    console.log('⚠️ No MongoDB URI found. Running without database.');
}

// ==================== MODELS ====================

// City Schema
const citySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    state: String,
    country: { type: String, default: 'India' },
    lat: Number,
    lng: Number,
    population: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const City = mongoose.model('City', citySchema);

// AQI Reading Schema
const aqiReadingSchema = new mongoose.Schema({
    city: { type: String, required: true, index: true },
    state: String,
    aqi: Number,
    aqi_category: String,
    pollutants: {
        pm2_5: Number,
        pm10: Number,
        no2: Number,
        so2: Number,
        co: Number,
        o3: Number,
        nh3: Number
    },
    weather: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        wind_speed: Number,
        description: String
    },
    source: { type: String, default: 'OpenWeather API' },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient queries
aqiReadingSchema.index({ city: 1, timestamp: -1 });

const AQIReading = mongoose.model('AQIReading', aqiReadingSchema);

// ==================== SEED INITIAL CITIES ====================
async function seedInitialCities() {
    try {
        const count = await City.countDocuments();

        if (count === 0) {
            console.log('🌱 Seeding initial cities...');

            const cities = [
                { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, population: '32M' },
                { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, population: '20M' },
                { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946, population: '12M' },
                { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, population: '10M' },
                { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, population: '14M' },
                { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, population: '9M' },
                { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, population: '7M' },
                { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, population: '8M' },
                { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, population: '6M' },
                { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, population: '5M' },
                { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, population: '4M' },
                { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, population: '3M' }
            ];

            await City.insertMany(cities);
            console.log(`✅ Seeded ${cities.length} cities`);
        }
    } catch (error) {
        console.error('Error seeding cities:', error.message);
    }
}

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Backend running',
        database: dbConnected ? '✅ Connected' : '❌ Disconnected',
        api: process.env.OPENWEATHER_API_KEY ? '✅ Configured' : '❌ Missing',
        mode: (dbConnected && process.env.OPENWEATHER_API_KEY) ? 'PRODUCTION' : 'MOCK',
        timestamp: new Date()
    });
});

// Get all cities
app.get('/api/cities', async (req, res) => {
    try {
        if (dbConnected) {
            const cities = await City.find().select('name state lat lng population');

            const citiesWithAQI = await Promise.all(
                cities.map(async (city) => {
                    const latest = await AQIReading.findOne({ city: city.name })
                        .sort({ timestamp: -1 });

                    return {
                        ...city.toObject(),
                        aqi: latest?.aqi || Math.floor(Math.random() * 200) + 50,
                        aqi_category: latest?.aqi_category || getAQICategory(latest?.aqi || 100)
                    };
                })
            );
            res.json(citiesWithAQI);
        } else {
            const mockCities = [
                { name: "Delhi", lat: 28.6139, lng: 77.2090, aqi: 256, aqi_category: "Hazardous" },
                { name: "Mumbai", lat: 19.0760, lng: 72.8777, aqi: 145, aqi_category: "Unhealthy" },
                { name: "Bangalore", lat: 12.9716, lng: 77.5946, aqi: 98, aqi_category: "Moderate" }
            ];
            res.json(mockCities);
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get AQI data for a city - WITH REAL OpenWeather DATA!
app.get('/api/aqi/:city', async (req, res) => {
    try {
        const city = req.params.city;
        console.log(`\n📡 Request for ${city}`);

        // Check cache first (1 hour old data is acceptable)
        if (dbConnected) {
            const cached = await AQIReading.findOne({ city })
                .sort({ timestamp: -1 });

            if (cached && (Date.now() - new Date(cached.timestamp).getTime() < 60 * 60 * 1000)) {
                console.log(`📦 Returning CACHED data for ${city} (AQI: ${cached.aqi})`);
                return res.json({
                    city: cached.city,
                    aqi: cached.aqi,
                    aqi_category: cached.aqi_category,
                    pm25: cached.pollutants?.pm2_5?.toFixed(1),
                    pm10: cached.pollutants?.pm10?.toFixed(1),
                    no2: cached.pollutants?.no2?.toFixed(1),
                    so2: cached.pollutants?.so2?.toFixed(1),
                    co: cached.pollutants?.co?.toFixed(2),
                    o3: cached.pollutants?.o3?.toFixed(1),
                    temperature: cached.weather?.temperature,
                    humidity: cached.weather?.humidity,
                    pressure: cached.weather?.pressure,
                    wind_speed: cached.weather?.wind_speed,
                    weather_description: cached.weather?.description,
                    timestamp: cached.timestamp,
                    source: 'Database Cache'
                });
            }
        }

        // Get REAL data from OpenWeather API
        let data;
        let source = 'OpenWeather API';

        if (weatherService) {
            try {
                console.log('🌐 Fetching REAL data from OpenWeather...');
                const realData = await weatherService.getAllData(city);

                data = {
                    city: realData.city,
                    aqi: realData.aqi,
                    aqi_category: realData.aqi_category,
                    pm25: realData.components.pm2_5?.toFixed(1),
                    pm10: realData.components.pm10?.toFixed(1),
                    no2: realData.components.no2?.toFixed(1),
                    so2: realData.components.so2?.toFixed(1),
                    co: realData.components.co?.toFixed(2),
                    o3: realData.components.o3?.toFixed(1),
                    temperature: realData.weather.temperature,
                    humidity: realData.weather.humidity,
                    pressure: realData.weather.pressure,
                    wind_speed: realData.weather.wind_speed,
                    weather_description: realData.weather.description
                };

                console.log(`✅ Got REAL data: ${city} AQI=${data.aqi}`);

            } catch (apiError) {
                console.log('⚠️ API error, using mock:', apiError.message);
                data = generateMockData(city);
                source = 'Mock Data (API Error)';
            }
        } else {
            data = generateMockData(city);
            source = 'Mock Data (No API Key)';
        }

        // Save to database
        if (dbConnected && source.includes('OpenWeather')) {
            try {
                const reading = new AQIReading({
                    city: data.city || city,
                    aqi: data.aqi,
                    aqi_category: data.aqi_category,
                    pollutants: {
                        pm2_5: parseFloat(data.pm25) || 0,
                        pm10: parseFloat(data.pm10) || 0,
                        no2: parseFloat(data.no2) || 0,
                        so2: parseFloat(data.so2) || 0,
                        co: parseFloat(data.co) || 0,
                        o3: parseFloat(data.o3) || 0
                    },
                    weather: {
                        temperature: data.temperature || 0,
                        humidity: data.humidity || 0,
                        pressure: data.pressure || 0,
                        wind_speed: data.wind_speed || 0,
                        description: data.weather_description || ''
                    },
                    source: source,
                    timestamp: new Date()
                });

                await reading.save();
                console.log(`💾 SAVED to database: ${city} AQI=${data.aqi}`);
            } catch (saveError) {
                console.error('❌ Save error:', saveError.message);
            }
        }

        // Send response
        res.json({
            ...data,
            timestamp: new Date(),
            source: source
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.json(generateMockData(req.params.city));
    }
});

// Get historical data for ML training
app.get('/api/historical/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const days = parseInt(req.query.days) || 30;

        if (!dbConnected) {
            return res.json(generateMockHistorical(city, days));
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const data = await AQIReading.find({
            city: city,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });

        res.json({
            city: city,
            days: data.length,
            readings: data.map(d => ({
                date: d.timestamp,
                aqi: d.aqi,
                pm25: d.pollutants?.pm2_5,
                pm10: d.pollutants?.pm10,
                temperature: d.weather?.temperature,
                humidity: d.weather?.humidity
            }))
        });

    } catch (error) {
        console.error('Historical error:', error.message);
        res.json(generateMockHistorical(req.params.city, req.query.days || 30));
    }
});

// ==================== MOCK DATA GENERATORS ====================

function generateMockData(city) {
    const aqi = Math.floor(Math.random() * 350) + 50;
    return {
        city: city,
        aqi: aqi,
        aqi_category: getAQICategory(aqi),
        pm25: (aqi * 0.4 + 10).toFixed(1),
        pm10: (aqi * 0.7 + 20).toFixed(1),
        no2: (Math.random() * 50 + 10).toFixed(1),
        so2: (Math.random() * 20 + 5).toFixed(1),
        co: (Math.random() * 2 + 0.5).toFixed(2),
        o3: (Math.random() * 60 + 20).toFixed(1),
        temperature: Math.floor(Math.random() * 15) + 25,
        humidity: Math.floor(Math.random() * 50) + 30,
        pressure: Math.floor(Math.random() * 30) + 1000,
        wind_speed: (Math.random() * 10 + 2).toFixed(1),
        weather_description: ['Clear', 'Clouds', 'Rain', 'Haze'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        source: 'Mock Data'
    };
}

function generateMockHistorical(city, days) {
    const readings = [];
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        readings.push({
            date: date,
            aqi: Math.floor(Math.random() * 200) + 50,
            pm25: Math.random() * 100 + 20,
            pm10: Math.random() * 150 + 30,
            temperature: Math.random() * 15 + 20,
            humidity: Math.random() * 50 + 30
        });
    }
    return { city, days: readings.length, readings };
}

function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    if (aqi <= 300) return 'Severe';
    return 'Hazardous';
}

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log(`📦 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`🌤️ OpenWeather: ${process.env.OPENWEATHER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log('='.repeat(50) + '\n');
});