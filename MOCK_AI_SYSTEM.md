# 🤖 Mock AI Prediction System

## Overview

Since we don't have real-time AI data from the external `solar-predictor` service, we've implemented a sophisticated **Mock AI Service** that generates realistic predictions based on:

- **Physics-based calculations** (solar panel efficiency, temperature effects, etc.)
- **Historical data patterns** from your sensor database
- **Environmental conditions** (light status, humidity, wind speed)
- **Time-based logic** (day/night cycles, solar noon optimization)

## 🧠 How It Works

### 1. **Physics-Based Power Calculation**

```
Base Power = Irradiance × Panel Efficiency × Panel Area × Time Efficiency
```

- **Irradiance**: Estimated from light status (bright: 800-1000 W/m², good: 600-750 W/m², etc.)
- **Panel Efficiency**: 15% (industry standard)
- **Panel Area**: 0.13 m² (simulating a 20W panel)
- **Time Efficiency**: Cosine function peaking at solar noon (12 PM)

### 2. **Environmental Factor Adjustments**

- **Temperature Effect**: -0.4% per °C above 25°C (realistic temperature coefficient)
- **Humidity Effect**: High humidity slightly reduces efficiency
- **Wind Effect**: Moderate wind cools panels (improves efficiency), high wind reduces it

### 3. **Historical Pattern Learning**

- Analyzes your existing sensor data for similar time periods
- Adjusts predictions based on actual performance patterns
- Uses efficiency data to fine-tune predictions

### 4. **Realistic Variations**

- Adds ±15% random variation to simulate real-world uncertainty
- Different predictions for each API call (like a real ML model)

## 📊 API Endpoints

### **Current Hour Prediction**

```bash
GET /api/sensor/ai?type=current
```

Returns prediction for the current hour based on latest sensor data.

### **24-Hour Forecast**

```bash
GET /api/sensor/ai?type=day
```

Returns predictions for the next 24 hours with realistic day/night patterns.

### **Specific Hour Prediction**

```bash
GET /api/sensor/ai?type=hour&hour=12
```

Returns prediction for a specific hour (0-23).

### **Sensor-Based Prediction**

```bash
POST /api/sensor/ai
```

Accepts sensor data and returns AI prediction.

## 🔧 Implementation Details

### **Mock AI Service** (`src/lib/mockAIService.ts`)

- Singleton pattern for consistent predictions
- 5-minute caching for performance
- Automatic historical data integration
- Realistic physics calculations

### **Integration Points**

- **Sensor Processing**: Automatically generates AI predictions for new sensor data
- **Dashboard**: Displays predictions in the "AI Solar Predictions" section
- **Real-time Updates**: Predictions update as new data arrives

## 📈 Prediction Examples

### **Daytime (Solar Peak)**

- **Time**: 12:00 PM (solar noon)
- **Conditions**: Bright light, 25°C, 60% humidity, 5 km/h wind
- **Prediction**: ~13.68 mW
- **Factors**: High irradiance, optimal temperature, moderate wind cooling

### **Nighttime**

- **Time**: 2:00 AM
- **Conditions**: No light, 15°C, 80% humidity
- **Prediction**: 0 mW
- **Factors**: No solar irradiance

### **Morning/Evening**

- **Time**: 8:00 AM or 4:00 PM
- **Conditions**: Good light, 22°C, 65% humidity
- **Prediction**: ~8-10 mW
- **Factors**: Lower irradiance, good temperature, moderate efficiency

## 🚀 Usage

### **Populate Dashboard with AI Data**

```bash
npm run populate-ai
```

Sends 50 sensor data entries with integrated AI predictions.

### **Test AI Predictions**

```bash
# Current hour
curl "http://localhost:3000/api/sensor/ai?type=current"

# Day forecast
curl "http://localhost:3000/api/sensor/ai?type=day"

# Specific hour
curl "http://localhost:3000/api/sensor/ai?type=hour&hour=12"
```

## 🎯 Benefits

1. **Realistic Predictions**: Physics-based calculations provide believable results
2. **Historical Learning**: Uses your actual sensor data to improve predictions
3. **Real-time Updates**: Predictions change based on current conditions
4. **No External Dependencies**: Works completely offline
5. **Educational Value**: Shows how AI predictions would work in practice

## 🔮 Future Enhancements

When you're ready to integrate real AI:

1. **Replace** `mockAIService` with real `aiService`
2. **Update** API endpoints to call external service
3. **Keep** the same interface for seamless transition
4. **Compare** mock vs real predictions for validation

## 📝 Configuration

The mock AI system automatically:

- **Integrates** with your existing sensor data
- **Adapts** to your specific environmental conditions
- **Scales** with your data volume
- **Maintains** realistic prediction ranges

## 🎉 Result

You now have a **fully functional AI prediction system** that:

- Generates realistic solar power predictions
- Learns from your historical data
- Provides 24-hour forecasts
- Updates in real-time
- Works completely offline

Visit your dashboard at [http://localhost:3000](http://localhost:3000) and check out the **"AI Solar Predictions"** section! 🚀
