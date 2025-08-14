import { NextRequest, NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";
import { ProcessedSensorData } from "@/types/sensor";

export async function GET(request: NextRequest) {
  const heartbeatInterval = 30000; // Heartbeat every 30 seconds only

  // Set headers for Server-Sent Events
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  };

  const stream = new ReadableStream({
    start(controller) {
      let heartbeatCount = 0;
      let heartbeatIntervalId: NodeJS.Timeout | null = null;
      let dataListenerCleanup: (() => void) | null = null;

      const sendData = (data: ProcessedSensorData) => {
        try {
          const deviceStatus = sensorService.getDeviceStatus();
          const statistics = sensorService.getDataStatistics();

          const eventData = {
            timestamp: new Date().toISOString(),
            sensorData: data,
            deviceStatus,
            statistics,
            message: "Real-time sensor data update",
          };

          const event = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(new TextEncoder().encode(event));
          console.log("📡 Stream: Sent sensor data update");
        } catch (error) {
          console.error("Error in data stream:", error);
        }
      };

      const sendHeartbeat = () => {
        try {
          const deviceStatus = sensorService.getDeviceStatus();
          const statistics = sensorService.getDataStatistics();

          heartbeatCount++;

          const heartbeat = {
            timestamp: new Date().toISOString(),
            message: `Heartbeat ${heartbeatCount} - connection alive`,
            deviceStatus,
            statistics,
            heartbeatCount,
          };

          const event = `data: ${JSON.stringify(heartbeat)}\n\n`;
          controller.enqueue(new TextEncoder().encode(event));
          console.log(`💓 Stream: Sent heartbeat ${heartbeatCount}`);
        } catch (error) {
          console.error("Error sending heartbeat:", error);
        }
      };

      // Send initial data ONCE
      const initialData = sensorService.getLatestSensorData(1);
      if (initialData.length > 0) {
        sendData(initialData[0]);
      }

      // Set up event listener for new sensor data
      dataListenerCleanup = sensorService.addDataListener(sendData);

      // Set up ONLY heartbeat interval (no data checking interval)
      heartbeatIntervalId = setInterval(sendHeartbeat, heartbeatInterval);

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
        if (dataListenerCleanup) dataListenerCleanup();
        controller.close();
        console.log(
          "🔌 Stream: Connection closed, heartbeat and listener cleared"
        );
      });
    },
  });

  return new Response(stream, { headers });
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error configuring stream",
      },
      { status: 500 }
    );
  }
}
