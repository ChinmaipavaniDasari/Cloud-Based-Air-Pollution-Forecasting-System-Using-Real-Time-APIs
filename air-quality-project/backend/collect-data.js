// backend/collect-data.js
// Use axios instead of fetch
const axios = require('axios');

const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna'
];

async function collectData() {
    console.log('📊 Starting data collection...');
    console.log('='.repeat(50));

    let success = 0;
    let failed = 0;

    for (let city of cities) {
        try {
            // Use axios.get instead of fetch
            const response = await axios.get(`http://localhost:5000/api/aqi/${city}`);
            const data = response.data;

            console.log(`✅ ${city.padEnd(12)}: AQI ${data.aqi.toString().padEnd(4)} (${data.source})`);
            success++;

            // Wait 2 seconds between requests (avoid rate limits)
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.log(`❌ ${city.padEnd(12)}: ${error.message}`);
            failed++;
        }
    }

    console.log('='.repeat(50));
    console.log(`✅ Collection complete! Success: ${success}, Failed: ${failed}`);
    console.log('📊 Check MongoDB Atlas for saved data!');
}

collectData();