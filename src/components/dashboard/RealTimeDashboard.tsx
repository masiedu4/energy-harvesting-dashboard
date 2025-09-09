"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { ProcessedSensorData, StreamData, AIPrediction } from "@/types/sensor";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RealTimeDashboard() {
  // State for real-time data
  const [streamData] = useState<StreamData | null>(null);
  const [fallbackData, setFallbackData] = useState<
    ProcessedSensorData[] | null
  >(null);

  const [connectionStatus] = useState<string>("connecting");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // AI Prediction state
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Helper function to get current data
  const getCurrentData = useCallback((): ProcessedSensorData | null => {
    if (streamData && "sensorData" in streamData && streamData.sensorData) {
      return streamData.sensorData;
    }

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData[fallbackData.length - 1];
    }

    return null;
  }, [streamData, fallbackData]);

  // Get all data for charts
  const getAllData = useCallback((): ProcessedSensorData[] => {
    if (streamData && "sensorData" in streamData && streamData.sensorData) {
      return [streamData.sensorData];
    }

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData;
    }

    return [];
  }, [streamData, fallbackData]);

  // Stream connection disabled - API is now passive

  // Fetch fallback data
  const fetchFallbackData = useCallback(async () => {
    try {
      const response = await fetch("/api/sensor?limit=50");
      if (response.ok) {
        const data = await response.json();
        setFallbackData(data.data || []);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching fallback data:", error);
    }
  }, []);

  // Fetch AI predictions
  const fetchAIPredictions = useCallback(async () => {
    const currentData = getCurrentData();
    if (!currentData) return;

    setPredictionLoading(true);
    try {
      // Get current hour prediction
      const currentResponse = await fetch("/api/sensor/ai?type=current");
      if (currentResponse.ok) {
        const currentPred = await currentResponse.json();
        setAiPrediction(currentPred);
      }

      // Get day forecast
      // Day forecast removed - using current predictions only
    } catch (error) {
      console.error("Error fetching AI predictions:", error);
    } finally {
      setPredictionLoading(false);
    }
  }, [getCurrentData]);

  // Initialize dashboard - only fetch data once, no streaming
  useEffect(() => {
    fetchFallbackData();
    // fetchAIPredictions(); // Disabled auto AI fetch
    // const eventSource = connectToStream(); // Disabled auto stream connection

    // return () => {
    //   if (eventSource) {
    //     eventSource.close();
    //   }
    // };
  }, [fetchFallbackData]);

  // Connection health check (disabled to prevent continuous running)
  // useEffect(() => {
  //   const healthCheck = setInterval(() => {
  //     if (lastUpdate) {
  //       const lastUpdateTime = new Date(lastUpdate).getTime();
  //       const now = Date.now();
  //       if (now - lastUpdateTime > 30000) {
  //         setConnectionStatus("error");
  //       }
  //     }
  //   }, 10000);

  //   return () => clearInterval(healthCheck);
  // }, [lastUpdate]);

  const currentData = getCurrentData();
  const allData = getAllData();

  // Show loading state if no data
  if (!currentData || allData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-pulse mb-8">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl">⚡</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Energy Harvesting Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              🌞 Ready to receive real-time ESP32 data
            </p>
            <p className="text-sm text-gray-500 mb-8">
              System cleared and optimized for live sensor data
            </p>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-green-100 border border-green-300 rounded-lg px-6 py-3 mb-4">
                <p className="text-green-800 font-medium">
                  ✅ System Ready - Send data to:{" "}
                  <code className="bg-green-200 px-2 py-1 rounded">
                    POST /api/sensor
                  </code>
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={fetchFallbackData}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🔄 Check for Data
                </button>
                <button
                  onClick={() => {
                    fetchFallbackData();
                    fetchAIPredictions();
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🔄 Refresh Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data for multiple readings
  const chartLabels = allData.map((_, index) =>
    allData.length === 1 ? "Current" : `Reading ${index + 1}`
  );

  // Environmental Data Chart
  const environmentalData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: allData.map((d) => d.temperature),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        yAxisID: "y",
        tension: 0.4,
      },
      {
        label: "Humidity (%)",
        data: allData.map((d) => d.humidity),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y1",
        tension: 0.4,
      },
    ],
  };

  // Solar Data Chart
  const solarData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Irradiance (W/m²)",
        data: allData.map((d) => d.irradiance || 0),
        borderColor: "rgb(251, 191, 36)",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        yAxisID: "y",
        tension: 0.4,
      },
      {
        label: "LDR Raw",
        data: allData.map((d) => d.ldrRaw || 0),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        yAxisID: "y1",
        tension: 0.4,
      },
    ],
  };

  // Power Data Chart
  const powerData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Power (mW)",
        data: allData.map((d) => d.power),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Current (mA)",
        data: allData.map((d) => d.current),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        yAxisID: "y1",
        tension: 0.4,
      },
    ],
  };

  // Efficiency Doughnut Chart
  const efficiencyData = {
    labels: ["Solar Efficiency", "Wind Efficiency", "Unused Potential"],
    datasets: [
      {
        data: [
          currentData.solarEfficiency,
          currentData.windEfficiency,
          Math.max(
            0,
            100 - currentData.solarEfficiency - currentData.windEfficiency
          ),
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(156, 163, 175, 0.3)",
        ],
        borderColor: [
          "rgb(251, 191, 36)",
          "rgb(34, 197, 94)",
          "rgb(156, 163, 175)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const dualAxisOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ⚡ Energy Harvesting Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time ESP32 sensor monitoring with AI predictions
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Update</p>
                <p className="font-semibold text-gray-800">{lastUpdate}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  connectionStatus === "connected"
                    ? "bg-green-100 text-green-800"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-100 text-yellow-800"
                    : connectionStatus === "disabled"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {connectionStatus === "connected"
                  ? "🟢 Online"
                  : connectionStatus === "connecting"
                  ? "🟡 Connecting"
                  : connectionStatus === "disabled"
                  ? "🔇 Passive Mode"
                  : "🔴 Offline"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Temperature Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-3xl font-bold text-red-600">
                  {currentData.temperature?.toFixed(1) || "0.0"}°C
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🌡️</span>
              </div>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Humidity</p>
                <p className="text-3xl font-bold text-blue-600">
                  {currentData.humidity?.toFixed(1) || "0.0"}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💧</span>
              </div>
            </div>
          </div>

          {/* Irradiance Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Irradiance</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {currentData.irradiance?.toFixed(0) || "0"}
                </p>
                <p className="text-xs text-gray-500">W/m²</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">☀️</span>
              </div>
            </div>
          </div>

          {/* Power Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Power</p>
                <p className="text-3xl font-bold text-green-600">
                  {currentData.power?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-gray-500">mW</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Environmental Data Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🌡️</span>
              Environmental Conditions
            </h3>
            <Line data={environmentalData} options={dualAxisOptions} />
          </div>

          {/* Solar Data Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">☀️</span>
              Solar Conditions
            </h3>
            <Line data={solarData} options={dualAxisOptions} />
          </div>

          {/* Power Data Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Power Generation
            </h3>
            <Line data={powerData} options={dualAxisOptions} />
          </div>

          {/* Efficiency Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              System Efficiency
            </h3>
            <div className="flex justify-center">
              <div className="w-80">
                <Doughnut data={efficiencyData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Predictions Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🤖</span>
              AI Solar Predictions
            </h3>
            <button
              onClick={fetchAIPredictions}
              disabled={predictionLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
            >
              {predictionLoading ? "🔄 Loading..." : "🔮 Update Predictions"}
            </button>
          </div>

          {aiPrediction && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">
                  Current Prediction
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {aiPrediction.predicted_power?.toFixed(2) || "0.00"} mW
                </p>
                <p className="text-sm text-purple-600">
                  Irradiance: {aiPrediction.irradiance?.toFixed(0) || "0"} W/m²
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Temperature Impact
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {aiPrediction.temperature?.toFixed(1) || "0.0"}°C
                </p>
                <p className="text-sm text-blue-600">
                  Humidity: {aiPrediction.humidity?.toFixed(1) || "0.0"}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Time Factor
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  Hour {aiPrediction.hr || currentData.hour || 0}
                </p>
                <p className="text-sm text-green-600">
                  Source: {aiPrediction.source || "sensor"}
                </p>
              </div>
            </div>
          )}

          {!aiPrediction && !predictionLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>
                🤖 Click &quot;Update Predictions&quot; to get AI-powered solar
                forecasts
              </p>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sensor Details */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              Sensor Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">LDR Raw Value</span>
                <span className="font-semibold">{currentData.ldrRaw || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Bus Voltage</span>
                <span className="font-semibold">
                  {currentData.busVoltage?.toFixed(2) || "0.00"} V
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Current</span>
                <span className="font-semibold">
                  {currentData.current?.toFixed(2) || "0.00"} mA
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Average Wind</span>
                <span className="font-semibold">
                  {currentData.avgWind?.toFixed(1) || "0.0"} km/h
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Hour of Day</span>
                <span className="font-semibold">
                  {currentData.hour || 0}:00
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Device ID</span>
                <span className="font-semibold">{currentData.deviceId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Battery Level</span>
                <span className="font-semibold">
                  {currentData.batteryLevel || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Solar Efficiency</span>
                <span className="font-semibold">
                  {currentData.solarEfficiency?.toFixed(1) || "0.0"}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Connection Quality</span>
                <span
                  className={`font-semibold ${
                    currentData.connectionQuality === "excellent"
                      ? "text-green-600"
                      : currentData.connectionQuality === "good"
                      ? "text-blue-600"
                      : currentData.connectionQuality === "fair"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {currentData.connectionQuality || "good"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Data Points</span>
                <span className="font-semibold">{allData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
