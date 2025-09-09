import {
  AIPrediction,
  AIDayForecast,
  ProcessedSensorData,
} from "../types/sensor";

/**
 * Mock AI Service
 * Generates realistic AI predictions based on historical sensor data patterns
 * Simulates what a real ML model would predict
 */

export class MockAIService {
  private static instance: MockAIService;
  private historicalData: ProcessedSensorData[] = [];
  private predictionCache: Map<
    string,
    { data: AIPrediction; timestamp: number }
  > = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): MockAIService {
    if (!MockAIService.instance) {
      MockAIService.instance = new MockAIService();
    }
    return MockAIService.instance;
  }

  /**
   * Update historical data for pattern analysis
   */
  updateHistoricalData(data: ProcessedSensorData[]) {
    this.historicalData = data;
  }

  /**
   * Generate AI prediction based on current sensor data
   */
  async getPredictionFromSensor(
    sensorData: ProcessedSensorData
  ): Promise<AIPrediction | null> {
    try {
      const hour = new Date().getHours();

      // Skip predictions for night time
      if (hour >= 18 || hour < 6) {
        return this.generateNightPrediction(sensorData);
      }

      // Generate prediction based on current conditions and historical patterns
      const prediction = this.generatePrediction(sensorData, hour);

      // Cache the prediction
      const cacheKey = `current_${hour}`;
      this.predictionCache.set(cacheKey, {
        data: prediction,
        timestamp: Date.now(),
      });

      return prediction;
    } catch (error) {
      console.error("Error generating mock AI prediction:", error);
      return null;
    }
  }

  /**
   * Get current hour prediction
   */
  async getCurrentHourPrediction(): Promise<AIPrediction | null> {
    const hour = new Date().getHours();
    const cacheKey = `current_${hour}`;

    // Check cache first
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Generate new prediction based on current data
    if (this.historicalData.length > 0) {
      const latestData = this.historicalData[this.historicalData.length - 1];
      return await this.getPredictionFromSensor(latestData);
    }

    return null;
  }

  /**
   * Get 24-hour forecast
   */
  async getDayForecast(): Promise<AIDayForecast | null> {
    try {
      const forecast: AIPrediction[] = [];
      const currentHour = new Date().getHours();

      // Generate predictions for next 24 hours
      for (let i = 0; i < 24; i++) {
        const targetHour = (currentHour + i) % 24;
        const mockSensorData = this.generateMockSensorDataForHour(targetHour);
        const prediction = this.generatePrediction(mockSensorData, targetHour);
        forecast.push(prediction);
      }

      return {
        source: "mock-ai-forecast",
        forecast,
      };
    } catch (error) {
      console.error("Error generating day forecast:", error);
      return null;
    }
  }

  /**
   * Get prediction for specific hour
   */
  async getHourPrediction(hour: number): Promise<AIPrediction | null> {
    try {
      const mockSensorData = this.generateMockSensorDataForHour(hour);
      return this.generatePrediction(mockSensorData, hour);
    } catch (error) {
      console.error("Error generating hour prediction:", error);
      return null;
    }
  }

  /**
   * Generate prediction based on sensor data and hour
   */
  private generatePrediction(
    sensorData: ProcessedSensorData,
    hour: number
  ): AIPrediction {
    // Calculate irradiance from light status
    const irradiance = this.estimateIrradiance(sensorData.lightStatus);

    // Base power calculation using physics-based model
    const basePower = this.calculateBasePower(irradiance, hour);

    // Apply environmental factors
    const tempEffect = this.calculateTemperatureEffect(sensorData.temperature);
    const humidityEffect = this.calculateHumidityEffect(sensorData.humidity);
    const windEffect = this.calculateWindEffect(sensorData.windCount);

    // Apply historical pattern adjustments
    const historicalAdjustment = this.calculateHistoricalAdjustment(hour);

    // Calculate final predicted power
    let predictedPower =
      basePower *
      tempEffect *
      humidityEffect *
      windEffect *
      historicalAdjustment;

    // Add realistic variation (±15%)
    const variation = 0.85 + Math.random() * 0.3;
    predictedPower = Math.max(0, predictedPower * variation);

    return {
      source: "mock-ai-prediction",
      temperature: sensorData.temperature,
      irradiance: irradiance,
      humidity: sensorData.humidity,
      hr: hour,
      hr_sin: Math.sin((2 * Math.PI * hour) / 24),
      hr_cos: Math.cos((2 * Math.PI * hour) / 24),
      predicted_power: Math.round(predictedPower * 100) / 100,
    };
  }

  /**
   * Generate night prediction (no solar power)
   */
  private generateNightPrediction(
    sensorData: ProcessedSensorData
  ): AIPrediction {
    const hour = new Date().getHours();
    return {
      source: "mock-ai-night",
      temperature: sensorData.temperature,
      irradiance: 0,
      humidity: sensorData.humidity,
      hr: hour,
      hr_sin: Math.sin((2 * Math.PI * hour) / 24),
      hr_cos: Math.cos((2 * Math.PI * hour) / 24),
      predicted_power: 0,
    };
  }

  /**
   * Estimate irradiance from light status
   */
  private estimateIrradiance(lightStatus: string): number {
    const irradianceMap: Record<string, number> = {
      bright: 800 + Math.random() * 200, // 800-1000 W/m²
      good: 600 + Math.random() * 150, // 600-750 W/m²
      moderate: 400 + Math.random() * 100, // 400-500 W/m²
      low: 200 + Math.random() * 100, // 200-300 W/m²
      night: 0,
    };
    return irradianceMap[lightStatus] || 400;
  }

  /**
   * Calculate base power from irradiance and time
   */
  private calculateBasePower(irradiance: number, hour: number): number {
    // Panel efficiency and area (simulating a 20W panel)
    const panelEfficiency = 0.15;
    const panelArea = 0.13; // m²

    // Time-based efficiency (peak at solar noon)
    const solarNoon = 12;
    const timeEfficiency =
      Math.cos(((hour - solarNoon) * Math.PI) / 12) * 0.3 + 0.7;

    return irradiance * panelEfficiency * panelArea * timeEfficiency;
  }

  /**
   * Calculate temperature effect on power output
   */
  private calculateTemperatureEffect(temperature: number): number {
    // Temperature coefficient: -0.4% per °C above 25°C
    const tempCoeff = -0.004;
    const tempDiff = temperature - 25;
    return 1 + tempCoeff * tempDiff;
  }

  /**
   * Calculate humidity effect on power output
   */
  private calculateHumidityEffect(humidity: number): number {
    // High humidity slightly reduces efficiency
    return 1 - (humidity / 100) * 0.05;
  }

  /**
   * Calculate wind effect on power output
   */
  private calculateWindEffect(windSpeed: number): number {
    // Moderate wind can cool panels and improve efficiency
    if (windSpeed < 5) return 1.0;
    if (windSpeed < 15) return 1.02; // Slight improvement
    return 0.98; // High winds can reduce efficiency
  }

  /**
   * Calculate historical pattern adjustment
   */
  private calculateHistoricalAdjustment(hour: number): number {
    if (this.historicalData.length === 0) return 1.0;

    // Find data points from similar hours in the past
    const similarHourData = this.historicalData.filter((data) => {
      const dataHour = new Date(data.timestamp).getHours();
      return Math.abs(dataHour - hour) <= 1; // Within 1 hour
    });

    if (similarHourData.length === 0) return 1.0;

    // Calculate average efficiency for this hour
    const avgEfficiency =
      similarHourData.reduce((sum, data) => sum + data.totalEfficiency, 0) /
      similarHourData.length;
    const baselineEfficiency = 15; // Baseline 15% efficiency

    // Return adjustment factor
    return Math.max(0.7, Math.min(1.3, avgEfficiency / baselineEfficiency));
  }

  /**
   * Generate mock sensor data for a specific hour
   */
  private generateMockSensorDataForHour(hour: number): ProcessedSensorData {
    // Generate realistic data based on time of day
    let temperature = 20;
    let humidity = 60;
    let lightStatus = "night";
    let windSpeed = 5;
    let lightValue = 0;

    if (hour >= 6 && hour < 18) {
      // Daytime
      temperature = 20 + (hour - 6) * 0.8 + Math.random() * 5;
      humidity =
        50 + Math.sin(((hour - 6) * Math.PI) / 12) * 20 + Math.random() * 10;
      lightStatus = hour < 10 ? "bright" : hour < 14 ? "good" : "moderate";
      lightValue =
        hour < 10
          ? 3000 + Math.random() * 1000
          : hour < 14
          ? 2000 + Math.random() * 1000
          : 1000 + Math.random() * 1000;
      windSpeed = 3 + Math.random() * 8;
    } else {
      // Nighttime
      temperature = 15 + Math.random() * 5;
      humidity = 70 + Math.random() * 20;
      lightValue = Math.random() * 100; // Very low light at night
      windSpeed = 2 + Math.random() * 6;
    }

    return {
      id: `mock_${hour}`,
      timestamp: new Date().toISOString(),
      deviceId: "ESP32_001",
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      busVoltage: 5.0,
      current: 0,
      power: 0,
      lightValue: Math.round(lightValue * 10) / 10,
      lightStatus,
      windCount: Math.round(windSpeed * 10) / 10,
      hour: hour,
      batteryLevel: 85,
      solarEfficiency: 0,
      windEfficiency: 0,
      totalEfficiency: 0,
      energyHarvested: 0,
      costSavings: 0,
      carbonOffset: 0,
      isOnline: true,
      connectionQuality: "excellent",
    };
  }

  /**
   * Calculate prediction accuracy (mock)
   */
  calculatePredictionAccuracy(
    actualPower: number,
    predictedPower: number
  ): number {
    if (predictedPower === 0) return actualPower === 0 ? 100 : 0;

    const error = Math.abs(actualPower - predictedPower) / predictedPower;
    const accuracy = Math.max(0, 100 - error * 100);

    // Add some realistic variation to accuracy
    return Math.round(accuracy * 10) / 10;
  }

  /**
   * Calculate efficiency vs prediction
   */
  calculateEfficiencyVsPrediction(
    actualEfficiency: number,
    predictedPower: number,
    power: number
  ): number {
    if (predictedPower === 0) return 0;

    const predictedEfficiency = (predictedPower / 1000) * 100;
    return actualEfficiency - predictedEfficiency;
  }

  /**
   * Clear expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.predictionCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.predictionCache.delete(key);
      }
    }
  }
}

export const mockAIService = MockAIService.getInstance();
