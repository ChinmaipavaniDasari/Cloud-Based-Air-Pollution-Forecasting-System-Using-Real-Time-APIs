// backend/services/openWeatherService.js
const axios = require('axios');

class OpenWeatherService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    // Get coordinates from city name
    async getCoordinates(city) {
        try {
            const response = await axios.get(
                `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},IN&limit=1&appid=${this.apiKey}`
            );

            if (response.data.length === 0) {
                throw new Error('City not found in India');
            }

            return {
                lat: response.data[0].lat,
                lon: response.data[0].lon,
                name: response.data[0].name,
                state: response.data[0].state || 'Unknown',
                country: response.data[0].country
            };
        } catch (error) {
            console.error('Geocoding error:', error.message);
            throw error;
        }
    }

    // Get air pollution data
    async getAirPollution(lat, lon) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
            );

            const data = response.data.list[0];
            return {
                aqi: data.main.aqi,  // 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor
                components: data.components
            };
        } catch (error) {
            console.error('Air pollution error:', error.message);
            throw error;
        }
    }

    // Get current weather data
    async getCurrentWeather(lat, lon) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );

            return {
                temperature: response.data.main.temp,
                feels_like: response.data.main.feels_like,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                wind_speed: response.data.wind.speed,
                wind_direction: response.data.wind.deg,
                clouds: response.data.clouds.all,
                weather_main: response.data.weather[0].main,
                weather_description: response.data.weather[0].description,
                icon: response.data.weather[0].icon
            };
        } catch (error) {
            console.error('Weather error:', error.message);
            throw error;
        }
    }

    // Convert OpenWeather AQI (1-5) to Indian AQI (0-500)
    convertAQI(openWeatherAQI, components) {
        // OpenWeather AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor

        // Use PM2.5 if available for more accurate conversion
        if (components && components.pm2_5) {
            const pm25 = components.pm2_5;
            if (pm25 <= 30) return Math.round(pm25 * 1.67);
            if (pm25 <= 60) return Math.round(50 + (pm25 - 30) * 1.67);
            if (pm25 <= 90) return Math.round(100 + (pm25 - 60) * 3.33);
            if (pm25 <= 120) return Math.round(200 + (pm25 - 90) * 3.33);
            if (pm25 <= 250) return Math.round(300 + (pm25 - 120) * 0.77);
            return 400 + Math.round((pm25 - 250) * 0.4);
        }

        // Fallback to simple conversion
        const aqiMap = {
            1: 45,   // Good
            2: 95,   // Moderate  
            3: 145,  // Unhealthy for Sensitive
            4: 195,  // Unhealthy
            5: 295   // Very Unhealthy
        };
        return aqiMap[openWeatherAQI] || 150;
    }

    // Get AQI category based on Indian standards
    getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy';
        if (aqi <= 200) return 'Very Unhealthy';
        if (aqi <= 300) return 'Severe';
        return 'Hazardous';
    }

    // Get all data for a city
    async getAllData(city) {
        try {
            // Step 1: Get coordinates
            const coords = await this.getCoordinates(city);

            // Step 2: Get pollution data
            const pollution = await this.getAirPollution(coords.lat, coords.lon);

            // Step 3: Get weather data
            const weather = await this.getCurrentWeather(coords.lat, coords.lon);

            // Step 4: Convert to Indian AQI
            const indianAQI = this.convertAQI(pollution.aqi, pollution.components);

            return {
                city: coords.name,
                state: coords.state,
                coordinates: {
                    lat: coords.lat,
                    lon: coords.lon
                },
                aqi: indianAQI,
                aqi_category: this.getAQICategory(indianAQI),
                openweather_aqi: pollution.aqi,
                components: {
                    pm2_5: pollution.components.pm2_5 || 0,
                    pm10: pollution.components.pm10 || 0,
                    no2: pollution.components.no2 || 0,
                    so2: pollution.components.so2 || 0,
                    co: pollution.components.co || 0,
                    o3: pollution.components.o3 || 0,
                    nh3: pollution.components.nh3 || 0
                },
                weather: {
                    temperature: weather.temperature,
                    humidity: weather.humidity,
                    pressure: weather.pressure,
                    wind_speed: weather.wind_speed,
                    description: weather.weather_description,
                    icon: weather.icon
                },
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error getting all data:', error.message);
            throw error;
        }
    }

    // Get 5-day forecast
    async getForecast(lat, lon) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
            );

            return response.data.list.map(item => ({
                datetime: new Date(item.dt * 1000),
                aqi: item.main.aqi,
                components: item.components
            }));
        } catch (error) {
            console.error('Forecast error:', error.message);
            throw error;
        }
    }
}

module.exports = OpenWeatherService;