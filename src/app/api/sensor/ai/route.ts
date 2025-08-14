import { NextRequest, NextResponse } from "next/server";
import { mockAIService } from "@/lib/mockAIService";
import { sensorService } from "@/lib/sensorService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const hour = searchParams.get("hour");

    // Update mock AI service with current historical data
    const currentData = await sensorService.getLatestSensorData(100);
    if (currentData && currentData.length > 0) {
      mockAIService.updateHistoricalData(currentData);
    }

    switch (type) {
      case "current":
        const currentPrediction =
          await mockAIService.getCurrentHourPrediction();
        if (currentPrediction) {
          return NextResponse.json(currentPrediction);
        }
        break;

      case "day":
        const dayForecast = await mockAIService.getDayForecast();
        if (dayForecast) {
          return NextResponse.json(dayForecast);
        }
        break;

      case "hour":
        if (hour) {
          const hourNum = parseInt(hour);
          if (hourNum >= 0 && hourNum <= 23) {
            const hourPrediction = await mockAIService.getHourPrediction(
              hourNum
            );
            if (hourPrediction) {
              return NextResponse.json(hourPrediction);
            }
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use 'current', 'day', or 'hour'" },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  } catch (error) {
    console.error("AI prediction GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { temperature, humidity, lightStatus } = body;

    // Validate required fields
    if (
      temperature === undefined ||
      humidity === undefined ||
      lightStatus === undefined
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: temperature, humidity, lightStatus",
        },
        { status: 400 }
      );
    }

    // Create mock sensor data for prediction
    const mockSensorData = {
      id: "mock_post",
      timestamp: new Date().toISOString(),
      deviceId: "ESP32_001",
      temperature,
      humidity,
      lightStatus,
      windSpeed: 5, // Default wind speed
      potentialWindPower: 62.5,
      busVoltage: 5.0,
      current: 0,
      power: 0,
      batteryLevel: 85,
      solarEfficiency: 0,
      windEfficiency: 0,
      totalEfficiency: 0,
      energyHarvested: 0,
      costSavings: 0,
      carbonOffset: 0,
      isOnline: true,
      connectionQuality: "excellent" as const,
    };

    // Get prediction using mock AI service
    const prediction = await mockAIService.getPredictionFromSensor(
      mockSensorData
    );

    if (prediction) {
      return NextResponse.json(prediction);
    } else {
      return NextResponse.json(
        { error: "Failed to generate prediction" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("AI prediction POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
