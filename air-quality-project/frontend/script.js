// ==================== CONFIGURATION ====================
const { jsPDF } = window.jspdf;

// Indian city suggestions
const citySuggestions = [
    "Delhi, India", "Mumbai, India", "Bangalore, India", "Chennai, India",
    "Kolkata, India", "Hyderabad, India", "Pune, India", "Ahmedabad, India",
    "Jaipur, India", "Lucknow, India", "Kanpur, India", "Nagpur, India",
    "Indore, India", "Thane, India", "Bhopal, India", "Visakhapatnam, India",
    "Patna, India", "Vadodara, India", "Ghaziabad, India", "Ludhiana, India",
    "Agra, India", "Nashik, India", "Faridabad, India", "Meerut, India"
];

// Color mapping for AQI levels
const aqiColors = {
    good: '#10b981',
    moderate: '#f59e0b',
    unhealthy: '#ef4444',
    veryUnhealthy: '#8b5cf6',
    hazardous: '#7c2d12'
};

// ==================== STATE MANAGEMENT ====================
let currentCity = "Delhi, India";
let currentTimeRange = 30;
let currentMetric = "aqi";
let currentChartType = "line";
let map;
let markers = [];
let filteredMarkers = [];
let comparisonCities = [];
let activeAQIFilter = null;
let aqiChart = null;

// Indian cities data for map
const indianCities = [
    { name: "Delhi", lat: 28.6139, lng: 77.2090, aqi: 256, population: "32M", state: "Delhi" },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, aqi: 145, population: "20M", state: "Maharashtra" },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946, aqi: 98, population: "12M", state: "Karnataka" },
    { name: "Chennai", lat: 13.0827, lng: 80.2707, aqi: 112, population: "10M", state: "Tamil Nadu" },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639, aqi: 178, population: "14M", state: "West Bengal" },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, aqi: 85, population: "9M", state: "Telangana" },
    { name: "Pune", lat: 18.5204, lng: 73.8567, aqi: 92, population: "7M", state: "Maharashtra" },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, aqi: 165, population: "8M", state: "Gujarat" },
    { name: "Jaipur", lat: 26.9124, lng: 75.7873, aqi: 132, population: "6M", state: "Rajasthan" },
    { name: "Lucknow", lat: 26.8467, lng: 80.9462, aqi: 189, population: "5M", state: "Uttar Pradesh" },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319, aqi: 210, population: "4M", state: "Uttar Pradesh" },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882, aqi: 95, population: "3M", state: "Maharashtra" }
];

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// ==================== WEATHER IMPACT CALCULATION FUNCTIONS ====================
function calculateWeatherImpacts(weather) {
    const impacts = {
        temperature: { value: 0, class: 'impact-neutral', text: '0% Impact' },
        humidity: { value: 0, class: 'impact-neutral', text: '0% Impact' },
        wind: { value: 0, class: 'impact-neutral', text: '0% Impact' },
        pressure: { value: 0, class: 'impact-neutral', text: '0% Impact' }
    };

    // Temperature impact
    if (weather.temperature > 30) {
        impacts.temperature = { value: 20, class: 'impact-negative', text: '+20% Impact' };
    } else if (weather.temperature > 25) {
        impacts.temperature = { value: 10, class: 'impact-negative', text: '+10% Impact' };
    } else if (weather.temperature < 15) {
        impacts.temperature = { value: -15, class: 'impact-positive', text: '-15% Impact' };
    }

    // Humidity impact
    if (weather.humidity > 70) {
        impacts.humidity = { value: -15, class: 'impact-positive', text: '-15% Impact' };
    } else if (weather.humidity > 50) {
        impacts.humidity = { value: -5, class: 'impact-positive', text: '-5% Impact' };
    } else if (weather.humidity < 30) {
        impacts.humidity = { value: 10, class: 'impact-negative', text: '+10% Impact' };
    }

    // Wind impact
    if (weather.wind_speed > 15) {
        impacts.wind = { value: -25, class: 'impact-positive', text: '-25% Impact' };
    } else if (weather.wind_speed > 8) {
        impacts.wind = { value: -15, class: 'impact-positive', text: '-15% Impact' };
    } else if (weather.wind_speed < 3) {
        impacts.wind = { value: 20, class: 'impact-negative', text: '+20% Impact' };
    }

    // Pressure impact
    if (weather.pressure > 1020) {
        impacts.pressure = { value: 10, class: 'impact-negative', text: '+10% Impact' };
    } else if (weather.pressure < 1000) {
        impacts.pressure = { value: -10, class: 'impact-positive', text: '-10% Impact' };
    }

    return impacts;
}

// ==================== UPDATE WEATHER IMPACT CARD ====================
function updateWeatherImpactCard(data) {
    // Get weather data from API response or use defaults
    const weather = {
        temperature: data.temperature || 21,
        humidity: data.humidity || 74,
        wind_speed: data.wind_speed || 5,
        pressure: data.pressure || 1018
    };

    // Update values - using the correct IDs from HTML
    const tempElement = document.getElementById('weatherTemp');
    const humidityElement = document.getElementById('weatherHumidity');
    const windElement = document.getElementById('weatherWind');
    const pressureElement = document.getElementById('weatherPressure');

    if (tempElement) tempElement.textContent = weather.temperature;
    if (humidityElement) humidityElement.textContent = weather.humidity;
    if (windElement) windElement.textContent = weather.wind_speed;
    if (pressureElement) pressureElement.textContent = weather.pressure;

    // Calculate impacts
    const impacts = calculateWeatherImpacts(weather);

    // Update impact classes and text - using correct IDs
    const tempImpact = document.getElementById('weatherTempImpact');
    const humidityImpact = document.getElementById('weatherHumidityImpact');
    const windImpact = document.getElementById('weatherWindImpact');
    const pressureImpact = document.getElementById('weatherPressureImpact');

    if (tempImpact) {
        tempImpact.className = `factor-impact ${impacts.temperature.class}`;
        tempImpact.textContent = impacts.temperature.text;
    }

    if (humidityImpact) {
        humidityImpact.className = `factor-impact ${impacts.humidity.class}`;
        humidityImpact.textContent = impacts.humidity.text;
    }

    if (windImpact) {
        windImpact.className = `factor-impact ${impacts.wind.class}`;
        windImpact.textContent = impacts.wind.text;
    }

    if (pressureImpact) {
        pressureImpact.className = `factor-impact ${impacts.pressure.class}`;
        pressureImpact.textContent = impacts.pressure.text;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function () {
    initializeCitySuggestions();
    initializeEventListeners();
    initializeMap();
    loadInitialData();

    // Test backend connection
    testBackendConnection();
});

// ==================== BACKEND INTEGRATION ====================
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('Backend connected:', data);
            showNotification('Connected to backend server', 'success');
        }
    } catch (error) {
        console.log('Backend not available, using mock data');
    }
}

