import {
  ESP32SensorData,
  ProcessedSensorData,
  DeviceStatus,
} from "../types/sensor";
import { supabase } from "./supabase";
import { mockAIService } from "./mockAIService";

// Supabase row interfaces
interface SensorDataRow {
  id: string;
  device_id: string;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  bus_voltage: number | null;
  current: number | null;
  power: number | null;
  light_value: number | null;
  light_status: string | null;
  wind_count: number | null;
  hr: number | null;
  battery_level: number | null;
  solar_efficiency: number | null;
  wind_efficiency: number | null;
  total_efficiency: number | null;
  energy_harvested: number | null;
  cost_savings: number | null;
  carbon_offset: number | null;
  is_online: boolean | null;
  connection_quality: string | null;
  ai_prediction?: string | null;
  prediction_accuracy?: number | null;
  efficiency_vs_prediction?: number | null;
}

class SensorDataService {
  private sensorData: ProcessedSensorData[] = [];
  private deviceStatus: Map<string, DeviceStatus> = new Map();
  private maxDataPoints = 200; // Keep last 200 data points for exhaustive data
  private readonly DEVICE_ID = "ESP32_001"; // Default device ID
  private dataListeners: Array<(data: ProcessedSensorData) => void> = [];

  /**
   * Clear all stored data (useful for production reset)
   */
  clearAllData(): void {
    this.sensorData = [];
    this.deviceStatus.clear();
    console.log("🧹 Cleared all sensor data - ready for real ESP32 data");
  }

  constructor() {
    // Initialize device status
    this.deviceStatus.set(this.DEVICE_ID, {
      deviceId: this.DEVICE_ID,
      isOnline: false,
      lastSeen: new Date().toISOString(),
      batteryLevel: 0,
      connectionQuality: "poor",
    });

    // Load initial data from Supabase (disabled for now to prevent continuous running)
    // this.loadInitialData();
  }

  /**
   * Load initial data from Supabase
   */
  private async loadInitialData(): Promise<void> {
    if (!supabase) {
      console.warn("Supabase client not available, skipping initial data load");
      return;
    }

    try {
      // Load recent sensor data
      const { data: sensorData, error: sensorError } = await supabase
        .from("sensor_data")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(this.maxDataPoints);

      if (sensorError) {
        console.error("Error loading sensor data from Supabase:", sensorError);
      } else if (sensorData) {
        // Convert and store the data
        const processedData = sensorData
          .map((row) => this.convertSupabaseToProcessedData(row))
          .reverse(); // Reverse to maintain chronological order

        this.sensorData = processedData;
        console.log(
          `📊 Loaded ${processedData.length} sensor data points from Supabase`
        );
      }

      // Load device status
      const { data: deviceData, error: deviceError } = await supabase
        .from("device_status")
        .select("*")
        .eq("device_id", this.DEVICE_ID)
        .single();

      if (deviceError) {
        console.error(
          "Error loading device status from Supabase:",
          deviceError
        );
      } else if (deviceData) {
        const status: DeviceStatus = {
          deviceId: deviceData.device_id,
          isOnline: deviceData.is_online || false,
          lastSeen: deviceData.last_seen || new Date().toISOString(),
          batteryLevel: deviceData.battery_level || 0,
          connectionQuality:
            (deviceData.connection_quality as
              | "excellent"
              | "good"
              | "fair"
              | "poor") || "good",
        };
        this.deviceStatus.set(this.DEVICE_ID, status);
        console.log("📱 Loaded device status from Supabase");
      }
    } catch (error: unknown) {
      console.error("Error loading initial data from Supabase:", error);
    }
  }

  /**
   * Convert Supabase row to ProcessedSensorData
   */
  private convertSupabaseToProcessedData(
    row: SensorDataRow
  ): ProcessedSensorData {
    return {
      id: row.id,
      timestamp: row.timestamp,
      deviceId: row.device_id,
      temperature: row.temperature || 0,
      humidity: row.humidity || 0,
      busVoltage: row.bus_voltage || 0,
      current: row.current || 0,
      power: row.power || 0,
      lightValue: row.light_value || 0,
      lightStatus: row.light_status || "Unknown",
      windCount: row.wind_count || 0,
      hour: row.hr || 0,
      batteryLevel: row.battery_level || 0,
      solarEfficiency: row.solar_efficiency || 0,
      windEfficiency: row.wind_efficiency || 0,
      totalEfficiency: row.total_efficiency || 0,
      energyHarvested: row.energy_harvested || 0,
      costSavings: row.cost_savings || 0,
      carbonOffset: row.carbon_offset || 0,
      isOnline: row.is_online || false,
      connectionQuality:
        (row.connection_quality as "excellent" | "good" | "fair" | "poor") ||
        "good",
      aiPrediction: row.ai_prediction
        ? JSON.parse(row.ai_prediction)
        : undefined,
      predictionAccuracy: row.prediction_accuracy || undefined,
      efficiencyVsPrediction: row.efficiency_vs_prediction || undefined,
    };
  }

