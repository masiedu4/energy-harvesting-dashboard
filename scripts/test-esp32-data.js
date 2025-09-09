#!/usr/bin/env node

/**
 * Test script to send ESP32 data in the exact format you provided
 * This simulates your real ESP32 sending data to the dashboard
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

// Your exact ESP32 data structure
const createESP32Data = (hour = 20) => ({
  temperature: 30.8,
  humidity: 73.7,
  ldrRaw: 4095,
  irradiance: 1200.0,
  lightStatus: "Light available, good for solar energy",
  avgWind: 0.0,
  busVoltage: 0.0,
  current: 0.0,
  power: 0.0,
  hour: hour,
});

// Function to send data to the API
async function sendSensorData(data) {
  try {
    console.log(`📤 Sending ESP32 data:`, data);

    const response = await fetch(`${API_URL}/api/sensor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, result.message);
      return true;
    } else {
      console.error(`❌ Error (${response.status}):`, result.error || result);
      return false;
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
    return false;
  }
}

// Function to send multiple data points with variations
async function sendMultipleDataPoints(count = 10) {
  console.log(`🚀 Starting ESP32 data simulation...`);
  console.log(`📊 Sending ${count} data points to ${API_URL}`);
  console.log("=".repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < count; i++) {
    // Create realistic variations in the data
    const baseData = createESP32Data(20);
    const variedData = {
      ...baseData,
      temperature: baseData.temperature + (Math.random() - 0.5) * 2, // ±1°C variation
      humidity: Math.max(
        0,
        Math.min(100, baseData.humidity + (Math.random() - 0.5) * 10)
      ), // ±5% variation
      ldrRaw: Math.max(
        0,
        Math.min(
          4095,
          baseData.ldrRaw + Math.floor((Math.random() - 0.5) * 200)
        )
      ), // ±100 variation
      irradiance: Math.max(
        0,
        baseData.irradiance + (Math.random() - 0.5) * 200
      ), // ±100 W/m² variation
      avgWind: Math.max(0, Math.random() * 5), // 0-5 km/h random wind
      busVoltage: Math.max(0, Math.random() * 5), // 0-5V random voltage
      current: Math.random() * 100 - 50, // -50 to +50 mA
      power: Math.max(0, Math.random() * 150), // 0-150 mW
      hour: Math.floor(Math.random() * 24), // Random hour 0-23
    };

    const success = await sendSensorData(variedData);

    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Progress indicator
    const progress = Math.floor(((i + 1) / count) * 100);
    console.log(
      `📊 Progress: ${progress}% (${
        i + 1
      }/${count}) - ✅ ${successCount} success, ❌ ${errorCount} errors`
    );

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("=".repeat(60));
  console.log(`🎉 ESP32 Data Simulation Complete!`);
  console.log(`📈 Results: ${successCount} successful, ${errorCount} failed`);
  console.log(`🌐 Visit your dashboard: ${API_URL}`);
  console.log(`🔍 Check the real-time data and AI predictions!`);
}

// Function to send a single test data point
async function sendSingleTest() {
  console.log(`🧪 Sending single ESP32 test data point...`);

  const testData = createESP32Data();
  const success = await sendSensorData(testData);

  if (success) {
    console.log(`✅ Test successful! Check your dashboard at ${API_URL}`);
  } else {
    console.log(`❌ Test failed. Check the API endpoint and try again.`);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const count = parseInt(args[1]) || 10;

if (command === "single") {
  sendSingleTest();
} else if (command === "multiple") {
  sendMultipleDataPoints(count);
} else {
  console.log(`
🌞 ESP32 Energy Harvesting Data Simulator
==========================================

Usage:
  node scripts/test-esp32-data.js single          # Send one test data point
  node scripts/test-esp32-data.js multiple [N]    # Send N data points (default: 10)

Examples:
  node scripts/test-esp32-data.js single
  node scripts/test-esp32-data.js multiple 20

Environment:
  API_URL=${API_URL}

Your ESP32 data structure:
${JSON.stringify(createESP32Data(), null, 2)}
  `);
}