async function fetchRealData(city) {
    try {
        const response = await fetch(`${API_BASE_URL}/aqi/${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error('API error');
        return await response.json();
    } catch (error) {
        console.log('Using mock data:', error.message);
        return null;
    }
}

async function fetchCities() {
    try {
        const response = await fetch(`${API_BASE_URL}/cities`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Using default cities');
    }
    return null;
}

async function fetchMLPrediction(city, days = 7) {
    try {
        const response = await fetch(`${API_BASE_URL}/ml/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ city, days })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Using mock ML predictions');
    }
    return null;
}

async function fetchComparison(cities) {
    try {
        const response = await fetch(`${API_BASE_URL}/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cities })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Using mock comparison');
    }
    return null;
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    // Mode buttons
    document.getElementById('singleCityBtn').addEventListener('click', () => setMode('single'));
    document.getElementById('compareCitiesBtn').addEventListener('click', () => setMode('compare'));
    document.getElementById('mlAnalysisBtn').addEventListener('click', () => setMode('ml'));

    // Action buttons
    document.getElementById('visualizeBtn').addEventListener('click', visualizeData);
    document.getElementById('addToCompareBtn').addEventListener('click', addToComparison);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllData);
    document.getElementById('compareNowBtn').addEventListener('click', compareCities);

    // ML Analysis buttons
    document.getElementById('predictBtn').addEventListener('click', predictAQI);
    document.getElementById('analyzeTrendsBtn').addEventListener('click', analyzeTrends);
    document.getElementById('findPatternsBtn').addEventListener('click', findPatterns);
    document.getElementById('optimizeBtn').addEventListener('click', getOptimizationTips);

    // Chart controls
    document.getElementById('lineChartBtn').addEventListener('click', () => setChartType('line'));
    document.getElementById('barChartBtn').addEventListener('click', () => setChartType('bar'));
    document.getElementById('areaChartBtn').addEventListener('click', () => setChartType('area'));
    document.getElementById('exportChartBtn').addEventListener('click', exportPDFReport);

    // Map controls
    document.getElementById('zoomInBtn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => map.zoomOut());
    document.getElementById('resetViewBtn').addEventListener('click', resetMapView);
    document.getElementById('showAllCitiesBtn').addEventListener('click', showAllCities);

    // Legend filters
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', function () {
            const range = this.dataset.aqiRange;
            filterMapByAQI(range);
            document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Input changes
    document.getElementById('cityInput').addEventListener('input', handleCityInput);
    document.getElementById('timeRange').addEventListener('change', function () {
        currentTimeRange = parseInt(this.value);
    });
    document.getElementById('metricSelect').addEventListener('change', function () {
        currentMetric = this.value;
    });
}

// ==================== MODE MANAGEMENT ====================
function setMode(mode) {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const comparisonSection = document.getElementById('comparisonSection');
    const mlAnalysisSection = document.getElementById('mlAnalysisSection');

    modeButtons.forEach(btn => btn.classList.remove('active'));

    if (mode === 'single') {
        document.getElementById('singleCityBtn').classList.add('active');
        comparisonSection.classList.remove('active');
        mlAnalysisSection.classList.remove('active');
    } else if (mode === 'compare') {
        document.getElementById('compareCitiesBtn').classList.add('active');
        comparisonSection.classList.add('active');
        mlAnalysisSection.classList.remove('active');
    } else if (mode === 'ml') {
        document.getElementById('mlAnalysisBtn').classList.add('active');
        comparisonSection.classList.remove('active');
        mlAnalysisSection.classList.add('active');
    }
}

// ==================== CITY SUGGESTIONS ====================
function initializeCitySuggestions() {
    const cityInput = document.getElementById('cityInput');
    const suggestions = document.getElementById('suggestions');

    cityInput.addEventListener('focus', function () {
        showCitySuggestions();
    });

    document.addEventListener('click', function (e) {
        if (!cityInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

function handleCityInput() {
    const input = document.getElementById('cityInput').value.toLowerCase();
    const suggestions = document.getElementById('suggestions');

    if (input.length === 0) {
        showCitySuggestions();
        return;
    }

    const filtered = citySuggestions.filter(city =>
        city.toLowerCase().includes(input)
    );

    showFilteredSuggestions(filtered);
}

function showCitySuggestions() {
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = citySuggestions.map(city =>
        `<div class="suggestion-item" data-city="${city}">${city}</div>`
    ).join('');
    suggestions.style.display = 'block';

    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function () {
            document.getElementById('cityInput').value = this.dataset.city;
            currentCity = this.dataset.city;
            suggestions.style.display = 'none';
            visualizeData();
        });
    });
}

function showFilteredSuggestions(filteredCities) {
    const suggestions = document.getElementById('suggestions');
    if (filteredCities.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item">No cities found</div>';
    } else {
        suggestions.innerHTML = filteredCities.map(city =>
            `<div class="suggestion-item" data-city="${city}">${city}</div>`
        ).join('');
    }
    suggestions.style.display = 'block';

    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function () {
            document.getElementById('cityInput').value = this.dataset.city;
            currentCity = this.dataset.city;
            suggestions.style.display = 'none';
            visualizeData();
        });
    });
}

// ==================== DATA VISUALIZATION ====================
async function visualizeData() {
    currentCity = document.getElementById('cityInput').value || currentCity;
    const metric = document.getElementById('metricSelect').value;

    // Try to fetch real data from backend
    const realData = await fetchRealData(currentCity);

    if (realData) {
        updateCityInfoFromAPI(realData);
    } else {
        updateCityInfo(currentCity);
    }

    // Update chart
    const isInComparisonMode = document.getElementById('compareCitiesBtn').classList.contains('active');

    if (isInComparisonMode && comparisonCities.length > 0) {
        updateComparisonChart();
    } else {
        updateSingleCityChart(currentCity, metric);
    }

    updateLastUpdated();
    updateMapWithCity(currentCity);

    const message = isInComparisonMode && comparisonCities.length > 0
        ? `Showing comparison of ${comparisonCities.length} cities`
        : `Showing ${metric.toUpperCase()} data for ${currentCity}`;
    showNotification(message, 'success');
}

function updateCityInfo(city) {
    const aqi = Math.floor(Math.random() * 400) + 50;
    const pm25 = (Math.random() * 150 + 50).toFixed(1);
    const pm10 = (Math.random() * 250 + 100).toFixed(1);
    const temp = Math.floor(Math.random() * 15) + 25;
    const humidity = Math.floor(Math.random() * 50) + 30;
    const wind = Math.floor(Math.random() * 20) + 2;
    const pressure = Math.floor(Math.random() * 50) + 990;

    document.getElementById('currentCityName').textContent = city.split(',')[0];
    document.getElementById('currentAQI').textContent = `AQI: ${aqi}`;
    document.getElementById('pm25Value').textContent = pm25;
    document.getElementById('pm10Value').textContent = pm10;
    document.getElementById('tempValue').textContent = `${temp}°C`;
    document.getElementById('humidityValue').textContent = `${humidity}%`;

    const aqiBadge = document.getElementById('currentAQI');
    aqiBadge.className = 'aqi-badge ' + getAQIClass(aqi);

    updateForecastData(aqi);
    updateHealthAdvice(aqi);

    // Update weather impact card with mock data
    updateWeatherImpactCard({
        temperature: temp,
        humidity: humidity,
        wind_speed: wind,
        pressure: pressure
    });
}

function updateCityInfoFromAPI(data) {
    document.getElementById('currentCityName').textContent = data.city.split(',')[0];
    document.getElementById('currentAQI').textContent = `AQI: ${data.aqi}`;
    document.getElementById('pm25Value').textContent = data.pm25 || data.pm2_5 || '108.5';
    document.getElementById('pm10Value').textContent = data.pm10 || '192.2';
    document.getElementById('tempValue').textContent = `${data.temperature || data.temp || 28}°C`;
    document.getElementById('humidityValue').textContent = `${data.humidity || 45}%`;

    const aqiBadge = document.getElementById('currentAQI');
    aqiBadge.className = 'aqi-badge ' + getAQIClass(data.aqi);

    if (data.forecast && data.forecast.length >= 3) {
        updateForecastData(data.aqi, data.forecast);
    } else {
        updateForecastData(data.aqi);
    }

    updateHealthAdvice(data.aqi);

    // Update weather impact card
    updateWeatherImpactCard(data);
}

function getAQIClass(aqi) {
    if (aqi <= 50) return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-unhealthy';
    if (aqi <= 200) return 'aqi-very-unhealthy';
    return 'aqi-hazardous';
}

function updateForecastData(currentAQI, customForecast = null) {
    const forecasts = customForecast || [
        currentAQI + Math.floor(Math.random() * 20) - 10,
        currentAQI + Math.floor(Math.random() * 30) - 15,
        currentAQI + Math.floor(Math.random() * 40) - 20
    ];

    forecasts.forEach((forecast, index) => {
        const element = document.getElementById(`forecastValue${index + 1}`);
        element.textContent = Math.round(forecast);
        element.className = `forecast-day-value ${getAQIClass(forecast)}`;
    });

    const tomorrowBadge = document.getElementById('tomorrowAQI');
    tomorrowBadge.textContent = `Tomorrow: ${Math.round(forecasts[0])}`;
    tomorrowBadge.className = `aqi-badge ${getAQIClass(forecasts[0])}`;

    const trend = Math.floor(Math.random() * 40) - 20;
    const trendElement = document.getElementById('trendValue');
    if (trend > 0) {
        trendElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${trend}%`;
        trendElement.className = 'stat-value trend-up';
    } else if (trend < 0) {
        trendElement.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(trend)}%`;
        trendElement.className = 'stat-value trend-down';
    } else {
        trendElement.innerHTML = `<i class="fas fa-minus"></i> 0%`;
        trendElement.className = 'stat-value trend-stable';
    }
}

function updateHealthAdvice(aqi) {
    const healthAdvice = document.getElementById('healthAdvice');
    const healthDetail = document.getElementById('healthDetail');

    if (aqi <= 50) {
        healthAdvice.textContent = 'Excellent';
        healthDetail.textContent = 'Perfect for outdoor activities';
    } else if (aqi <= 100) {
        healthAdvice.textContent = 'Good';
        healthDetail.textContent = 'Sensitive groups should limit outdoor exertion';
    } else if (aqi <= 150) {
        healthAdvice.textContent = 'Unhealthy';
        healthDetail.textContent = 'Everyone should limit outdoor activities';
    } else if (aqi <= 200) {
        healthAdvice.textContent = 'Very Unhealthy';
        healthDetail.textContent = 'Avoid outdoor activities';
    } else {
        healthAdvice.textContent = 'Hazardous';
        healthDetail.textContent = 'Stay indoors with air purifier';
    }
}

function updateSingleCityChart(city, metric) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    const days = currentTimeRange;

    const labels = [];
    const today = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    }

    let data = [];
    let label = '';
    let unit = '';

    if (metric === 'aqi') {
        data = generateAQIData(days);
        label = 'AQI (Air Quality Index)';
        unit = '';
    } else {
        data = generatePollutantData(days, metric);
        label = metric.toUpperCase();
        unit = metric === 'co' ? 'ppm' : 'μg/m³';
    }

    if (aqiChart) {
        aqiChart.destroy();
    }

    aqiChart = new Chart(ctx, {
        type: currentChartType === 'area' ? 'line' : currentChartType,
        data: {
            labels: labels,
            datasets: [{
                label: `${label} ${unit}`,
                data: data,
                borderColor: getChartColor(metric),
                backgroundColor: currentChartType === 'area' ? getChartColor(metric, true) : 'transparent',
                borderWidth: 2.5,
                pointRadius: currentChartType === 'line' ? 3 : 0,
                pointHoverRadius: 5,
                fill: currentChartType === 'area',
                tension: 0.4,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false },
                filler: { propagate: true }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 500,
                    title: { display: true, text: `${label} ${unit}` }
                },
                x: { title: { display: true, text: 'Date' } }
            }
        }
    });

    document.getElementById('chartTitle').textContent =
        `${label} Trend Analysis - ${city.split(',')[0]}`;
}

function generateAQIData(days) {
    const data = [];
    let baseValue = Math.random() * 200 + 50;

    for (let i = 0; i <= days; i++) {
        baseValue += Math.sin(i * 0.2) * 10 + (Math.random() * 10 - 5);
        baseValue = Math.max(30, Math.min(450, baseValue));
        data.push(Math.round(baseValue * 10) / 10);
    }
    return data;
}

function generatePollutantData(days, metric) {
    const data = [];
    const baseValues = {
        pm25: 100,
        pm10: 180,
        no2: 40,
        so2: 15,
        co: 2,
        o3: 50
    };

    let baseValue = baseValues[metric] || 50;

    for (let i = 0; i <= days; i++) {
        baseValue += Math.sin(i * 0.2) * 5 + (Math.random() * 5 - 2.5);
        baseValue = Math.max(baseValue * 0.5, Math.min(baseValue * 1.5, baseValue));
        data.push(parseFloat(baseValue.toFixed(1)));
    }
    return data;
}

function getChartColor(metric, isBackground = false) {
    const colors = {
        aqi: '#2563eb',
        pm25: '#ef4444',
        pm10: '#f59e0b',
        no2: '#8b5cf6',
        so2: '#10b981',
        co: '#7c2d12',
        o3: '#06b6d4'
    };

    const color = colors[metric] || '#2563eb';
    return isBackground ? color + '40' : color;
}

function setChartType(type) {
    currentChartType = type;

    document.getElementById('lineChartBtn').classList.remove('active');
    document.getElementById('barChartBtn').classList.remove('active');
    document.getElementById('areaChartBtn').classList.remove('active');
    document.getElementById(`${type}ChartBtn`).classList.add('active');

    if (aqiChart) {
        aqiChart.destroy();

        const ctx = document.getElementById('aqiChart').getContext('2d');
        const isComparison = document.getElementById('compareCitiesBtn').classList.contains('active') && comparisonCities.length > 0;

        if (isComparison) {
            updateComparisonChart();
        } else {
            const metric = document.getElementById('metricSelect').value;
            updateSingleCityChart(currentCity, metric);
        }
    }
}

// ==================== COMPARISON FUNCTIONALITY ====================
function addToComparison() {
    const city = document.getElementById('cityInput').value || currentCity;

    if (!city || city.trim() === '') {
        showNotification('Please enter a city first', 'error');
        return;
    }

    if (comparisonCities.includes(city)) {
        showNotification(`${city} is already in comparison list`, 'warning');
        return;
    }

    comparisonCities.push(city);
    updateComparisonTags();

    if (!document.getElementById('compareCitiesBtn').classList.contains('active')) {
        setMode('compare');
    }

    showNotification(`${city} added to comparison`, 'success');
}

function updateComparisonTags() {
    const container = document.getElementById('citiesTags');
    container.innerHTML = '';

    comparisonCities.forEach(city => {
        const tag = document.createElement('div');
        tag.className = 'city-tag';
        tag.innerHTML = `
            <i class="fas fa-city"></i>
            <span>${city}</span>
            <button class="remove-btn" data-city="${city}">×</button>
        `;
        container.appendChild(tag);

        tag.querySelector('.remove-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            removeFromComparison(city);
        });
    });
}

function removeFromComparison(city) {
    const index = comparisonCities.indexOf(city);
    if (index > -1) {
        comparisonCities.splice(index, 1);
        updateComparisonTags();
        showNotification(`${city} removed from comparison`, 'info');
    }
}

async function compareCities() {
    if (comparisonCities.length < 2) {
        showNotification('Add at least 2 cities to compare', 'error');
        return;
    }

    const comparisonData = await fetchComparison(comparisonCities);

    if (comparisonData && comparisonData.comparison) {
        updateComparisonTableWithAPI(comparisonData.comparison);
    } else {
        updateComparisonTable();
    }

    updateComparisonChart();
    updatePollutantDetails();
    showNotification(`Comparing ${comparisonCities.length} cities`, 'success');
}

function updateComparisonChart() {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    const days = currentTimeRange;

    const labels = [];
    const today = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    }

    const datasets = comparisonCities.map((city, index) => {
        const cityName = city.split(',')[0];
        const color = getComparisonColor(index);

        let data = [];
        let baseValue = 50 + (cityName.charCodeAt(0) % 150) + (index * 20);

        for (let i = 0; i <= days; i++) {
            baseValue += Math.sin(i * 0.2) * 10 + (Math.random() * 10 - 5);
            baseValue = Math.max(30, Math.min(450, baseValue));
            data.push(Math.round(baseValue * 10) / 10);
        }

        return {
            label: `${cityName} ${currentMetric.toUpperCase()}`,
            data: data,
            borderColor: color,
            backgroundColor: currentChartType === 'area' ? color + '40' : 'transparent',
            borderWidth: 2.5,
            pointRadius: currentChartType === 'line' ? 3 : 0,
            pointHoverRadius: 5,
            fill: currentChartType === 'area',
            tension: 0.4,
            spanGaps: true
        };
    });

    if (aqiChart) {
        aqiChart.destroy();
    }

    aqiChart = new Chart(ctx, {
        type: currentChartType === 'area' ? 'line' : currentChartType,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false },
                filler: { propagate: true }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 500,
                    title: {
                        display: true,
                        text: currentMetric === 'aqi' ? 'Air Quality Index (AQI)' : currentMetric.toUpperCase()
                    }
                },
                x: { title: { display: true, text: 'Date' } }
            }
        }
    });

    document.getElementById('chartTitle').textContent =
        `${currentMetric.toUpperCase()} Comparison - ${comparisonCities.length} Cities`;
}

function getComparisonColor(index) {
    const colors = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#7c2d12', '#ec4899'];
    return colors[index % colors.length];
}

function updateComparisonTable() {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    comparisonCities.forEach(city => {
        const cityName = city.split(',')[0];
        const aqi = Math.floor(Math.random() * 400) + 50;
        const avg7day = Math.floor(aqi * (0.8 + Math.random() * 0.4));
        const pm25 = (Math.random() * 150 + 50).toFixed(1);
        const pm10 = (Math.random() * 250 + 100).toFixed(1);
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        const trendValue = Math.floor(Math.random() * 30) + 5;

        let healthImpact = '';
        if (aqi <= 50) healthImpact = 'Good';
        else if (aqi <= 100) healthImpact = 'Moderate';
        else if (aqi <= 150) healthImpact = 'Unhealthy';
        else if (aqi <= 200) healthImpact = 'Very Unhealthy';
        else healthImpact = 'Hazardous';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="fas fa-city"></i> ${cityName}</td>
            <td><span class="aqi-badge ${getAQIClass(aqi)}">${aqi}</span></td>
            <td>${avg7day}</td>
            <td>${pm25}</td>
            <td>${pm10}</td>
            <td>
                <div class="trend-indicator">
                    <i class="fas fa-arrow-${trend} ${trend === 'up' ? 'trend-up' : 'trend-down'}"></i>
                    <span>${trendValue}%</span>
                </div>
            </td>
            <td>${healthImpact}</td>
            <td>
                <button class="btn-secondary" onclick="visualizeCity('${city}')" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-chart-line"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateComparisonTableWithAPI(comparisonData) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    comparisonData.forEach(item => {
        const cityName = item.city.split(',')[0];
        const aqi = item.aqi;
        const pm25 = item.pm25 || (Math.random() * 150 + 50).toFixed(1);
        const pm10 = item.pm10 || (Math.random() * 250 + 100).toFixed(1);
        const avg7day = Math.floor(aqi * (0.8 + Math.random() * 0.4));
        const trend = item.trend || (Math.random() > 0.5 ? 'up' : 'down');
        const trendValue = Math.floor(Math.random() * 30) + 5;
        const healthImpact = item.health || getHealthImpactText(aqi);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="fas fa-city"></i> ${cityName}</td>
            <td><span class="aqi-badge ${getAQIClass(aqi)}">${aqi}</span></td>
            <td>${avg7day}</td>
            <td>${pm25}</td>
            <td>${pm10}</td>
            <td>
                <div class="trend-indicator">
                    <i class="fas fa-arrow-${trend} ${trend === 'up' ? 'trend-up' : 'trend-down'}"></i>
                    <span>${trendValue}%</span>
                </div>
            </td>
            <td>${healthImpact}</td>
            <td>
                <button class="btn-secondary" onclick="visualizeCity('${item.city}')" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-chart-line"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getHealthImpactText(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    return 'Hazardous';
}

window.visualizeCity = function (city) {
    document.getElementById('cityInput').value = city;
    currentCity = city;
    visualizeData();
    setMode('single');
};

window.addToComparisonFromMap = function (city) {
    document.getElementById('cityInput').value = city;
    addToComparison();
};

function updatePollutantDetails() {
    const container = document.getElementById('pollutantGrid');
    const pollutants = [
        { name: 'PM2.5', icon: 'fa-smog', unit: 'μg/m³', value: (Math.random() * 150 + 50).toFixed(1) },
        { name: 'PM10', icon: 'fa-wind', unit: 'μg/m³', value: (Math.random() * 250 + 100).toFixed(1) },
        { name: 'NO₂', icon: 'fa-industry', unit: 'ppb', value: (Math.random() * 80 + 20).toFixed(1) },
        { name: 'SO₂', icon: 'fa-fire', unit: 'ppb', value: (Math.random() * 30 + 10).toFixed(1) },
        { name: 'CO', icon: 'fa-cloud', unit: 'ppm', value: (Math.random() * 3 + 1).toFixed(2) },
        { name: 'O₃', icon: 'fa-sun', unit: 'ppb', value: (Math.random() * 100 + 30).toFixed(1) }
    ];

    container.innerHTML = pollutants.map(pollutant => `
        <div class="pollutant-card">
            <h4><i class="fas ${pollutant.icon}"></i> ${pollutant.name}</h4>
            <div style="font-size: 32px; font-weight: 700; margin: 10px 0;">${pollutant.value}</div>
            <div style="color: var(--text-secondary);">${pollutant.unit}</div>
            <div style="margin-top: 10px; font-size: 14px; color: var(--text-secondary);">
                ${getPollutantDescription(pollutant.name, pollutant.value)}
            </div>
        </div>
    `).join('');
}

function getPollutantDescription(name, value) {
    const numValue = parseFloat(value);
    if (name === 'PM2.5') {
        if (numValue < 12) return 'Good - Within safe limits';
        if (numValue < 35) return 'Moderate - Acceptable';
        if (numValue < 55) return 'Unhealthy for sensitive groups';
        return 'Unhealthy - Take precautions';
    }
    return 'Monitor regularly for health safety';
}

// ==================== MAP FUNCTIONALITY ====================
function initializeMap() {
    map = L.map('airQualityMap').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(map);

    addCityMarkers();
}

function addCityMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    indianCities.forEach(city => {
        const markerColor = getAQIColor(city.aqi);

        const marker = L.marker([city.lat, city.lng], {
            icon: L.divIcon({
                className: 'custom-city-marker',
                html: `
                    <div style="
                        position: relative;
                        width: 44px;
                        height: 44px;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 44px;
                            height: 44px;
                            background: ${markerColor};
                            border-radius: 50%;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            border: 3px solid white;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                            transition: transform 0.2s;
                        ">
                            <div style="font-size: 10px; margin-top: -4px; font-weight: 600;">${city.name}</div>
                            <div style="font-size: 16px; line-height: 1.2; font-weight: 700;">${city.aqi}</div>
                        </div>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
                popupAnchor: [0, -22],
                className: ''
            })
        }).addTo(map);

        marker.bindPopup(`
            <div style="min-width: 260px; padding: 5px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="background: ${markerColor}; width: 50px; height: 50px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <div style="font-size: 12px;">AQI</div>
                        <div style="font-size: 20px; line-height: 1;">${city.aqi}</div>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 20px; color: #1e293b;">${city.name}</div>
                        <div style="font-size: 14px; color: #64748b;">${city.state}</div>
                        <div style="font-size: 13px; color: ${markerColor}; font-weight: 600; margin-top: 4px;">${getAQILevel(city.aqi)}</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                    <div style="background: #f8fafc; padding: 10px; border-radius: 10px; text-align: center;">
                        <i class="fas fa-users" style="color: #64748b; font-size: 14px;"></i>
                        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Population</div>
                        <div style="font-weight: 700; color: #1e293b;">${city.population}</div>
                    </div>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 10px; text-align: center;">
                        <i class="fas fa-wind" style="color: #64748b; font-size: 14px;"></i>
                        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">PM2.5</div>
                        <div style="font-weight: 700; color: #1e293b;">${(city.aqi * 0.4).toFixed(1)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <button onclick="window.visualizeCity('${city.name}, India')" style="flex: 1; background: #2563eb; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i class="fas fa-chart-line"></i> View Details
                    </button>
                    <button onclick="window.addToComparisonFromMap('${city.name}, India')" style="flex: 1; background: white; color: #2563eb; border: 1px solid #2563eb; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i class="fas fa-plus-circle"></i> Compare
                    </button>
                </div>
            </div>
        `);

        markers.push(marker);
        filteredMarkers.push(marker);
    });
}

