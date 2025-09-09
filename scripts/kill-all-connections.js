#!/usr/bin/env node

/**
 * Script to test if there are any active connections causing heartbeats
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function checkConnections() {
  console.log("🔍 Checking for active connections...");

  try {
    // Test if any endpoints are actively streaming
    console.log("📡 Testing stream endpoint...");
    const streamResponse = await fetch(`${API_URL}/api/sensor/stream`);
    const streamData = await streamResponse.json();
    console.log("✅ Stream endpoint response:", streamData.message);

    console.log("📡 Testing main sensor endpoint...");
    const sensorResponse = await fetch(`${API_URL}/api/sensor`);
    const sensorData = await sensorResponse.json();
    console.log("✅ Sensor endpoint response:", sensorData.message);

    console.log("\n🎯 Both endpoints are responding normally");
    console.log("🔇 No continuous streaming detected");

    console.log("\n💡 If you're still seeing heartbeats:");
    console.log("   1. Close all browser tabs with the dashboard");
    console.log("   2. Restart the development server");
    console.log("   3. Open a fresh dashboard tab");
  } catch (error) {
    console.error("❌ Error checking connections:", error.message);
  }
}

checkConnections();
