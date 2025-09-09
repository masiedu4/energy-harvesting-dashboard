#!/usr/bin/env node

/**
 * Test script for the new ESP32 data format
 * Matches the exact structure your ESP32 will send
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

// Your exact ESP32 data structure
const createESP32Data = () => ({
  temperature: 29.5,
  humidity: 79.3,
  bus_voltage: 5.25,
  current: -16.2,
  power: 96.0,
  light_value: 820,
  light_status: "Light available, good for solar energy",
  wind_count: 12,
  hr: 15,
});

// Function to send data to the API
async function sendSensorData(data) {
  try {
    console.log(`📤 Sending ESP32 data:`, JSON.stringify(data, null, 2));

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

// Function to send multiple varied data points
async function sendMultipleDataPoints(count = 5) {
  console.log(`🚀 Testing new ESP32 format...`);
  console.log(`📊 Sending ${count} data points to ${API_URL}`);
  console.log("=".repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < count; i++) {
    // Create realistic variations in the data
    const baseData = createESP32Data();
    const variedData = {
      ...baseData,
      temperature: baseData.temperature + (Math.random() - 0.5) * 4, // ±2°C variation
      humidity: Math.max(
        0,
        Math.min(100, baseData.humidity + (Math.random() - 0.5) * 10)
      ), // ±5% variation
      bus_voltage: Math.max(
        0,
        baseData.bus_voltage + (Math.random() - 0.5) * 1
      ), // ±0.5V variation
      current: baseData.current + (Math.random() - 0.5) * 10, // ±5mA variation
      power: Math.max(0, baseData.power + (Math.random() - 0.5) * 40), // ±20mW variation
      light_value: Math.max(
        0,
        Math.min(
          4095,
          baseData.light_value + Math.floor((Math.random() - 0.5) * 400)
        )
      ), // ±200 variation
      wind_count: Math.max(0, Math.floor(Math.random() * 50)), // 0-50 random count
      hr: Math.floor(Math.random() * 24), // Random hour 0-23
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
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("=".repeat(60));
  console.log(`🎉 ESP32 Format Test Complete!`);
  console.log(`📈 Results: ${successCount} successful, ${errorCount} failed`);
  console.log(`🌐 Visit your dashboard: ${API_URL}`);
  console.log(`🔍 Check the real-time data and charts!`);
}

// Function to send a single test data point
async function sendSingleTest() {
  console.log(`🧪 Testing single ESP32 data point...`);

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
const count = parseInt(args[1]) || 5;

if (command === "single") {
  sendSingleTest();
} else if (command === "multiple") {
  sendMultipleDataPoints(count);
} else {
  console.log(`
🌞 ESP32 New Format Data Tester
===============================

Usage:
  node scripts/test-new-esp32-format.js single          # Send one test data point
  node scripts/test-new-esp32-format.js multiple [N]    # Send N data points (default: 5)

Examples:
  node scripts/test-new-esp32-format.js single
  node scripts/test-new-esp32-format.js multiple 10

Environment:
  API_URL=${API_URL}

Your NEW ESP32 data structure:
${JSON.stringify(createESP32Data(), null, 2)}

Changes from previous format:
- ldrRaw → light_value
- irradiance → removed
- lightStatus → light_status
- avgWind → wind_count
- busVoltage → bus_voltage
- hour → hr
  `);
}
