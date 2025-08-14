import { AIPrediction, AIDayForecast, ESP32SensorData } from "../types/sensor";

// Configuration for the solar-predictor service
const SOLAR_PREDICTOR_URL =
  process.env.NEXT_PUBLIC_SOLAR_PREDICTOR_URL || "http://localhost:8000";

export class AIService {
  private static instance: AIService;
  private cache: Map<string, { data: AIPrediction; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Get AI prediction for current sensor data
   */
  async getPredictionFromSensor(
    sensorData: ESP32SensorData
  ): Promise<AIPrediction | null> {
    try {
      // Calculate irradiance from light status (approximate)
      const irradiance = this.estimateIrradiance(sensorData.lightStatus);

      // Get current hour
      const now = new Date();
      const currentHour = now.getHours();

      const response = await fetch(`${SOLAR_PREDICTOR_URL}/predict/sensor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: sensorData.temperature,
          irradiance: irradiance,
          humidity: sensorData.humidity,
          hr: currentHour,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const prediction: AIPrediction = await response.json();

      // Cache the prediction
      const cacheKey = `${sensorData.temperature}-${irradiance}-${sensorData.humidity}-${currentHour}`;
      this.cache.set(cacheKey, { data: prediction, timestamp: Date.now() });

      return prediction;
    } catch (error: unknown) {
      console.error("Failed to get AI prediction:", error);
      return null;
    }
  }

  /**
   * Get current hour prediction from weather data
   */
  async getCurrentHourPrediction(): Promise<AIPrediction | null> {
    try {
      const response = await fetch(`${SOLAR_PREDICTOR_URL}/predict/current`);

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("Failed to get current hour prediction:", error);
      return null;
    }
  }

  /**
   * Get full day forecast
   */
  async getDayForecast(): Promise<AIDayForecast | null> {
    try {
      const response = await fetch(`${SOLAR_PREDICTOR_URL}/predict/day`);

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("Failed to get day forecast:", error);
      return null;
    }
  }

  /**
   * Get prediction for specific hour
   */
  async getHourPrediction(hour: number): Promise<AIPrediction | null> {
    try {
      const response = await fetch(
        `${SOLAR_PREDICTOR_URL}/predict/hour?hour=${hour}`
      );

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      console.error(`Failed to get prediction for hour ${hour}:`, error);
      return null;
    }
  }

  /**
   * Estimate irradiance from light status
   */
  private estimateIrradiance(lightStatus: string): number {
    const lightMap: Record<string, number> = {
      bright: 800, // Full sun
      good: 600, // Partly cloudy
      moderate: 400, // Cloudy
      low: 200, // Overcast
      dark: 50, // Dusk/dawn
      night: 0, // Night
    };

    return lightMap[lightStatus.toLowerCase()] || 400;
  }

  /**
   * Calculate prediction accuracy based on actual vs predicted
   */
  calculatePredictionAccuracy(
    actualPower: number,
    predictedPower: number
  ): number {
    if (predictedPower === 0) return actualPower === 0 ? 100 : 0;

    const error = Math.abs(actualPower - predictedPower) / predictedPower;
    return Math.max(0, 100 - error * 100);
  }

  /**
   * Compare actual efficiency with predicted
   */
  calculateEfficiencyVsPrediction(
    actualEfficiency: number,
    predictedPower: number,
    actualPower: number
  ): number {
    if (predictedPower === 0) return 0;

    const predictedEfficiency = (actualPower / predictedPower) * 100;
    return actualEfficiency - predictedEfficiency;
  }

  /**
   * Get cached prediction if available and fresh
   */
  getCachedPrediction(key: string): AIPrediction | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

export const aiService = AIService.getInstance();
