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
  lightStatus: string;
  windSpeed: number;
  potentialWindPower: number;
  busVoltage: number;
  current: number;
  power: number;
}

export interface ProcessedSensorData extends SensorData {
  id: string;
  deviceId: string;
  batteryLevel: number;
  solarEfficiency: number;
  windEfficiency: number;
  totalEfficiency: number;
  energyHarvested: number;
  costSavings: number;
  carbonOffset: number;
  isOnline: boolean;
  lastSeen: string;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
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
