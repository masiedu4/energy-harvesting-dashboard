import { ProcessedSensorData, DeviceStatus } from "@/types/sensor";
import { supabase, SensorDataRow, DeviceStatusRow } from "./supabase";

class SensorDataService {
  private sensorData: ProcessedSensorData[] = [];
  private deviceStatus: Map<string, DeviceStatus> = new Map();
  private maxDataPoints = 200; // Keep last 200 data points for exhaustive data
  private readonly DEVICE_ID = "ESP32_001"; // Default device ID
  private dataListeners: Array<(data: ProcessedSensorData) => void> = [];

  constructor() {
    // Initialize device status
    this.deviceStatus.set(this.DEVICE_ID, {
      deviceId: this.DEVICE_ID,
      isOnline: false,
      lastSeen: new Date().toISOString(),
      batteryLevel: 0,
      connectionQuality: "poor",
    });

    // Load initial data from Supabase
    this.loadInitialData();
  }

  /**
   * Load initial data from Supabase
   */
  private async loadInitialData() {
    try {
      // Load recent sensor data
      const { data: sensorData, error: sensorError } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("device_id", this.DEVICE_ID)
        .order("timestamp", { ascending: false })
        .limit(this.maxDataPoints);

      if (sensorError) {
        console.error("Error loading sensor data from Supabase:", sensorError);
      } else if (sensorData) {
        // Convert Supabase data to ProcessedSensorData
        this.sensorData = sensorData.map(this.convertSupabaseToProcessedData);
        console.log(
          `📊 Loaded ${this.sensorData.length} sensor readings from Supabase`
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
          isOnline: deviceData.is_online,
          lastSeen: deviceData.last_seen,
          batteryLevel: deviceData.battery_level,
          connectionQuality: deviceData.connection_quality as
            | "excellent"
            | "good"
            | "fair"
            | "poor",
        };
        this.deviceStatus.set(this.DEVICE_ID, status);
        console.log("📱 Loaded device status from Supabase");
      }
    } catch (error) {
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
      deviceId: row.device_id,
      timestamp: row.timestamp,
      temperature: row.temperature || 0,
      humidity: row.humidity || 0,
      lightStatus: row.light_status || "Unknown",
      windSpeed: row.wind_speed || 0,
      potentialWindPower: row.potential_wind_power || 0,
      busVoltage: row.bus_voltage || 0,
      current: row.current || 0,
      power: row.power || 0,
      batteryLevel: row.battery_level || 0,
      solarEfficiency: row.solar_efficiency || 0,
      windEfficiency: row.wind_efficiency || 0,
      totalEfficiency: row.total_efficiency || 0,
      energyHarvested: row.energy_harvested || 0,
      costSavings: row.cost_savings || 0,
      carbonOffset: row.carbon_offset || 0,
      isOnline: row.is_online || false,
      lastSeen: row.timestamp,
      connectionQuality:
        (row.connection_quality as "excellent" | "good" | "fair" | "poor") ||
        "good",
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
      light_status: data.lightStatus,
      wind_speed: data.windSpeed,
      potential_wind_power: data.potentialWindPower,
      bus_voltage: data.busVoltage,
      current: data.current,
      power: data.power,
      battery_level: data.batteryLevel,
      solar_efficiency: data.solarEfficiency,
      wind_efficiency: data.windEfficiency,
      total_efficiency: data.totalEfficiency,
      energy_harvested: data.energyHarvested,
      cost_savings: data.costSavings,
      carbon_offset: data.carbonOffset,
      is_online: data.isOnline,
      connection_quality: data.connectionQuality || "good",
    };
  }

  /**
   * Save sensor data to Supabase
   */
  private async saveToSupabase(data: ProcessedSensorData): Promise<void> {
    try {
      const supabaseRow = this.convertToSupabaseRow(data);

      const { error } = await supabase.from("sensor_data").insert(supabaseRow);

      if (error) {
        console.error("Error saving to Supabase:", error);
      } else {
        console.log("💾 Saved sensor data to Supabase");
      }
    } catch (error) {
      console.error("Error saving to Supabase:", error);
    }
  }

