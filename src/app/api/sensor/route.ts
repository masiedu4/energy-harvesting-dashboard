import { NextRequest, NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";
import { ESP32SensorData } from "@/types/sensor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate incoming data
    const validationResult = validateESP32Data(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.errors.join(", ") },
        { status: 400 }
      );
    }

    // Process the sensor data
    const processedData = await sensorService.processSensorData(body);

    // Minimal logging - only log when data is received
    console.log(`✅ ESP32 data received at ${new Date().toLocaleTimeString()}`);

    return NextResponse.json({
      message: "Sensor data processed successfully",
      data: processedData,
    });
  } catch (error: unknown) {
    console.error("❌ Error processing sensor data:", error);
    return NextResponse.json(
      { error: "Failed to process sensor data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const includeStats = searchParams.get("stats") === "true";

    let sensorData;

    if (startTime && endTime) {
      sensorData = sensorService.getSensorDataByTimeRange(
        new Date(startTime),
        new Date(endTime)
      );
    } else {
      sensorData = sensorService.getLatestSensorData(limit);
    }

    const response: {
      success: boolean;
      message: string;
      data: unknown;
      totalCount: number;
      lastUpdate: string;
      statistics?: unknown;
    } = {
      success: true,
      message: "Sensor data retrieved successfully",
      data: sensorData,
      totalCount: sensorData.length,
      lastUpdate: new Date().toISOString(),
    };

    if (includeStats) {
      response.statistics = sensorService.getDataStatistics();
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ Error retrieving sensor data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      {
        success: false,
        message: "Error retrieving sensor data",
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Internal error",
      },
      { status: 500 }
    );
  }
}

/**
 * Validate incoming ESP32 sensor data
 */
function validateESP32Data(data: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Type guard to check if data is an object
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.push("Data must be a valid object");
    return { isValid: false, errors };
  }

  const sensorData = data as Record<string, unknown>;
  const requiredFields: (keyof ESP32SensorData)[] = [
    "temperature",
    "humidity",
    "bus_voltage",
    "current",
    "power",
    "light_value",
    "light_status",
    "wind_count",
    "hr",
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (sensorData[field] === undefined || sensorData[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate data types and ranges
  if (
    typeof sensorData.temperature !== "number" ||
    isNaN(sensorData.temperature as number)
  ) {
    errors.push("Temperature must be a valid number");
  }

  if (
    typeof sensorData.humidity !== "number" ||
    isNaN(sensorData.humidity as number)
  ) {
    errors.push("Humidity must be a valid number");
  }

  if (
    typeof sensorData.light_value !== "number" ||
    isNaN(sensorData.light_value as number)
  ) {
    errors.push("Light value must be a valid number");
  }

  if (typeof sensorData.light_status !== "string") {
    errors.push("Light status must be a string");
  }

  if (
    typeof sensorData.wind_count !== "number" ||
    isNaN(sensorData.wind_count as number)
  ) {
    errors.push("Wind count must be a valid number");
  }

  if (typeof sensorData.hr !== "number" || isNaN(sensorData.hr as number)) {
    errors.push("Hour must be a valid number");
  }

  if (
    typeof sensorData.bus_voltage !== "number" ||
    isNaN(sensorData.bus_voltage as number)
  ) {
    errors.push("Bus voltage must be a valid number");
  }

  if (
    typeof sensorData.current !== "number" ||
    isNaN(sensorData.current as number)
  ) {
    errors.push("Current must be a valid number");
  }

  if (
    typeof sensorData.power !== "number" ||
    isNaN(sensorData.power as number)
  ) {
    errors.push("Power must be a valid number");
  }

  // Validate reasonable ranges
  const temp = sensorData.temperature as number;
  const humidity = sensorData.humidity as number;
  const lightValue = sensorData.light_value as number;
  const windCount = sensorData.wind_count as number;
  const busVoltage = sensorData.bus_voltage as number;
  const hour = sensorData.hr as number;

  if (temp < -50 || temp > 100) {
    errors.push("Temperature out of reasonable range (-50°C to 100°C)");
  }

  if (humidity < 0 || humidity > 100) {
    errors.push("Humidity out of reasonable range (0% to 100%)");
  }

  if (lightValue < 0 || lightValue > 4095) {
    errors.push("Light value out of reasonable range (0 to 4095)");
  }

  if (windCount < 0 || windCount > 10000) {
    errors.push("Wind count out of reasonable range (0 to 10000)");
  }

  if (busVoltage < 0 || busVoltage > 20) {
    errors.push("Bus voltage out of reasonable range (0V to 20V)");
  }

  if (hour < 0 || hour > 23) {
    errors.push("Hour out of reasonable range (0 to 23)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
