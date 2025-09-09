export interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  lightStatus: string;
  windSpeed: number;
  potentialWindPower: number;
  busVoltage: number;
  current: number;
  power: number;
}

export interface ESP32SensorData {
  temperature: number;
  humidity: number;
  bus_voltage: number;
  current: number;
  power: number;
  light_value: number;
  light_status: string;
  wind_count: number;
  hr: number;
}

export interface ProcessedSensorData {
  id: string;
  timestamp: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  busVoltage: number;
  current: number;
  power: number;
  lightValue: number;
  lightStatus: string;
  windCount: number;
  hour: number;
  // Legacy fields for backward compatibility
  irradiance?: number;
  ldrRaw?: number;
  avgWind?: number;
  batteryLevel: number;
  solarEfficiency: number;
  windEfficiency: number;
  totalEfficiency: number;
  energyHarvested: number;
  costSavings: number;
  carbonOffset: number;
  isOnline: boolean;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  // AI Prediction fields
  aiPrediction?: AIPrediction;
  predictionAccuracy?: number;
  efficiencyVsPrediction?: number;
}

export interface EnergyMetrics {
  solarEfficiency: number;
  windEfficiency: number;
  totalEfficiency: number;
  energyHarvested: number;
  costSavings: number;
  carbonOffset: number;
}

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  lightStatus: string;
  windSpeed: number;
}

export interface DeviceStatus {
  deviceId: string;
  isOnline: boolean;
  lastSeen: string;
  batteryLevel: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export interface DataStreamResponse {
  success: boolean;
  message: string;
  data: ProcessedSensorData[];
  totalCount: number;
  lastUpdate: string;
}

export interface StreamData {
  timestamp: string;
  sensorData: ProcessedSensorData;
  deviceStatus: DeviceStatus[];
  statistics: {
    totalReadings: number;
    avgTemperature: number;
    avgPower: number;
    avgEfficiency: number;
  } | null;
  message: string;
}

export interface AIPrediction {
  source: string;
  temperature: number;
  irradiance: number;
  humidity: number;
  hr: number;
  hr_sin: number;
  hr_cos: number;
  predicted_power: number;
}

export interface AIDayForecast {
  source: string;
  forecast: AIPrediction[];
}

export interface EnhancedSensorData extends ProcessedSensorData {
  aiPrediction?: AIPrediction;
  predictionAccuracy?: number;
  efficiencyVsPrediction?: number;
}