  /**
   * Update device status in Supabase
   */
  private async updateDeviceStatusInSupabase(
    status: DeviceStatus
  ): Promise<void> {
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
    } catch (error) {
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
      } catch (error) {
        console.error("Error in data listener:", error);
      }
    });
  }

  /**
   * Process incoming sensor data from ESP32
   */
  processSensorData(esp32Data: {
    temperature?: number;
    humidity?: number;
    lightStatus?: string;
    windSpeed?: number;
    potentialWindPower?: number;
    busVoltage?: number;
    current?: number;
    power?: number;
  }): ProcessedSensorData {
    const processedData: ProcessedSensorData = {
      id: crypto.randomUUID(),
      deviceId: this.DEVICE_ID,
      timestamp: new Date().toISOString(),
      temperature: esp32Data.temperature || 0,
      humidity: esp32Data.humidity || 0,
      lightStatus: esp32Data.lightStatus || "Unknown",
      windSpeed: esp32Data.windSpeed || 0,
      potentialWindPower: esp32Data.potentialWindPower || 0,
      busVoltage: esp32Data.busVoltage || 0,
      current: esp32Data.current || 0,
      power: esp32Data.power || 0,
      batteryLevel: this.calculateBatteryLevel(esp32Data.busVoltage || 0),
      solarEfficiency: this.calculateSolarEfficiency(esp32Data),
      windEfficiency: this.calculateWindEfficiency(esp32Data),
      totalEfficiency: 0, // Will be calculated below
      energyHarvested: 0, // Will be calculated below
      costSavings: 0, // Will be calculated below
      carbonOffset: 0, // Will be calculated below
      isOnline: true,
      lastSeen: new Date().toISOString(),
      connectionQuality: "good",
    };

    // Calculate derived metrics
    processedData.totalEfficiency =
      this.calculateTotalEfficiency(processedData);
    processedData.energyHarvested =
      this.calculateEnergyHarvested(processedData);
    processedData.costSavings = this.calculateCostSavings(processedData);
    processedData.carbonOffset = this.calculateCarbonOffset(processedData);

    // Store in memory
    this.storeSensorData(processedData);

    // Update device status
    this.updateDeviceStatus(processedData);

    // Save to Supabase
    this.saveToSupabase(processedData);
    this.updateDeviceStatusInSupabase(this.deviceStatus.get(this.DEVICE_ID)!);

    // Notify listeners
    this.notifyListeners(processedData);

    return processedData;
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
      lastSeen: data.lastSeen,
      batteryLevel: data.batteryLevel,
      connectionQuality: this.assessConnectionQuality(data),
    };

    this.deviceStatus.set(data.deviceId, status);
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
  private calculateSolarEfficiency(data: {
    lightStatus?: string;
    power?: number;
  }): number {
    // Simple calculation based on light status and power
    if (data.lightStatus && data.lightStatus.includes("Light available")) {
      return Math.min(100, ((data.power || 0) / 1000) * 100); // Normalize to percentage
    }
    return 0;
  }

  /**
   * Calculate wind efficiency
   */
  private calculateWindEfficiency(data: { windSpeed?: number }): number {
    // Simple calculation based on wind speed
    if (data.windSpeed && data.windSpeed > 0) {
      return Math.min(100, (data.windSpeed / 20) * 100); // Normalize to percentage
    }
    return 0;
  }

  /**
   * Calculate total efficiency
   */
  private calculateTotalEfficiency(data: ProcessedSensorData): number {
    return Math.round((data.solarEfficiency + data.windEfficiency) / 2);
  }

  /**
   * Calculate energy harvested
   */
  private calculateEnergyHarvested(data: ProcessedSensorData): number {
    // Convert power (mW) to energy (kWh) over time
    const powerInWatts = data.power / 1000;
    const timeInHours = 1; // Assuming 1 hour intervals
    return (powerInWatts * timeInHours) / 1000; // Convert to kWh
  }

  /**
   * Calculate cost savings
   */
  private calculateCostSavings(data: ProcessedSensorData): number {
    // Assume $0.12 per kWh
    const electricityRate = 0.12;
    return data.energyHarvested * electricityRate;
  }

  /**
   * Calculate carbon offset
   */
  private calculateCarbonOffset(data: ProcessedSensorData): number {
    // Assume 0.92 kg CO2 per kWh saved
    const carbonFactor = 0.92;
    return data.energyHarvested * carbonFactor;
  }

  /**
   * Assess connection quality
   */
  private assessConnectionQuality(
    data: ProcessedSensorData
  ): "excellent" | "good" | "fair" | "poor" {
    if (data.power > 1000) return "excellent";
    if (data.power > 500) return "good";
    if (data.power > 100) return "fair";
    return "poor";
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
