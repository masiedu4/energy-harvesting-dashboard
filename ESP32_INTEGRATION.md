# 🌞 ESP32 Integration Guide

## System Status: ✅ READY FOR REAL DATA

Your Energy Harvesting Dashboard is now configured and ready to receive real-time data from your ESP32 device.

## 📡 API Endpoint

**Send your ESP32 data to:**
```
POST http://localhost:3000/api/sensor
Content-Type: application/json
```

## 📊 Expected Data Format

Your ESP32 should send data in exactly this JSON format:

```json
{
  "temperature": 30.8,
  "humidity": 73.7,
  "ldrRaw": 4095,
  "irradiance": 1200.0,
  "lightStatus": "Light available, good for solar energy",
  "avgWind": 0.0,
  "busVoltage": 0.0,
  "current": 0.0,
  "power": 0.0,
  "hour": 20
}
```

## 🔧 Field Specifications

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `temperature` | number | -50 to 100 | Temperature in °C |
| `humidity` | number | 0 to 100 | Humidity percentage |
| `ldrRaw` | number | 0 to 4095 | Raw LDR sensor reading |
| `irradiance` | number | 0 to 2000 | Solar irradiance in W/m² |
| `lightStatus` | string | - | Light condition description |
| `avgWind` | number | 0 to 200 | Average wind speed in km/h |
| `busVoltage` | number | 0 to 20 | Bus voltage in V |
| `current` | number | -1000 to 1000 | Current in mA |
| `power` | number | 0 to 10000 | Power in mW |
| `hour` | number | 0 to 23 | Hour of the day (24-hour format) |

## 🚀 What Happens When You Send Data

1. **✅ Validation**: Data is validated against the expected format
2. **🤖 AI Processing**: AI predictions are generated for solar power
3. **💾 Database Storage**: Data is saved to Supabase database
4. **📊 Real-time Updates**: Dashboard updates instantly via Server-Sent Events
5. **📈 Chart Updates**: All charts and metrics refresh automatically

## 🌐 Dashboard Features

- **Real-time monitoring** of all sensor values
- **Beautiful visualizations** with multiple chart types
- **AI-powered solar predictions**
- **Environmental condition tracking**
- **Power generation analysis**
- **System efficiency metrics**

## 🔍 Testing Your Integration

### Check System Status
```bash
curl http://localhost:3000/api/sensor/clear
```

### Send Test Data
```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 30.8,
    "humidity": 73.7,
    "ldrRaw": 4095,
    "irradiance": 1200.0,
    "lightStatus": "Light available, good for solar energy",
    "avgWind": 0.0,
    "busVoltage": 5.2,
    "current": -18.9,
    "power": 98.0,
    "hour": 14
  }'
```

### Check Dashboard
Visit: http://localhost:3000

## ⚙️ System Management

### Clear All Data (if needed)
```bash
npm run clear-data
```

### Check System Status
```bash
npm run system-status
```

## 🔒 Data Retention

- **In-Memory**: Last 200 data points for real-time processing
- **Database**: All data permanently stored in Supabase
- **Cleanup**: Automatic cleanup of old in-memory data

## 🤖 AI Integration

Your system includes AI-powered solar predictions that:
- Analyze current environmental conditions
- Predict optimal power generation
- Calculate efficiency metrics
- Provide accuracy comparisons

## 📱 Dashboard Access

- **Local Development**: http://localhost:3000
- **Production**: Deploy to Vercel for public access
- **Mobile Responsive**: Works perfectly on all devices

## 🆘 Troubleshooting

### Data Not Showing?
1. Check if ESP32 is sending to correct endpoint
2. Verify JSON format matches exactly
3. Check network connectivity
4. Look at browser console for errors

### Stream Not Working?
1. Refresh the dashboard page
2. Click "Start Stream" button
3. Check if data is being received via "Check for Data"

### AI Predictions Empty?
1. Ensure you have recent sensor data
2. Click "Update Predictions" button
3. Check that all required fields are present

---

## 🎉 You're All Set!

Your Energy Harvesting Dashboard is now ready to receive and display your real ESP32 sensor data in beautiful, real-time visualizations. Start sending data and watch the magic happen! ✨
