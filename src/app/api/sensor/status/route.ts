import { NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";
import { DeviceStatus } from "@/types/sensor";

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
  } catch (error: unknown) {
    console.error("❌ Error retrieving device status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      {
        success: false,
        message: "Error retrieving device status",
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
 * Calculate system uptime based on device status
 */
function calculateUptime(deviceStatus: DeviceStatus[]): string {
  const onlineDevices = deviceStatus.filter((device) => device.isOnline);
  const totalDevices = deviceStatus.length;

  if (totalDevices === 0) return "0%";

  const uptimePercentage = (onlineDevices.length / totalDevices) * 100;
  return `${Math.round(uptimePercentage)}%`;
}

/**
 * Assess overall data quality based on statistics
 */
function assessDataQuality(statistics: {
  totalReadings: number;
  avgTemperature: number;
  avgPower: number;
  avgEfficiency: number;
}): "excellent" | "good" | "fair" | "poor" {
  if (statistics.totalReadings === 0) return "poor";

  // Simple heuristic based on data consistency
  if (
    statistics.avgTemperature > -50 &&
    statistics.avgTemperature < 100 &&
    statistics.avgPower >= 0 &&
    statistics.avgPower <= 1000
  ) {
    return "excellent";
  } else if (
    statistics.avgTemperature > -100 &&
    statistics.avgTemperature < 150
  ) {
    return "good";
  } else if (
    statistics.avgTemperature > -200 &&
    statistics.avgTemperature < 200
  ) {
    return "fair";
  } else {
    return "poor";
  }
}
