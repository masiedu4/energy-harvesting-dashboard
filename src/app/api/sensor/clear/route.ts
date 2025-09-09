import { NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";

/**
 * Clear all sensor data - useful for production reset
 * DELETE /api/sensor/clear
 */
export async function DELETE() {
  try {
    sensorService.clearAllData();
    
    return NextResponse.json({
      success: true,
      message: "All sensor data cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ Error clearing sensor data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear sensor data",
        error: process.env.NODE_ENV === "development" ? errorMessage : "Internal error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get system status after clearing data
 * GET /api/sensor/clear
 */
export async function GET() {
  try {
    const stats = sensorService.getDataStatistics();
    
    return NextResponse.json({
      success: true,
      message: "System ready for real ESP32 data",
      dataCount: sensorService.getAllSensorData().length,
      maxDataPoints: 200,
      systemStatus: "ready",
      lastCleared: new Date().toISOString(),
      statistics: stats,
    });
  } catch (error: unknown) {
    console.error("❌ Error getting system status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get system status",
        error: process.env.NODE_ENV === "development" ? errorMessage : "Internal error",
      },
      { status: 500 }
    );
  }
}
