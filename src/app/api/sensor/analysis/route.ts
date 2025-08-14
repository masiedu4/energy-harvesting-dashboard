import { NextResponse } from "next/server";
import { sensorService } from "@/lib/sensorService";

export async function GET() {
  try {
    const trendData = sensorService.getTrendData(); // No parameters needed
    const hourlyAverages = sensorService.getHourlyAverages();
    const statistics = sensorService.getDataStatistics();

    const response = {
      success: true,
      message: "Comprehensive data analysis retrieved successfully",
      timestamp: new Date().toISOString(),
      analysis: {
        statistics,
        trends: trendData
          ? {
              trend: trendData.trend,
              change: trendData.change,
              recentAverage: trendData.recentAverage,
              olderAverage: trendData.olderAverage,
              dataPoints: sensorService.getAllSensorData().length,
            }
          : {
              trend: "no_data",
              change: 0,
              recentAverage: 0,
              olderAverage: 0,
              dataPoints: 0,
            },
        hourlyAnalysis: {
          totalHours: 1, // Simplified for now
          hourlyData: [hourlyAverages],
          summary: {
            mostActiveHour: "current",
            averageReadingsPerHour: statistics.totalReadings,
          },
        },
        dataQuality: {
          totalReadings: statistics.totalReadings,
          dataRetention: "Last 200 readings",
          dataPointsRetained: statistics.totalReadings,
          coverage:
            statistics.totalReadings > 0
              ? "Data available"
              : "No data available",
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error retrieving data analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error retrieving data analysis",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Internal error",
      },
      { status: 500 }
    );
  }
}
