# Cloud-Based Air Pollution Forecasting System Using Real-Time APIs

A full-stack web application that provides **real-time air quality monitoring** and **7-day AQI forecasting** for Indian cities. The system integrates the **OpenWeather API** for live pollution and weather data, uses a **CNN-LSTM deep learning model** for prediction, and displays results on a responsive dashboard with interactive charts, an India map, city comparison, weather impact analysis, and PDF report generation.

---

## 📌 Features

- **Real-time AQI Monitoring** – Fetches live pollution data from OpenWeather API.
- **7-Day AQI Forecasting** – CNN-LSTM model predicts future AQI with ~85% accuracy.
- **Interactive Dashboard** – Charts (line, bar, area), India map with color-coded city markers.
- **City Comparison** – Compare AQI across multiple cities side-by-side.
- **Weather Impact Analysis** – Shows how temperature, humidity, wind speed, and pressure affect AQI.
- **PDF Report Generation** – Export comprehensive reports with charts and maps.
- **Cloud-Based Architecture** – Scalable backend (Node.js/Express) and MongoDB Atlas.
- **Responsive UI** – Works seamlessly on desktop, tablet, and mobile.

---

## 🛠 Tech Stack

| Layer            | Technologies |
|------------------|--------------|
| Frontend         | HTML, CSS, JavaScript, Chart.js, Leaflet.js, jsPDF |
| Backend          | Node.js, Express.js |
| Database         | MongoDB Atlas |
| Machine Learning | Python, TensorFlow, Keras (CNN-LSTM) |
| API              | OpenWeather API |
| Deployment       | Google Colab (for training), any cloud host (for app) |

---

## 📂 Project Structure

air-quality-forecasting/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── services/
│       └── openWeatherService.js
├── ml-model/
│   ├── train.py
│   ├── requirements.txt
│   └── aqi_model.h5
├── README.md
└── .gitignore

---

## 🚀 Installation & Setup

### 1. Clone the repository
git clone https://github.com/your-username/air-quality-forecasting.git
cd air-quality-forecasting

### 2. Backend Setup
cd backend
npm install

Create a `.env` file in `backend/` with:
PORT=5000
OPENWEATHER_API_KEY=your_openweather_api_key
MONGODB_URI=your_mongodb_atlas_connection_string

Start the backend:
npm start

### 3. Frontend Setup
Open `frontend/index.html` in your browser, or use a live server:
cd frontend
python -m http.server 8000
Then visit `http://localhost:8000`.

### 4. ML Model (Optional)
cd ml-model
pip install -r requirements.txt
python train.py

---

## 🔌 API Endpoints

| Method | Endpoint            | Description                      |
|--------|---------------------|----------------------------------|
| GET    | /api/health         | Check backend status             |
| GET    | /api/aqi/:city      | Get real-time AQI & weather data |
| GET    | /api/cities         | Get list of Indian cities        |
| GET    | /api/historical/:city| Get historical data for ML training |
| POST   | /api/compare        | Compare AQI across multiple cities |
| POST   | /api/ml/predict     | Get 7-day AQI forecast           |

---

## 🧠 Machine Learning Model

- **Model:** CNN-LSTM (Convolutional Neural Network + Long Short-Term Memory)
- **Input:** 30 days of historical AQI + weather data (11 features)
- **Output:** 7-day AQI forecast
- **Accuracy:** ~85.2%
- **Training:** Google Colab with Tesla T4 GPU, 50 epochs, Adam optimizer, MSE loss.
- **Features Used:** AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃, Temperature, Humidity, Pressure, Wind Speed.

---

---

**⭐ If you find this project useful, please give it a star!**
