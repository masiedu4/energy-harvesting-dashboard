"use client";

import React, { useState, useEffect } from "react";
import {
  generateTestSensorData,
  testScenarios,
  startTestDataStream,
} from "@/lib/testData";
import { ESP32SensorData } from "@/types/sensor";

export default function TestPage() {
  const [testData, setTestData] = useState<ESP32SensorData | null>(null);
  const [apiResponse, setApiResponse] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<ESP32SensorData[]>([]);

  const generateNewTestData = () => {
    const data = generateTestSensorData();
    setTestData(data);
  };

  const testApiEndpoint = async (data: ESP32SensorData) => {
    try {
      const response = await fetch("/api/sensor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
  };

  const testGetEndpoint = async () => {
    try {
      const response = await fetch("/api/sensor?limit=5&stats=true");
      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
  };

  const testStatusEndpoint = async () => {
    try {
      const response = await fetch("/api/sensor/status");
      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
  };

  const startTestStream = () => {
    setIsStreaming(true);
    setStreamData([]);

    const cleanup = startTestDataStream((data) => {
      setStreamData((prev) => [...prev.slice(-9), data]); // Keep last 10 entries
      testApiEndpoint(data);
    }, 3000); // Send data every 3 seconds

    // Store cleanup function
    (window as { testStreamCleanup?: () => void }).testStreamCleanup = cleanup;
  };

  const stopTestStream = () => {
    setIsStreaming(false);
    const cleanup = (window as { testStreamCleanup?: () => void })
      .testStreamCleanup;
    if (cleanup) {
      cleanup();
    }
  };

  useEffect(() => {
    generateNewTestData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 API Testing & Development
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Data Generation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test Data Generation
            </h2>

            <div className="space-y-4">
              <button
                onClick={generateNewTestData}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Generate New Test Data
              </button>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(testScenarios).map(([name, generator]) => (
                  <button
                    key={name}
                    onClick={() => setTestData(generator())}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    {name.replace(/([A-Z])/g, " $1").trim()}
                  </button>
                ))}
              </div>
            </div>

            {testData && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-2">
                  Current Test Data:
                </h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* API Testing */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              API Testing
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => testData && testApiEndpoint(testData)}
                disabled={!testData}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test POST /api/sensor
              </button>

              <button
                onClick={testGetEndpoint}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test GET /api/sensor
              </button>

              <button
                onClick={testStatusEndpoint}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test GET /api/sensor/status
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/sensor/analysis");
                    const result = await response.json();
                    setApiResponse(JSON.stringify(result, null, 2));
                  } catch (error) {
                    setApiResponse(`Error: ${error}`);
                  }
                }}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test GET /api/sensor/analysis
              </button>

              <button
                onClick={async () => {
                  try {
                    setApiResponse("Testing stream endpoint...");
                    const response = await fetch(
                      "/api/sensor/stream?interval=10000"
                    );
                    if (response.ok) {
                      setApiResponse("✅ Stream endpoint is accessible");
                    } else {
                      setApiResponse(
                        `❌ Stream endpoint error: ${response.status}`
                      );
                    }
                  } catch (error) {
                    setApiResponse(`❌ Stream endpoint failed: ${error}`);
                  }
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test Stream Endpoint
              </button>
            </div>

            {apiResponse && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-2">
                  API Response:
                </h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Test Stream */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Data Stream
          </h2>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={startTestStream}
              disabled={isStreaming}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Start Test Stream
            </button>

            <button
              onClick={stopTestStream}
              disabled={!isStreaming}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Stop Test Stream
            </button>
          </div>

          {isStreaming && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                🔄 Test stream is running - sending data every 3 seconds to
                /api/sensor
              </p>
            </div>
          )}

          {streamData.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Stream Data (Last 10 entries):
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {streamData.map((data, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded text-xs">
                    <span className="font-medium">
                      Entry {streamData.length - index}:
                    </span>
                    <span className="ml-2 text-gray-600">
                      Temp: {data.temperature}°C, Power: {data.power}mW, Wind:{" "}
                      {data.windSpeed}km/h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">
            How to Use
          </h2>
          <ol className="text-blue-700 space-y-2 text-sm">
            <li>1. Generate test data or use predefined scenarios</li>
            <li>2. Test individual API endpoints</li>
            <li>3. Start a test stream to simulate real-time ESP32 data</li>
            <li>4. Monitor the dashboard to see real-time updates</li>
            <li>5. Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
