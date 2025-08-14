# 🌞 Energy Harvesting Dashboard

A professional, real-time monitoring system for solar and wind energy harvesting with environmental sensors. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Real-time Data Streaming**: Server-Sent Events (SSE) for live sensor data updates
- **ESP32 Integration**: Direct compatibility with ESP32 sensor arrays
- **AI-Powered Predictions**: Machine learning solar power predictions using your solar-predictor service
- **Professional Dashboard**: Beautiful, responsive UI with real-time metrics and AI insights
- **Data Processing**: Automatic calculation of efficiency, cost savings, and carbon offset
- **Device Monitoring**: Connection quality, battery status, and system health
- **Data Validation**: Comprehensive input validation and error handling
- **Test Environment**: Built-in testing tools for development and debugging
- **Smart Analytics**: AI prediction accuracy tracking and performance comparison

## 🏗️ Architecture

```
ESP32 Device → WiFi → Next.js API → Real-time Dashboard
     ↓              ↓         ↓           ↓
  Sensors      HTTP POST   Data Store   SSE Stream
  (DHT22,      /api/sensor  (Memory)    /api/sensor/stream
   LDR,        JSON Data               Real-time Updates
   Anemometer,                         Professional UI
   INA219)
```

## 📊 Sensor Data Structure

The system processes the following data from your ESP32:

```typescript
interface ESP32SensorData {
  temperature: number; // °C from DHT22
  humidity: number; // % from DHT22
  lightStatus: string; // Light availability status
  windSpeed: number; // km/h from anemometer
  potentialWindPower: number; // Calculated wind power potential
  busVoltage: number; // V from INA219
  current: number; // mA from INA219
  power: number; // mW calculated power
}
```

## 🤖 AI Integration

This dashboard integrates with your **solar-predictor** AI service to provide intelligent solar energy predictions and insights.

### AI Features

- **Real-time Predictions**: Current hour solar power predictions based on weather and sensor data
- **24-Hour Forecasting**: Complete day predictions with weather data integration
- **Prediction Accuracy**: Track how well AI predictions match actual performance
- **Smart Analytics**: Compare predicted vs actual efficiency and power output
- **Weather Correlation**: Understand how environmental conditions affect predictions

### Quick Setup

1. **Start your solar-predictor service:**

   ```bash
   cd /path/to/solar-predictor
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Set environment variable:**

   ```bash
   NEXT_PUBLIC_SOLAR_PREDICTOR_URL=http://localhost:8000
   ```

3. **View AI predictions in the dashboard!**

For detailed integration instructions, see [AI_INTEGRATION.md](./AI_INTEGRATION.md).

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd energy-harvesting-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

```bash
npm run dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔌 ESP32 Integration

### Hardware Requirements

- ESP32 development board
- DHT22 temperature/humidity sensor
- LDR (Light Dependent Resistor)
- Anemometer for wind speed
- INA219 current/voltage sensor
- WiFi connectivity

### Code Integration

Update your ESP32 code to send data to the dashboard:

```cpp
const char* serverUrl = "http://192.168.1.185:3000/api/sensor";

// In your loop function
String payload = "{";
payload += "\"temperature\":" + String(temperature,1) + ",";
payload += "\"humidity\":" + String(humidity,1) + ",";
payload += "\"lightStatus\":\"" + lightStatus + "\",";
payload += "\"windSpeed\":" + String(avgWind,1) + ",";
payload += "\"potentialWindPower\":" + String(potentialPower,1) + ",";
payload += "\"busVoltage\":" + String(busVoltage,2) + ",";
payload += "\"current\":" + String(current_mA,2) + ",";
payload += "\"power\":" + String(power_mW,2);
payload += "}";

HTTPClient http;
http.begin(serverUrl);
http.addHeader("Content-Type", "application/json");
int httpCode = http.POST(payload);
http.end();
```

## 📡 API Endpoints

### POST `/api/sensor`

Receives sensor data from ESP32 devices.

**Request Body:**

```json
{
  "temperature": 24.5,
  "humidity": 65.2,
  "lightStatus": "Light available, good for solar energy",
  "windSpeed": 12.3,
  "potentialWindPower": 123.0,
  "busVoltage": 12.45,
  "current": 245.67,
  "power": 3056.78
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sensor data received and processed successfully",
  "data": {
    "id": "ESP32_001_1234567890",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "deviceId": "ESP32_001",
    "batteryLevel": 85,
    "totalEfficiency": 67.5,
    "energyHarvested": 0.85,
    "costSavings": 0.0001,
    "carbonOffset": 0.0008
  }
}
```

### GET `/api/sensor`

Retrieves stored sensor data with optional filtering.

**Query Parameters:**

- `limit`: Number of data points to return (default: 10)
- `startTime`: ISO timestamp for start of range
- `endTime`: ISO timestamp for end of range
- `stats`: Include statistics (true/false)

**Example:**

```
GET /api/sensor?limit=20&stats=true
```

### GET `/api/sensor/status`

Returns device status and system statistics.

**Response:**

