import { NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";

export async function GET() {
  // Return a simple JSON response instead of streaming
  // This eliminates the continuous heartbeat and logging
  try {
    const latestData = sensorService.getLatestSensorData(1);
    const deviceStatus = sensorService.getDeviceStatus();
    const statistics = sensorService.getDataStatistics();

    return NextResponse.json({
      success: true,
      message: "Stream data snapshot",
      timestamp: new Date().toISOString(),
      sensorData: latestData[0] || null,
      deviceStatus,
      statistics,
      totalCount: sensorService.getAllSensorData().length,
    });
  } catch (error: unknown) {
    console.error("Error getting stream snapshot:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error getting stream data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests for stream configuration
  try {
    const body = await request.json();
    const { action, interval: newInterval } = body;

    if (action === "configure") {
      // In a real implementation, you might store stream configuration
      return NextResponse.json({
        success: true,
        message: "Stream configuration updated",
        interval: newInterval || 5000,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error configuring stream:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error configuring stream",
      },
      { status: 500 }
    );
  }
}