  /**
   * Convert ProcessedSensorData to Supabase row
   */
  private convertToSupabaseRow(
    data: ProcessedSensorData
  ): Partial<SensorDataRow> {
    return {
      device_id: data.deviceId,
      timestamp: data.timestamp,
      temperature: data.temperature,
      humidity: data.humidity,
      bus_voltage: data.busVoltage,
      current: data.current,
      power: data.power,
      light_value: data.lightValue,
      light_status: data.lightStatus,
      wind_count: data.windCount,
      hr: data.hour,
      battery_level: data.batteryLevel,
      solar_efficiency: data.solarEfficiency,
      wind_efficiency: data.windEfficiency,
      total_efficiency: data.totalEfficiency,
      energy_harvested: data.energyHarvested,
      cost_savings: data.costSavings,
      carbon_offset: data.carbonOffset,
      is_online: data.isOnline,
      connection_quality: data.connectionQuality || "good",
      ai_prediction: data.aiPrediction
        ? JSON.stringify(data.aiPrediction)
        : undefined,
      prediction_accuracy: data.predictionAccuracy || undefined,
      efficiency_vs_prediction: data.efficiencyVsPrediction || undefined,
    };
  }

  /**
   * Save sensor data to Supabase
   */
  private async saveToSupabase(data: ProcessedSensorData): Promise<void> {
    if (!supabase) {
      console.warn("Supabase client not available, skipping save");
      return;
    }

    try {
      const supabaseRow = this.convertToSupabaseRow(data);

      const { error } = await supabase.from("sensor_data").insert(supabaseRow);

      if (error) {
        console.error("Error saving to Supabase:", error);
      } else {
        // console.log("💾 Saved sensor data to Supabase");
      }
    } catch (error: unknown) {
      console.error("Error saving to Supabase:", error);
    }
  }

  /**
   * Update device status in Supabase
   */
  private async updateDeviceStatusInSupabase(
    status: DeviceStatus
  ): Promise<void> {
    if (!supabase) {
      console.warn("Supabase client not available, skipping status update");
      return;
    }

    try {
      const { error } = await supabase.from("device_status").upsert(
        {
          device_id: status.deviceId,
          is_online: status.isOnline,
          last_seen: status.lastSeen,
          battery_level: status.batteryLevel,
          connection_quality: status.connectionQuality,
        },
        {
          onConflict: "device_id",
        }
      );

      if (error) {
        console.error("Error updating device status in Supabase:", error);
      } else {
        console.log("📱 Updated device status in Supabase");
      }
    } catch (error: unknown) {
      console.error("Error updating device status in Supabase:", error);
    }
  }

