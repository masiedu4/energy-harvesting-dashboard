"use client";

import { useEffect, useState, useCallback } from "react";
import { ProcessedSensorData, StreamData } from "@/types/sensor";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [fallbackData, setFallbackData] = useState<ProcessedSensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error" | "offline"
  >("offline");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<{
    status?: number;
    ok?: boolean;
    headers?: Record<string, string>;
    error?: string;
  } | null>(null);

  const displayData = streamData || fallbackData;

  const connectToStream = useCallback(() => {
    try {
      const eventSource = new EventSource("/api/sensor/stream");
      setConnectionStatus("connecting");

      eventSource.onopen = () => {
        console.log("🔌 Stream: Connection opened");
        setConnectionStatus("connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StreamData = JSON.parse(event.data);

          if (data.sensorData && typeof data.sensorData === "object") {
            setStreamData(data);
            setLastUpdate(new Date().toLocaleTimeString());
            setError(null);

            if (data.message && data.message.includes("update")) {
              console.log("📡 Stream: Received sensor data update");
            }
          } else if (data.message && data.message.includes("Heartbeat")) {
            console.log(`💓 Stream heartbeat: ${data.message}`);
          }
        } catch (parseError) {
          console.error("Error parsing stream data:", parseError);
          setError("Error parsing sensor data");
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource error:", event);
        setConnectionStatus("error");
        setError("Stream connection error");
      };

      return eventSource;
    } catch (error) {
      console.error("Error connecting to stream:", error);
      setConnectionStatus("error");
      setError("Failed to connect to stream");
      return null;
    }
  }, []);

  const fetchFallbackData = useCallback(async () => {
    try {
      const response = await fetch("/api/sensor?limit=50");
      if (response.ok) {
        const data = await response.json();
        setFallbackData(data.data || []);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } else {
        setError("Failed to fetch fallback data");
      }
    } catch (error) {
      console.error("Error fetching fallback data:", error);
      setError("Error fetching fallback data");
    }
  }, []);

  const testStream = useCallback(async () => {
    try {
      const response = await fetch("/api/sensor/stream");
      const result = {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };
      setApiResponse(result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setApiResponse({ error: errorMessage });
    }
  }, []);

  useEffect(() => {
    const eventSource = connectToStream();
    fetchFallbackData();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [connectToStream, fetchFallbackData]);

  // Connection health check
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (lastUpdate) {
        const lastUpdateTime = new Date(lastUpdate).getTime();
        const now = Date.now();
        if (now - lastUpdateTime > 30000) {
          setConnectionStatus("error");
        }
      }
    }, 10000);

    return () => clearInterval(healthCheck);
  }, [lastUpdate]);

  // Prepare chart data
  const getChartData = () => {
    if (!displayData) return null;

    if (Array.isArray(displayData)) {
      if (displayData.length === 0) return null;
      const data = displayData;
      const labels = data.map((_, index) => `Reading ${index + 1}`);

      return {
        temperature: data.map((d) => d?.temperature || 0),
        humidity: data.map((d) => d?.humidity || 0),
        power: data.map((d) => d?.power || 0),
        windSpeed: data.map((d) => d?.windSpeed || 0),
        solarEfficiency: data.map((d) => d?.solarEfficiency || 0),
        windEfficiency: data.map((d) => d?.windEfficiency || 0),
        totalEfficiency: data.map((d) => d?.totalEfficiency || 0),
        labels,
      };
    } else {
      // Single StreamData object
      if (!displayData.sensorData) return null;
      const data = [displayData.sensorData];
      const labels = ["Current"];

      return {
        temperature: data.map((d) => d?.temperature || 0),
        humidity: data.map((d) => d?.humidity || 0),
        power: data.map((d) => d?.power || 0),
        windSpeed: data.map((d) => d?.windSpeed || 0),
        solarEfficiency: data.map((d) => d?.solarEfficiency || 0),
        windEfficiency: data.map((d) => d?.windEfficiency || 0),
        totalEfficiency: data.map((d) => d?.totalEfficiency || 0),
        labels,
      };
    }
  };

  const chartData = getChartData();

  // Safety check for chart data
  if (!chartData) {
    console.log("No chart data available");
  }

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sensor Readings Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Efficiency Metrics",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "Current Status",
      },
    },
  };

  if (
    !displayData ||
    (Array.isArray(displayData) && displayData.length === 0) ||
    (!Array.isArray(displayData) && !displayData.sensorData)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🌞 Energy Harvesting Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Waiting for sensor data...
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchFallbackData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={connectToStream}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Connect to Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentData = Array.isArray(displayData)
    ? displayData[displayData.length - 1]
    : displayData.sensorData;

  const deviceStatus = Array.isArray(displayData)
    ? null
    : displayData.deviceStatus;

  const statistics = Array.isArray(displayData) ? null : displayData.statistics;

  // Debug logging
  console.log("displayData:", displayData);
  console.log("currentData:", currentData);
  console.log("Array.isArray(displayData):", Array.isArray(displayData));
  console.log("currentData type:", typeof currentData);
  console.log(
    "currentData keys:",
    currentData ? Object.keys(currentData) : "undefined"
  );

  // Safety check - if currentData is undefined, show loading state
  if (!currentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🌞 Energy Harvesting Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8">Loading sensor data...</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchFallbackData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={connectToStream}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Connect to Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🌞 Energy Harvesting Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time monitoring of solar and wind energy systems
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === "connected"
                    ? "bg-green-100 text-green-800"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-100 text-yellow-800"
                    : connectionStatus === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {connectionStatus === "connected"
                  ? "🟢 Online"
                  : connectionStatus === "connecting"
                  ? "🟡 Connecting"
                  : connectionStatus === "error"
                  ? "🔴 Error"
                  : "⚫ Offline"}
              </div>
              <div className="text-sm text-gray-500">
                Last update: {lastUpdate || "Never"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🌡️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentData.temperature?.toFixed(1) || "N/A"}°C
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">💧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Humidity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentData.humidity?.toFixed(1) || "N/A"}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Power</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentData.power?.toFixed(1) || "N/A"} mW
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">💨</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wind Speed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentData.windSpeed?.toFixed(1) || "N/A"} km/h
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Temperature & Humidity Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Temperature & Humidity Trends
            </h3>
            {chartData ? (
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: "Temperature (°C)",
                      data: chartData.temperature,
                      borderColor: "rgb(59, 130, 246)",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: "Humidity (%)",
                      data: chartData.humidity,
                      borderColor: "rgb(34, 197, 94)",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={lineChartOptions}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No chart data available
              </div>
            )}
          </div>

          {/* Power & Wind Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Power & Wind Speed
            </h3>
            {chartData ? (
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: "Power (mW)",
                      data: chartData.power,
                      borderColor: "rgb(245, 158, 11)",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: "Wind Speed (km/h)",
                      data: chartData.windSpeed,
                      borderColor: "rgb(168, 85, 247)",
                      backgroundColor: "rgba(168, 85, 247, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={lineChartOptions}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No chart data available
              </div>
            )}
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Efficiency Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              System Efficiency
            </h3>
            {chartData ? (
              <Bar
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: "Solar Efficiency (%)",
                      data: chartData.solarEfficiency,
                      backgroundColor: "rgba(59, 130, 246, 0.8)",
                      borderColor: "rgb(59, 130, 246)",
                      borderWidth: 1,
                    },
                    {
                      label: "Wind Efficiency (%)",
                      data: chartData.windEfficiency,
                      backgroundColor: "rgba(34, 197, 94, 0.8)",
                      borderColor: "rgb(34, 197, 94)",
                      borderWidth: 1,
                    },
                    {
                      label: "Total Efficiency (%)",
                      data: chartData.totalEfficiency,
                      backgroundColor: "rgba(245, 158, 11, 0.8)",
                      borderColor: "rgb(245, 158, 11)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={barChartOptions}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No chart data available
              </div>
            )}
          </div>

          {/* Current Status Doughnut */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Current System Status
            </h3>
            {currentData ? (
              <Doughnut
                data={{
                  labels: ["Solar", "Wind", "Battery"],
                  datasets: [
                    {
                      data: [
                        currentData.solarEfficiency || 0,
                        currentData.windEfficiency || 0,
                        currentData.batteryLevel || 0,
                      ],
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.8)",
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(245, 158, 11, 0.8)",
                      ],
                      borderColor: [
                        "rgb(59, 130, 246)",
                        "rgb(34, 197, 94)",
                        "rgb(245, 158, 11)",
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={doughnutOptions}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Energy & Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Energy Harvested
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {currentData.energyHarvested?.toFixed(2) || "0.00"} kWh
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Total energy generated today
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cost Savings
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                ${currentData.costSavings?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Money saved on electricity
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Carbon Offset
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {currentData.carbonOffset?.toFixed(2) || "0.00"} kg
              </p>
              <p className="text-sm text-gray-600 mt-2">
                CO₂ emissions avoided
              </p>
            </div>
          </div>
        </div>

        {/* Device Status & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Device Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Device Status
            </h3>
            {deviceStatus && deviceStatus.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      deviceStatus[0].isOnline
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {deviceStatus[0].isOnline ? "🟢 Online" : "🔴 Offline"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Battery Level:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {deviceStatus[0].batteryLevel}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Connection Quality:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {deviceStatus[0].connectionQuality}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(deviceStatus[0].lastSeen).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stream Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Stream Controls
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Connection:</span>
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    connectionStatus === "connected"
                      ? "bg-green-100 text-green-800"
                      : connectionStatus === "connecting"
                      ? "bg-yellow-100 text-yellow-800"
                      : connectionStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {connectionStatus}
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={fetchFallbackData}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={connectToStream}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reconnect
                </button>
                <button
                  onClick={testStream}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Test Stream
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        {statistics && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              System Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.totalReadings || 0}
                </p>
                <p className="text-sm text-gray-600">Total Readings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {statistics.avgTemperature?.toFixed(1) || "N/A"}°C
                </p>
                <p className="text-sm text-gray-600">Avg Temperature</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.avgPower?.toFixed(1) || "N/A"} mW
                </p>
                <p className="text-sm text-gray-600">Avg Power</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.avgEfficiency?.toFixed(1) || "N/A"}%
                </p>
                <p className="text-sm text-gray-600">Avg Efficiency</p>
              </div>
            </div>
          </div>
        )}

        {/* API Response Debug */}
        {apiResponse && (
          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Stream Test Results
            </h3>
            <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
