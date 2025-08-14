# 🤖 AI Integration Guide: Solar-Predictor + Energy-Harvesting-Dashboard

This guide explains how to integrate your **solar-predictor** AI service with the **energy-harvesting-dashboard** for intelligent solar energy predictions.

## 🏗️ Architecture Overview

```
ESP32 Sensors → Energy Dashboard → AI Predictions → Enhanced Analytics
     ↓              ↓              ↓              ↓
  Real-time    Next.js API    FastAPI ML     Smart Insights
  Data         Routes         Service        & Forecasting
```

## 🚀 Quick Start

### 1. Start the Solar-Predictor Service

```bash
cd /path/to/solar-predictor
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify it's running:**

- Open http://localhost:8000/docs
- Test the `/predict/current` endpoint

### 2. Configure Environment Variables

Create `.env.local` in your dashboard project:

```bash
# Supabase (for data persistence)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Service
NEXT_PUBLIC_SOLAR_PREDICTOR_URL=http://localhost:8000
```

### 3. Start the Dashboard

```bash
cd /path/to/energy-harvesting-dashboard
npm run dev
```

## 🔌 API Integration Points

### AI Prediction Endpoints

| Endpoint                           | Method | Description                                |
| ---------------------------------- | ------ | ------------------------------------------ |
| `/api/sensor/ai?type=current`      | GET    | Current hour prediction using weather data |
| `/api/sensor/ai?type=day`          | GET    | 24-hour forecast                           |
| `/api/sensor/ai?type=hour&hour=12` | GET    | Specific hour prediction                   |
| `/api/sensor/ai`                   | POST   | Prediction from sensor data                |

### Example API Calls

**Get current hour prediction:**

```bash
curl "http://localhost:3000/api/sensor/ai?type=current"
```

**Get day forecast:**

```bash
curl "http://localhost:3000/api/sensor/ai?type=day"
```

**Predict from sensor data:**

```bash
curl -X POST "http://localhost:3000/api/sensor/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25.5,
    "humidity": 60.0,
    "lightStatus": "bright",
    "hour": 14
  }'
```

## 📊 Dashboard Features

### AI Predictions Section

The dashboard now includes:

1. **Real-time Predictions**: Current hour solar power predictions
2. **Weather Analysis**: Temperature, humidity, and irradiance insights
3. **24-Hour Forecast**: Complete day predictions vs actual performance
4. **Prediction Accuracy**: How well AI predictions match reality
5. **Efficiency Comparison**: Actual vs predicted efficiency metrics

### Data Flow

1. **ESP32 sends sensor data** → `/api/sensor` (POST)
2. **Dashboard processes data** → Calculates derived metrics
3. **AI service predicts** → Based on weather + sensor data
4. **Results displayed** → Real-time charts and metrics
5. **Accuracy tracking** → Compare predictions vs actual

## 🧠 AI Model Integration

### Input Features

The AI service expects:

```typescript
interface AIPredictionInput {
  temperature: number; // °C from DHT22
  irradiance: number; // W/m² (estimated from light status)
  humidity: number; // % from DHT22
  hr: number; // Hour of day (0-23)
}
```

### Output Features

```typescript
interface AIPrediction {
  source: string;
  temperature: number;
  irradiance: number;
  humidity: number;
  hr: number;
  hr_sin: number; // Cyclical time encoding
  hr_cos: number; // Cyclical time encoding
  predicted_power: number; // mW predicted output
}
```

### Light Status to Irradiance Mapping

```typescript
const lightMap = {
  bright: 800, // Full sun (800 W/m²)
  good: 600, // Partly cloudy
  moderate: 400, // Cloudy
  low: 200, // Overcast
  dark: 50, // Dusk/dawn
  night: 0, // Night
};
```

## 🔧 Configuration Options

### Environment Variables

| Variable                          | Default                 | Description            |
| --------------------------------- | ----------------------- | ---------------------- |
| `NEXT_PUBLIC_SOLAR_PREDICTOR_URL` | `http://localhost:8000` | AI service URL         |
| `NEXT_PUBLIC_SUPABASE_URL`        | -                       | Supabase project URL   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | -                       | Supabase anonymous key |

### AI Service Settings

- **Port**: 8000 (configurable)
- **Host**: 0.0.0.0 (for external access)
- **CORS**: Enabled for dashboard access
- **Cache**: 5-minute prediction caching

## 📈 Performance Monitoring

### Metrics Tracked

1. **Prediction Accuracy**: % difference between predicted and actual
2. **Efficiency Comparison**: Actual vs predicted efficiency
3. **Weather Correlation**: How weather affects predictions
4. **Time-based Patterns**: Hourly prediction accuracy

### Dashboard Views

- **Real-time Metrics**: Current predictions and accuracy
- **Historical Analysis**: Prediction performance over time
- **Weather Impact**: How conditions affect predictions
- **Efficiency Trends**: System performance vs AI expectations

## 🚨 Troubleshooting

### Common Issues

**AI Service Not Responding:**

```bash
# Check if service is running
curl http://localhost:8000/docs

# Check logs
tail -f solar-predictor.log
```

**Dashboard Can't Connect:**

```bash
# Verify environment variable
echo $NEXT_PUBLIC_SOLAR_PREDICTOR_URL

# Check network connectivity
ping localhost -p 8000
```

**Prediction Errors:**

- Verify sensor data format
- Check weather API connectivity
- Ensure model files are loaded

### Debug Mode

Enable detailed logging:

```typescript
// In aiService.ts
console.log("AI Service URL:", SOLAR_PREDICTOR_URL);
console.log("Request payload:", payload);
console.log("AI Response:", response);
```

## 🔮 Future Enhancements

### Planned Features

1. **Multi-model Support**: Different AI models for different conditions
2. **Learning Integration**: Use actual data to improve predictions
3. **Advanced Analytics**: Machine learning insights and recommendations
4. **Predictive Maintenance**: AI-powered system health monitoring
5. **Energy Optimization**: Smart recommendations for efficiency

### Customization

- **Model Training**: Retrain on your specific solar panel data
- **Feature Engineering**: Add more sensor inputs
- **Algorithm Selection**: Choose different ML approaches
- **Threshold Tuning**: Adjust prediction sensitivity

## 📚 API Documentation

### Solar-Predictor Endpoints

| Endpoint           | Description                     | Input        | Output        |
| ------------------ | ------------------------------- | ------------ | ------------- |
| `/predict/sensor`  | Predict from sensor data        | SensorData   | AIPrediction  |
| `/predict/current` | Current hour weather prediction | None         | AIPrediction  |
| `/predict/day`     | 24-hour forecast                | None         | AIDayForecast |
| `/predict/hour`    | Specific hour prediction        | hour (query) | AIPrediction  |

### Dashboard Integration

The dashboard automatically:

- Fetches predictions when new sensor data arrives
- Displays real-time prediction accuracy
- Shows weather-based forecasts
- Tracks prediction performance over time

## 🎯 Best Practices

1. **Keep AI Service Running**: Use process managers like PM2
2. **Monitor Performance**: Track prediction accuracy regularly
3. **Update Models**: Retrain with new data periodically
4. **Backup Data**: Ensure sensor data persistence
5. **Test Integration**: Verify endpoints before deployment

## 🔗 Useful Links

- [Solar-Predictor Repository](../solar-predictor)
- [Energy Dashboard Repository](./)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Chart.js Documentation](https://www.chartjs.org/)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
