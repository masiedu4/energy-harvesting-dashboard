import { NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";

export async function GET() {
  try {
    const deviceStatus = sensorService.getDeviceStatus();
    const statistics = sensorService.getDataStatistics();

    const response = {
      success: true,
      message: "Device status retrieved successfully",
      timestamp: new Date().toISOString(),
      devices: deviceStatus,
      statistics: {
        ...statistics,
        uptime: calculateUptime(deviceStatus),
        dataQuality: assessDataQuality(statistics),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error retrieving device status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error retrieving device status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate system uptime based on device status
 */
function calculateUptime(deviceStatus: any[]): string {
  const onlineDevices = deviceStatus.filter((device) => device.isOnline);
  const totalDevices = deviceStatus.length;

  if (totalDevices === 0) return "0%";

  const uptimePercentage = (onlineDevices.length / totalDevices) * 100;
  return `${Math.round(uptimePercentage)}%`;
}

/**
 * Assess overall data quality based on statistics
 */
function assessDataQuality(
  statistics: any
): "excellent" | "good" | "fair" | "poor" {
  if (statistics.totalReadings === 0) return "poor";

  // Simple heuristic based on data consistency
  if (
    statistics.averageTemperature > -50 &&
    statistics.averageTemperature < 100 &&
    statistics.averageHumidity >= 0 &&
    statistics.averageHumidity <= 100
  ) {
    return "excellent";
  } else if (
    statistics.averageTemperature > -100 &&
    statistics.averageTemperature < 150
  ) {
    return "good";
  } else if (
    statistics.averageTemperature > -200 &&
    statistics.averageTemperature < 200
  ) {
    return "fair";
  } else {
    return "poor";
  }
}