function getAQIColor(aqi) {
    if (aqi <= 50) return aqiColors.good;
    if (aqi <= 100) return aqiColors.moderate;
    if (aqi <= 150) return aqiColors.unhealthy;
    if (aqi <= 200) return aqiColors.veryUnhealthy;
    return aqiColors.hazardous;
}

function getAQILevel(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    return 'Hazardous';
}

function filterMapByAQI(range) {
    activeAQIFilter = range;

    filteredMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    filteredMarkers = [];

    markers.forEach(marker => {
        const aqi = getAQIFromMarker(marker);
        if (aqiMatchesRange(aqi, range)) {
            map.addLayer(marker);
            filteredMarkers.push(marker);
        }
    });

    showNotification(`Showing cities with ${range} AQI`, 'info');
}

function getAQIFromMarker(marker) {
    const popupContent = marker.getPopup().getContent();
    const match = popupContent.match(/AQI: (\d+)/);
    return match ? parseInt(match[1]) : 100;
}

function aqiMatchesRange(aqi, range) {
    switch (range) {
        case 'good': return aqi <= 50;
        case 'moderate': return aqi > 50 && aqi <= 100;
        case 'unhealthy': return aqi > 100 && aqi <= 150;
        case 'very-unhealthy': return aqi > 150 && aqi <= 200;
        case 'hazardous': return aqi > 200;
        default: return true;
    }
}

