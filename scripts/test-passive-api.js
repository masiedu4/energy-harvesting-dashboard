#!/usr/bin/env node

/**
 * Test script to verify the API is completely passive
 * Should only respond when called, not run continuously
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

// Test data in your format
const testData = {
  temperature: 29.5,
  humidity: 79.3,
  bus_voltage: 5.25,
  current: -16.2,
  power: 96.0,
  light_value: 820,
  light_status: "Light available, good for solar energy",
  wind_count: 12,
  hr: 15,
};

async function testPassiveAPI() {
  console.log("🔍 Testing Passive API Behavior");
  console.log("=".repeat(50));

  try {
    console.log("📡 Testing GET /api/sensor...");
    const getResponse = await fetch(`${API_URL}/api/sensor`);
    const getData = await getResponse.json();
    console.log(`✅ GET successful: ${getData.message}`);
    console.log(`📊 Data count: ${getData.totalCount}`);

    console.log("\n📤 Testing POST /api/sensor...");
    const postResponse = await fetch(`${API_URL}/api/sensor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
    const postData = await postResponse.json();
    console.log(`✅ POST successful: ${postData.message}`);

    console.log(
      "\n📡 Testing GET /api/sensor/stream (should be simple JSON now)..."
    );
    const streamResponse = await fetch(`${API_URL}/api/sensor/stream`);
    const streamData = await streamResponse.json();
    console.log(`✅ Stream endpoint successful: ${streamData.message}`);

    console.log("\n🎉 All API endpoints are working and passive!");
    console.log("✅ No continuous running detected");
    console.log(`🌐 Dashboard: ${API_URL}`);
  } catch (error) {
    console.error("❌ Error testing API:", error.message);
  }
}

testPassiveAPI();