```json
{
  "success": true,
  "message": "Device status retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "devices": [
    {
      "deviceId": "ESP32_001",
      "isOnline": true,
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "batteryLevel": 85,
      "connectionQuality": "excellent"
    }
  ],
  "statistics": {
    "totalReadings": 150,
    "averageTemperature": 23.4,
    "averageHumidity": 62.1,
    "averagePower": 2847.3,
    "totalEnergyHarvested": 127.8,
    "totalCostSavings": 0.0153,
    "totalCarbonOffset": 0.1176,
    "uptime": "100%",
    "dataQuality": "excellent"
  }
}
```

### GET `/api/sensor/stream`

Real-time data stream using Server-Sent Events.

**Query Parameters:**

- `interval`: Update interval in milliseconds (default: 5000)

**Usage:**

```javascript
const eventSource = new EventSource("/api/sensor/stream?interval=3000");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Real-time update:", data);
};
```

### GET `/api/sensor/analysis`

Returns comprehensive data analysis including trends, hourly averages, and detailed statistics.

**Response:**

```json
{
  "success": true,
  "message": "Comprehensive data analysis retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "analysis": {
    "statistics": {
      /* Full statistics object */
    },
    "trends": {
      "dataPoints": 100,
      "timeRange": {
        "start": "2024-01-15T08:00:00.000Z",
        "end": "2024-01-15T10:30:00.000Z"
      },
      "latestReadings": [
        /* Last 10 readings */
      ]
    },
    "hourlyAnalysis": {
      "totalHours": 3,
      "hourlyData": [
        /* Hourly averages */
      ],
      "summary": {
        "mostActiveHour": {
          /* Hour with most data points */
        },
        "averageReadingsPerHour": 33
      }
    },
    "dataQuality": {
      "totalReadings": 200,
      "dataRetention": "Last 200 readings",
      "dataPointsRetained": 200,
      "coverage": "3 hours of data"
    }
  }
}
```

## 🧪 Testing

Visit `/test` to access the built-in testing environment:

- **Test Data Generation**: Create realistic sensor data
- **API Testing**: Test all endpoints individually
- **Data Stream Simulation**: Simulate real-time ESP32 data
- **Scenario Testing**: Test different environmental conditions

## 🎨 Dashboard Features

### Real-time Metrics

- Temperature and humidity monitoring
- Wind speed and power potential
- Solar power output and efficiency
- Battery level and system voltage
- Current draw and total power

### Calculated Values

- **Solar Efficiency**: Based on power output and light conditions
- **Wind Efficiency**: Based on wind speed and power potential
- **Total Efficiency**: Combined system efficiency
- **Energy Harvested**: Cumulative energy production
- **Cost Savings**: Estimated electricity cost savings
- **Carbon Offset**: Environmental impact reduction

### System Status

- Device online/offline status
- Connection quality assessment
- Battery health monitoring
- Data quality indicators
- System uptime tracking

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**

   - Connect your GitHub repository to [Vercel](https://vercel.com)
   - Vercel will automatically detect Next.js and build your project
   - Set environment variables in Vercel dashboard

3. **Environment Variables**
   Create a `.env.local` file or set in Vercel dashboard:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Manual Deployment

1. **Build the project**

   ```bash
   npm run build
   npm start
   ```

2. **Environment setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

### Supabase Setup

1. **Create Supabase project**

   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your project URL and anon key

2. **Run migrations**

   ```bash
   supabase migration new create_sensor_data_tables
   supabase db push
   ```

3. **Set up CI/CD**
   - Add GitHub secrets for automated deployments
   - See `.github/workflows/supabase-migrations.yml`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for custom configuration:

```env
# Development settings
NODE_ENV=development

# API configuration
API_RATE_LIMIT=100
MAX_DATA_POINTS=200

# Device settings
DEFAULT_DEVICE_ID=ESP32_001
OFFLINE_THRESHOLD=300000
```

### Data Retention

- **Default**: Last 200 data points for exhaustive analysis
- **Cleanup**: Automatic cleanup every hour
- **Retention**: 24 hours of historical data
- **Configurable**: Adjustable via environment variables
- **Analysis**: Comprehensive statistics including min/max values, trends, and hourly averages

## 📈 Performance

- **Data Processing**: < 10ms per sensor reading
- **Real-time Updates**: 5-second intervals (configurable)
- **Memory Usage**: Efficient in-memory storage with automatic cleanup
- **Scalability**: Designed for single-device monitoring, easily extensible

## 🔒 Security Features

- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error handling and logging
- **Rate Limiting**: Configurable API rate limiting
- **Data Sanitization**: Automatic data cleaning and normalization

## 🐛 Troubleshooting

### Common Issues

1. **ESP32 Connection Failed**

   - Check WiFi credentials
   - Verify server IP address
   - Ensure network connectivity

2. **Dashboard Not Updating**

   - Check browser console for errors
   - Verify EventSource connection
   - Check API endpoint responses

3. **Data Validation Errors**
   - Review ESP32 data format
   - Check sensor readings for reasonable values
   - Verify JSON payload structure

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)

## 📞 Support

For questions, issues, or contributions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Energy Harvesting! 🌞💨⚡**