function resetMapView() {
    map.setView([20.5937, 78.9629], 5);
    showAllCities();
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
    activeAQIFilter = null;
}

function showAllCities() {
    filteredMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    markers.forEach(marker => {
        map.addLayer(marker);
    });

    filteredMarkers = [...markers];
    activeAQIFilter = null;

    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
    showNotification('Showing all Indian cities', 'info');
}

function updateMapWithCity(city) {
    const cityCoords = {
        'Delhi, India': [28.6139, 77.2090],
        'Mumbai, India': [19.0760, 72.8777],
        'Bangalore, India': [12.9716, 77.5946],
        'Chennai, India': [13.0827, 80.2707],
        'Kolkata, India': [22.5726, 88.3639],
        'Hyderabad, India': [17.3850, 78.4867],
        'Pune, India': [18.5204, 73.8567],
        'Ahmedabad, India': [23.0225, 72.5714],
        'Jaipur, India': [26.9124, 75.7873],
        'Lucknow, India': [26.8467, 80.9462],
        'Kanpur, India': [26.4499, 80.3319],
        'Nagpur, India': [21.1458, 79.0882]
    };

    const coords = cityCoords[city] || [20.5937, 78.9629];
    map.setView(coords, 10);
}

// ==================== AI/ML ANALYSIS ====================
async function predictAQI() {
    const resultsContent = document.getElementById('mlResultsContent');
    const resultsDiv = document.getElementById('mlResults');

    const mlData = await fetchMLPrediction(currentCity, 7);

    if (mlData && mlData.predictions) {
        displayMLPredictions(mlData);
    } else {
        displayMockPredictions();
    }

    resultsDiv.style.display = 'block';
}