  /**
   * Add a listener for new sensor data
   */
  addDataListener(listener: (data: ProcessedSensorData) => void): () => void {
    this.dataListeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.dataListeners.indexOf(listener);
      if (index > -1) {
        this.dataListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of new data
   */
  private notifyListeners(data: ProcessedSensorData): void {
    this.dataListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error: unknown) {
        console.error("Error in data listener:", error);
      }
    });
  }

  /**
   * Process incoming sensor data and calculate derived metrics
   */
  async processSensorData(
    rawData: ESP32SensorData
  ): Promise<ProcessedSensorData> {
    try {
      // Generate mock AI prediction
      const aiPrediction = await mockAIService.getPredictionFromSensor({
        id: "",
        timestamp: new Date().toISOString(),
        deviceId: "ESP32_001",
        temperature: rawData.temperature,
        humidity: rawData.humidity,
        busVoltage: rawData.bus_voltage,
        current: rawData.current,
        power: rawData.power,
        lightValue: rawData.light_value,
        lightStatus: rawData.light_status,
        windCount: rawData.wind_count,
        hour: rawData.hr,
        batteryLevel: 0, // Will be calculated below
        solarEfficiency: 0, // Will be calculated below
        windEfficiency: 0, // Will be calculated below
        totalEfficiency: 0, // Will be calculated below
        energyHarvested: 0, // Will be calculated below
        costSavings: 0, // Will be calculated below
        carbonOffset: 0, // Will be calculated below
        isOnline: true,
        connectionQuality: "excellent",
      });

      // Calculate derived metrics
      const batteryLevel = this.calculateBatteryLevel(rawData.bus_voltage);
      const solarEfficiency = this.calculateSolarEfficiency(
        rawData.power,
        rawData.light_status
      );
      const windEfficiency = this.calculateWindEfficiency(rawData.wind_count);
      const totalEfficiency = Math.round(
        (solarEfficiency + windEfficiency) / 2
      );

      // Calculate energy harvested (kWh per second)
      const energyHarvested = (rawData.power / 1000) * (1 / 3600);

      // Calculate cost savings (assuming $0.12 per kWh)
      const costSavings = energyHarvested * 0.12;

      // Calculate carbon offset (assuming 0.92 kg CO2 per kWh)
      const carbonOffset = energyHarvested * 0.92;

      // Calculate AI prediction accuracy and efficiency comparison
      let predictionAccuracy: number | undefined;
      let efficiencyVsPrediction: number | undefined;

      if (aiPrediction) {
        predictionAccuracy = mockAIService.calculatePredictionAccuracy(
          rawData.power,
          aiPrediction.predicted_power
        );
        efficiencyVsPrediction = mockAIService.calculateEfficiencyVsPrediction(
          totalEfficiency,
          aiPrediction.predicted_power,
          rawData.power
        );
      }

      const processedData: ProcessedSensorData = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        deviceId: "ESP32_001",
        temperature: rawData.temperature,
        humidity: rawData.humidity,
        busVoltage: rawData.bus_voltage,
        current: rawData.current,
        power: rawData.power,
        lightValue: rawData.light_value,
        lightStatus: rawData.light_status,
        windCount: rawData.wind_count,
        hour: rawData.hr,
        batteryLevel,
        solarEfficiency,
        windEfficiency,
        totalEfficiency,
        energyHarvested,
        costSavings,
        carbonOffset,
        isOnline: true,
        connectionQuality: this.assessConnectionQuality(rawData),
        aiPrediction: aiPrediction || undefined,
        predictionAccuracy,
        efficiencyVsPrediction,
      };

      // Store the processed data
      this.storeSensorData(processedData);

      // Update device status
      await this.updateDeviceStatus(processedData);

      // Save to Supabase if available
      if (supabase) {
        await this.saveToSupabase(processedData);
      }

      // Notify listeners for real-time updates
      this.notifyListeners(processedData);

      console.log(
        `📊 Processed sensor data: ${rawData.power}mW, ${totalEfficiency}% efficiency`
      );
      if (aiPrediction) {
        console.log(
          `🤖 Mock AI Prediction: ${predictionAccuracy?.toFixed(1)}% accurate`
        );
      }

      return processedData;
    } catch (error: unknown) {
      console.error("Error processing sensor data:", error);
      throw error;
    }
  }

  /**
   * Store sensor data in memory with limit
   */
  private storeSensorData(data: ProcessedSensorData): void {
    this.sensorData.unshift(data);

    // Keep only the last maxDataPoints
    if (this.sensorData.length > this.maxDataPoints) {
      this.sensorData = this.sensorData.slice(0, this.maxDataPoints);
    }
  }

  /**
   * Update device status
   */
  private updateDeviceStatus(data: ProcessedSensorData): void {
    const status: DeviceStatus = {
      deviceId: data.deviceId,
      isOnline: data.isOnline,
      lastSeen: data.timestamp,
      batteryLevel: data.batteryLevel,
      connectionQuality: data.connectionQuality,
    };

    this.deviceStatus.set(data.deviceId, status);

    // Update in Supabase
    this.updateDeviceStatusInSupabase(status);
  }

  /**
   * Calculate battery level based on voltage
   */
  private calculateBatteryLevel(voltage: number): number {
    if (voltage >= 4.2) return 100;
    if (voltage >= 3.7) return Math.round(((voltage - 3.7) / 0.5) * 100);
    if (voltage >= 3.0) return Math.round(((voltage - 3.0) / 0.7) * 100);
    return 0;
  }

  /**
   * Calculate solar efficiency
   */
  private calculateSolarEfficiency(power: number, lightStatus: string): number {
    // Simple calculation based on power output
    if (power > 0 && (lightStatus === "bright" || lightStatus === "good")) {
      return Math.min(25, (power / 1000) * 100); // Normalize to percentage, max 25%
    }
    return 0;
  }

  /**
   * Calculate wind efficiency
   */
  private calculateWindEfficiency(windSpeed: number): number {
    // Simple calculation based on potential wind power and wind speed
    if (windSpeed > 0) {
      return Math.min(
        100,
        (windSpeed / 10) * 100 // Normalize to percentage
      );
    }
    return 0;
  }

  /**
   * Calculate total efficiency
   */
  private calculateTotalEfficiency(
    solarEfficiency: number,
    windEfficiency: number
  ): number {
    return Math.round((solarEfficiency + windEfficiency) / 2);
  }

  /**
   * Calculate energy harvested
   */
  private calculateEnergyHarvested(power: number): number {
    // Convert power (mW) to energy (kWh) over time
    const powerInWatts = power / 1000;
    const timeInHours = 1; // Assuming 1 hour intervals
    return (powerInWatts * timeInHours) / 1000; // Convert to kWh
  }

  /**
   * Calculate cost savings
   */
  private calculateCostSavings(energyHarvested: number): number {
    // Assume $0.12 per kWh
    const electricityRate = 0.12;
    return energyHarvested * electricityRate;
  }

  /**
   * Calculate carbon offset
   */
  private calculateCarbonOffset(energyHarvested: number): number {
    // Assume 0.92 kg CO2 per kWh saved
    const carbonFactor = 0.92;
    return energyHarvested * carbonFactor;
  }

  /**
   * Assess connection quality
   */
  private assessConnectionQuality(
    data: ESP32SensorData
  ): "excellent" | "good" | "fair" | "poor" {
    if (data.power > 1000) return "excellent";
    if (data.power > 500) return "good";
    if (data.power > 100) return "fair";
    return "poor";
  }

  /**
   * Generate a unique ID for new data
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get all sensor data
   */
  getAllSensorData(): ProcessedSensorData[] {
    return [...this.sensorData];
  }

  /**
   * Get latest sensor data
   */
  getLatestSensorData(limit: number = 1): ProcessedSensorData[] {
    return this.sensorData.slice(0, limit);
  }

  /**
   * Get sensor data by time range
   */
  getSensorDataByTimeRange(
    startTime: Date,
    endTime: Date
  ): ProcessedSensorData[] {
    return this.sensorData.filter((data) => {
      const timestamp = new Date(data.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  /**
   * Get device status
   */
  getDeviceStatus(): DeviceStatus[] {
    return Array.from(this.deviceStatus.values());
  }

  /**
   * Get data statistics
   */
  getDataStatistics(): {
    totalReadings: number;
    avgTemperature: number;
    avgPower: number;
    avgEfficiency: number;
  } {
    if (this.sensorData.length === 0) {
      return {
        totalReadings: 0,
        avgTemperature: 0,
        avgPower: 0,
        avgEfficiency: 0,
      };
    }

    const temperatures = this.sensorData
      .map((d) => d.temperature)
      .filter((t) => t !== null);
    const powers = this.sensorData
      .map((d) => d.power)
      .filter((p) => p !== null);
    const efficiencies = this.sensorData
      .map((d) => d.totalEfficiency)
      .filter((e) => e !== null);

    return {
      totalReadings: this.sensorData.length,
      avgTemperature:
        temperatures.length > 0
          ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length
          : 0,
      avgPower:
        powers.length > 0
          ? powers.reduce((a, b) => a + b, 0) / powers.length
          : 0,
      avgEfficiency:
        efficiencies.length > 0
          ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
          : 0,
    };
  }

  /**
   * Get trend data
   */
  getTrendData(): {
    trend: "increasing" | "decreasing";
    change: number;
    recentAverage: number;
    olderAverage: number;
  } | null {
    if (this.sensorData.length < 2) return null;

    const recent = this.sensorData.slice(0, 10);
    const older = this.sensorData.slice(-10);

    const recentAvg =
      recent.reduce((sum, d) => sum + d.totalEfficiency, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, d) => sum + d.totalEfficiency, 0) / older.length;

    return {
      trend: recentAvg > olderAvg ? "increasing" : "decreasing",
      change: Math.abs(recentAvg - olderAvg),
      recentAverage: recentAvg,
      olderAverage: olderAvg,
    };
  }

  /**
   * Get hourly averages
   */
  getHourlyAverages(): {
    totalReadings: number;
    avgTemperature: number;
    avgPower: number;
    avgEfficiency: number;
  } {
    // This would be better implemented with a direct Supabase query
    // For now, return basic stats
    return this.getDataStatistics();
  }

  /**
   * Check if there's new data since timestamp
   */
  hasNewDataSince(timestamp: string): boolean {
    if (this.sensorData.length === 0) return false;
    return new Date(this.sensorData[0].timestamp) > new Date(timestamp);
  }

  /**
   * Get last data timestamp
   */
  getLastDataTimestamp(): string | null {
    return this.sensorData.length > 0 ? this.sensorData[0].timestamp : null;
  }

  /**
   * Cleanup old data
   */
  cleanupOldData(): void {
    // This is now handled by Supabase and the maxDataPoints limit
    console.log("🧹 Data cleanup handled by Supabase and memory limits");
  }

  /**
   * Check device status
   */
  checkDeviceStatus(): void {
    // This is now handled by Supabase
    console.log("📱 Device status monitoring handled by Supabase");
  }
}

export const sensorService = new SensorDataService();