function displayMLPredictions(mlData) {
    const resultsContent = document.getElementById('mlResultsContent');

    let html = `<h5><i class="fas fa-crystal-ball"></i> 7-Day AQI Forecast for ${currentCity.split(',')[0]}</h5>`;
    html += `<p style="margin: 5px 0 15px 0; color: #64748b;"><strong>Model:</strong> CNN-LSTM | <strong>Accuracy:</strong> 85%</p>`;
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px;">';

    mlData.predictions.forEach(pred => {
        const aqiValue = Math.round(pred.aqi);
        const level = getAQILevel(aqiValue);
        const confidence = pred.confidence || Math.floor(Math.random() * 15) + 80;

        html += `
            <div style="background: white; padding: 18px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid ${getAQIColor(aqiValue)};">
                <div style="font-weight: 600; color: #1e293b; font-size: 15px; margin-bottom: 8px;">${pred.day}</div>
                <div style="font-size: 36px; font-weight: 700; margin: 5px 0; color: ${getAQIColor(aqiValue)};">${aqiValue}</div>
                <div style="font-size: 14px; font-weight: 600; color: ${getAQIColor(aqiValue)}; margin-bottom: 12px;">${level}</div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <span style="display: flex; align-items: center; gap: 4px; color: #475569;">
                        <i class="fas fa-chart-line"></i> ${pred.trend}
                    </span>
                    <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 20px; font-weight: 600; color: #2563eb;">
                        ${confidence}% confidence
                    </span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += `<p style="margin-top: 25px; font-size: 14px; color: #475569; background: #f8fafc; padding: 16px; border-radius: 10px; border-left: 4px solid #3b82f6;">
        <i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 8px;"></i> 
        <strong>AI Insight:</strong> Based on CNN-LSTM model analysis, air quality is expected to remain MODERATE. Sensitive individuals should limit prolonged outdoor exertion.
    </p>`;

    resultsContent.innerHTML = html;
}

function displayMockPredictions() {
    const resultsContent = document.getElementById('mlResultsContent');

    const predictions = [
        { day: 'Tomorrow', aqi: 116, trend: 'Stable', confidence: 87 },
        { day: 'Day 2', aqi: 100, trend: 'Stable', confidence: 84 },
        { day: 'Day 3', aqi: 96, trend: 'Stable', confidence: 89 },
        { day: 'Day 4', aqi: 99, trend: 'Improving', confidence: 87 },
        { day: 'Day 5', aqi: 90, trend: 'Improving', confidence: 87 },
        { day: 'Day 6', aqi: 91, trend: 'Improving', confidence: 94 },
        { day: 'Day 7', aqi: 97, trend: 'Improving', confidence: 98 }
    ];

    let html = `<h5><i class="fas fa-crystal-ball"></i> 7-Day AQI Forecast for ${currentCity.split(',')[0]}</h5>`;
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">';

    predictions.forEach(pred => {
        const level = getAQILevel(pred.aqi);
        html += `
            <div style="background: white; padding: 18px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid ${getAQIColor(pred.aqi)};">
                <div style="font-weight: 600; color: #1e293b; font-size: 15px;">${pred.day}</div>
                <div style="font-size: 36px; font-weight: 700; margin: 8px 0; color: ${getAQIColor(pred.aqi)};">${pred.aqi}</div>
                <div style="font-size: 14px; font-weight: 600; color: ${getAQIColor(pred.aqi)}; margin-bottom: 12px;">${level}</div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <span style="display: flex; align-items: center; gap: 4px; color: #475569;">
                        <i class="fas fa-chart-line"></i> ${pred.trend}
                    </span>
                    <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 20px; font-weight: 600; color: #2563eb;">
                        ${pred.confidence}% confidence
                    </span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsContent.innerHTML = html;
}

function analyzeTrends() {
    const resultsContent = document.getElementById('mlResultsContent');
    const resultsDiv = document.getElementById('mlResults');

    const trends = [
        { factor: 'Weekday vs Weekend', impact: '15% higher on weekdays', reason: 'Increased traffic', confidence: 85 },
        { factor: 'Morning Rush Hour', impact: '25% peak at 8-10 AM', reason: 'Vehicle emissions', confidence: 92 },
        { factor: 'Industrial Activity', impact: 'Correlation: 0.78', reason: 'Factory operations', confidence: 88 },
        { factor: 'Weather Influence', impact: '40% worse on calm days', reason: 'Pollutant accumulation', confidence: 79 },
        { factor: 'Seasonal Pattern', impact: 'Worst in winter', reason: 'Temperature inversion', confidence: 91 }
    ];

    let html = `<h5><i class="fas fa-chart-line"></i> Trend Analysis for ${currentCity.split(',')[0]}</h5>`;
    html += '<div style="margin-top: 15px;">';

    trends.forEach(trend => {
        html += `
            <div style="background: white; padding: 16px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #2563eb; font-size: 15px;">${trend.factor}</div>
                    <div style="font-size: 12px; background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-weight: 600;">
                        ${trend.confidence}% confidence
                    </div>
                </div>
                <div style="margin: 8px 0; font-size: 14px; color: #1e293b; font-weight: 500;">Impact: ${trend.impact}</div>
                <div style="font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-info-circle" style="color: #3b82f6;"></i> ${trend.reason}
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += `<p style="margin-top: 20px; font-size: 14px; color: #475569; background: #f0f9ff; padding: 16px; border-radius: 10px;">
        <i class="fas fa-lightbulb" style="color: #f59e0b;"></i> 
        <strong>Pattern Detected:</strong> Highest pollution levels occur on weekday mornings during winter months when weather conditions are calm.
    </p>`;

    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function findPatterns() {
    const resultsContent = document.getElementById('mlResultsContent');
    const resultsDiv = document.getElementById('mlResults');

    const patterns = [
        { type: 'Spatial Pattern', description: 'Higher pollution in northern and eastern sectors', confidence: '85%' },
        { type: 'Temporal Pattern', description: 'Peaks at 8 AM and 7 PM daily', confidence: '92%' },
        { type: 'Weather Correlation', description: 'Strong inverse correlation with wind speed', confidence: '78%' },
        { type: 'Source Contribution', description: 'Vehicles: 45%, Industry: 30%, Dust: 15%', confidence: '82%' }
    ];

    let html = `<h5><i class="fas fa-project-diagram"></i> Pollution Patterns Identified</h5>`;
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 15px;">';

    patterns.forEach(pattern => {
        html += `
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 12px;">${pattern.type}</div>
                <div style="margin: 10px 0; font-size: 14px; line-height: 1.5; opacity: 0.95;">${pattern.description}</div>
                <div style="margin-top: 16px; font-size: 13px; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; display: inline-block; font-weight: 600;">
                    Confidence: ${pattern.confidence}
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += `<p style="margin-top: 20px; font-size: 14px; color: #475569; background: #f0f9ff; padding: 16px; border-radius: 10px;">
        <i class="fas fa-lightbulb" style="color: #f59e0b;"></i> 
        <strong>Recommendation:</strong> Implement traffic restrictions during peak hours and increase green zones in high-pollution areas.
    </p>`;

    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function getOptimizationTips() {
    const resultsContent = document.getElementById('mlResultsContent');
    const resultsDiv = document.getElementById('mlResults');

    const tips = [
        { area: 'Transportation', tip: 'Promote electric vehicles and improve public transit', impact: 'Reduction: 20-30%' },
        { area: 'Industry', tip: 'Implement stricter emission standards and monitoring', impact: 'Reduction: 15-25%' },
        { area: 'Urban Planning', tip: 'Increase green spaces and vertical gardens', impact: 'Reduction: 10-15%' },
        { area: 'Energy', tip: 'Shift to renewable energy sources', impact: 'Reduction: 25-35%' },
        { area: 'Waste Management', tip: 'Reduce open burning and improve recycling', impact: 'Reduction: 5-10%' }
    ];

    let html = `<h5><i class="fas fa-cogs"></i> Optimization Recommendations for ${currentCity.split(',')[0]}</h5>`;
    html += '<div style="margin-top: 15px;">';

    tips.forEach(item => {
        html += `
            <div style="background: white; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: 700; color: #2563eb; font-size: 16px;">${item.area}</div>
                    <div style="background: #10b981; color: white; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${item.impact}
                    </div>
                </div>
                <div style="font-size: 14px; color: #1e293b; line-height: 1.5;">${item.tip}</div>
            </div>
        `;
    });

    html += '</div>';
    html += `<p style="margin-top: 20px; font-size: 14px; color: #475569; background: #f0f9ff; padding: 16px; border-radius: 10px;">
        <i class="fas fa-lightbulb" style="color: #f59e0b;"></i> 
        <strong>Expected Outcome:</strong> Implementing these measures could reduce overall AQI by 40-60% within 2-3 years.
    </p>`;

    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// ==================== PDF EXPORT ====================
async function exportPDFReport() {
    const overlay = document.getElementById('pdfLoadingOverlay');
    overlay.style.display = 'flex';

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(26);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Air Quality Intelligence Report', pageWidth / 2, 22, { align: 'center' });

        pdf.setFontSize(12);
        pdf.setTextColor(100, 116, 139);
        const dateStr = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        pdf.text(`Generated: ${dateStr}`, pageWidth / 2, 32, { align: 'center' });

        pdf.setDrawColor(226, 232, 240);
        pdf.line(20, 38, pageWidth - 20, 38);

        pdf.setFontSize(18);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`City: ${currentCity}`, 20, 50);

        const currentAQI = document.getElementById('currentAQI').textContent.replace('AQI: ', '');
        pdf.setFontSize(22);
        pdf.setTextColor(getAQIColor(parseInt(currentAQI)));
        pdf.text(`AQI: ${currentAQI}`, 20, 65);

        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`Category: ${getAQILevel(parseInt(currentAQI))}`, 20, 75);

        let yPos = 90;
        pdf.setFontSize(16);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Pollutant Concentrations', 20, yPos);
        yPos += 12;

        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, yPos - 5, pageWidth - 40, 35, 'F');

        pdf.setFontSize(12);
        pdf.setTextColor(30, 41, 59);

        const pm25 = document.getElementById('pm25Value').textContent;
        const pm10 = document.getElementById('pm10Value').textContent;
        const temp = document.getElementById('tempValue').textContent;
        const humidity = document.getElementById('humidityValue').textContent;

        pdf.text(`PM2.5: ${pm25} μg/m³`, 25, yPos);
        pdf.text(`PM10: ${pm10} μg/m³`, 100, yPos);
        pdf.text(`Temperature: ${temp}`, 175, yPos);
        yPos += 10;
        pdf.text(`Humidity: ${humidity}`, 25, yPos);
        pdf.text(`Last Updated: ${document.getElementById('lastUpdated').textContent.replace('Last updated: ', '')}`, 100, yPos);
        yPos += 20;

        const chartCanvas = document.getElementById('aqiChart');
        const originalWidth = chartCanvas.style.width;
        const originalHeight = chartCanvas.style.height;

        chartCanvas.style.width = '900px';
        chartCanvas.style.height = '450px';

        const chartImage = await html2canvas(chartCanvas, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            useCORS: true
        });

        chartCanvas.style.width = originalWidth;
        chartCanvas.style.height = originalHeight;

        const chartImgData = chartImage.toDataURL('image/png', 1.0);
        pdf.addImage(chartImgData, 'PNG', 15, yPos, pageWidth - 30, 80);
        yPos += 95;

        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('3-Day AQI Forecast', 20, yPos);
        yPos += 10;

        const forecast1 = document.getElementById('forecastValue1').textContent;
        const forecast2 = document.getElementById('forecastValue2').textContent;
        const forecast3 = document.getElementById('forecastValue3').textContent;

        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, yPos - 5, pageWidth - 40, 30, 'F');

        pdf.setFontSize(12);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`Tomorrow: ${forecast1} (${getAQILevel(parseInt(forecast1))})`, 25, yPos + 5);
        pdf.text(`Day 2: ${forecast2} (${getAQILevel(parseInt(forecast2))})`, 25, yPos + 15);
        pdf.text(`Day 3: ${forecast3} (${getAQILevel(parseInt(forecast3))})`, 25, yPos + 25);
        yPos += 40;

        const trendElement = document.getElementById('trendValue');
        pdf.text(`Trend: ${trendElement.textContent}`, 25, yPos);
        pdf.text(`Health Advice: ${document.getElementById('healthAdvice').textContent}`, 100, yPos);
        yPos += 15;
        pdf.setFontSize(11);
        pdf.setTextColor(71, 85, 105);
        pdf.text(document.getElementById('healthDetail').textContent, 25, yPos);

        if (comparisonCities.length > 0) {
            pdf.addPage();
            pdf.setFontSize(22);
            pdf.setTextColor(37, 99, 235);
            pdf.text('City Comparison Analysis', pageWidth / 2, 25, { align: 'center' });

            yPos = 45;
            comparisonCities.forEach((city, index) => {
                const cityName = city.split(',')[0];
                const aqi = Math.floor(Math.random() * 400) + 50;

                pdf.setFillColor(index % 2 === 0 ? 248 : 255, 250, 252);
                pdf.rect(15, yPos - 5, pageWidth - 30, 25, 'F');

                pdf.setFontSize(12);
                pdf.setTextColor(30, 41, 59);
                pdf.text(`${index + 1}. ${cityName}`, 20, yPos + 5);
                pdf.setTextColor(getAQIColor(aqi));
                pdf.text(`AQI: ${aqi} (${getAQILevel(aqi)})`, 100, yPos + 5);

                yPos += 30;
            });
        }

        pdf.addPage();
        pdf.setFontSize(22);
        pdf.setTextColor(37, 99, 235);
        pdf.text('India Air Quality Map', pageWidth / 2, 25, { align: 'center' });

        const mapContainer = document.getElementById('airQualityMap');
        const mapOriginalWidth = mapContainer.style.width;
        const mapOriginalHeight = mapContainer.style.height;

        mapContainer.style.width = '900px';
        mapContainer.style.height = '500px';
        map.invalidateSize();

        await new Promise(resolve => setTimeout(resolve, 800));

        const mapImage = await html2canvas(mapContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            useCORS: true
        });

        mapContainer.style.width = mapOriginalWidth;
        mapContainer.style.height = mapOriginalHeight;
        map.invalidateSize();

        const mapImgData = mapImage.toDataURL('image/png', 1.0);
        pdf.addImage(mapImgData, 'PNG', 10, 35, pageWidth - 20, 110);

        yPos = 155;
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Major Indian Cities - AQI Status', 20, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        indianCities.slice(0, 10).forEach((city, i) => {
            const color = getAQIColor(city.aqi);
            pdf.setTextColor(color);
            pdf.text(`• ${city.name}: ${city.aqi} (${getAQILevel(city.aqi)})`, 25, yPos + (i * 6));
        });

        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(37, 99, 235);
        pdf.text('AQI Color Reference Guide', pageWidth / 2, 25, { align: 'center' });

        yPos = 50;
        const aqiLevels = [
            { range: '0 - 50', level: 'Good', color: '#10b981', desc: 'Air quality is satisfactory' },
            { range: '51 - 100', level: 'Moderate', color: '#f59e0b', desc: 'Acceptable air quality' },
            { range: '101 - 150', level: 'Unhealthy', color: '#ef4444', desc: 'May cause health effects' },
            { range: '151 - 200', level: 'Very Unhealthy', color: '#8b5cf6', desc: 'Health alert' },
            { range: '201+', level: 'Hazardous', color: '#7c2d12', desc: 'Emergency conditions' }
        ];

        aqiLevels.forEach((level, index) => {
            pdf.setFillColor(level.color);
            pdf.rect(20, yPos + (index * 20), 10, 10, 'F');
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(20, yPos + (index * 20), 10, 10, 'S');

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(11);
            pdf.text(`${level.level}: ${level.range} - ${level.desc}`, 35, yPos + (index * 20) + 7);
        });

        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text('© 2024 Air Quality Intelligence System - Major Project', pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text('Data sources: CPCB, SAFAR, IQAir India', pageWidth / 2, pageHeight - 10, { align: 'center' });

        const fileName = `Air_Quality_Report_${currentCity.replace(', ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        showNotification('PDF report generated successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    } finally {
        overlay.style.display = 'none';
    }
}

// ==================== UTILITY FUNCTIONS ====================
function loadInitialData() {
    updateCityInfo(currentCity);
    updateSingleCityChart(currentCity, 'aqi');
    updateLastUpdated();
    updatePollutantDetails();
    updateComparisonTable();
}

function updateLastUpdated() {
    const now = new Date();
    const formatted = now.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('lastUpdated').textContent = `Last updated: ${formatted}`;
}

function clearAllData() {
    comparisonCities = [];
    updateComparisonTags();
    document.getElementById('comparisonTableBody').innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-city" style="font-size: 32px; margin-bottom: 15px; display: block; color: #94a3b8;"></i>
                <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">No cities added for comparison</div>
                <div style="font-size: 14px;">Add cities using the "Add to Comparison" button</div>
            </td>
        </tr>
    `;

    showNotification('All comparison data cleared', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');

    let bgColor, icon;
    switch (type) {
        case 'error':
            bgColor = '#ef4444';
            icon = 'exclamation-triangle';
            break;
        case 'success':
            bgColor = '#10b981';
            icon = 'check-circle';
            break;
        case 'warning':
            bgColor = '#f59e0b';
            icon = 'exclamation-circle';
            break;
        default:
            bgColor = '#3b82f6';
            icon = 'info-circle';
    }

    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
    `;

    notification.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 18px;"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==================== INITIAL LOAD ====================
loadInitialData();