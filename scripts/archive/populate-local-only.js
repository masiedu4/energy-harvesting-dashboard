#!/usr/bin/env node

/**
 * Local Dashboard Population Script
 * Sends 100 mock sensor data entries to populate the local dashboard
 * Uses simplified data structure for local testing
 */

const LOCAL_URL = "http://localhost:3000/api/sensor";

// Configuration
const TOTAL_ENTRIES = 100; // Smaller amount for local testing
const BATCH_SIZE = 5; // Smaller batches
const DELAY_BETWEEN_BATCHES = 200; // Longer delay

// Time range: Last 7 days
const START_TIME = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const END_TIME = new Date();

/**
 * Generate simplified sensor data for local testing
 */
function generateSimpleSensorData(index) {
  const timestamp = new Date(
    START_TIME.getTime() +
      (index * (END_TIME.getTime() - START_TIME.getTime())) / TOTAL_ENTRIES
  );
  const hour = timestamp.getHours();

  // Simple time-based power generation
  let power = 0;
  let lightStatus = "night";

  if (hour >= 6 && hour < 18) {
    // Daytime: generate power
    const timeOfDay = hour < 12 ? "morning" : "afternoon";
    const basePower = timeOfDay === "morning" ? 120 : 140;
    power = basePower + (Math.random() - 0.5) * 40;
    lightStatus = hour < 10 ? "bright" : "good";
  }

  // Simple environmental data
  const temperature = 20 + (hour - 6) * 0.5 + (Math.random() - 0.5) * 5;
  const humidity =
    50 + Math.sin((hour / 24) * Math.PI) * 20 + (Math.random() - 0.5) * 10;
  const windSpeed = Math.max(0, 2 + Math.random() * 8);

  // Basic calculations
  const busVoltage = 5.0;
  const current = power > 0 ? -(power / busVoltage) : 0;
  const batteryLevel = Math.max(20, 100 - index * 0.3);

  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    lightStatus: lightStatus,
    windSpeed: Math.round(windSpeed * 10) / 10,
    potentialWindPower: Math.round(Math.pow(windSpeed, 3) * 0.5 * 10) / 10,
    busVoltage: busVoltage,
    current: Math.round(current * 10) / 10,
    power: Math.round(power * 10) / 10,
    batteryLevel: Math.round(batteryLevel),
    solarEfficiency: power > 0 ? Math.min(25, (power / 1000) * 100) : 0,
    windEfficiency: windSpeed > 5 ? Math.min(15, (windSpeed / 20) * 100) : 0,
    totalEfficiency: Math.round(
      (power > 0
        ? Math.min(25, (power / 1000) * 100)
        : 0 + (windSpeed > 5 ? Math.min(15, (windSpeed / 20) * 100) : 0)) / 2
    ),
    energyHarvested: (power / 1000) * (1 / 3600),
    costSavings: (power / 1000) * (1 / 3600) * 0.12,
    carbonOffset: (power / 1000) * (1 / 3600) * 0.92,
    isOnline: true,
    connectionQuality: "excellent",
  };
}

/**
 * Send data to the local API
 */
async function sendSensorData(sensorData) {
  try {
    const response = await fetch(LOCAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText.substring(0, 100)}`
      );
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main population function
 */
async function populateLocalDashboard() {
  console.log(
    "🚀 Starting to populate local dashboard with",
    TOTAL_ENTRIES,
    "entries..."
  );

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < TOTAL_ENTRIES; i += BATCH_SIZE) {
    const batch = [];

    // Create batch of data
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_ENTRIES; j++) {
      const index = i + j;
      const sensorData = generateSimpleSensorData(index);
      batch.push(sensorData);
    }

    // Send batch
    const promises = batch.map((sensorData) => sendSensorData(sensorData));

    try {
      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Error: ${result.error}`);
        }
      });

      // Progress update
      const progress = Math.round(((i + BATCH_SIZE) / TOTAL_ENTRIES) * 100);
      console.log(
        `📊 Progress: ${progress}% (${successCount} success, ${errorCount} errors)`
      );

      // Delay between batches
      if (i + BATCH_SIZE < TOTAL_ENTRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    } catch (error) {
      console.error(`❌ Batch error: ${error.message}`);
      errorCount += batch.length;
    }
  }

  console.log(`✅ Local population completed!`);
  console.log(`📈 Success: ${successCount}, Errors: ${errorCount}`);

  return { successCount, errorCount };
}

/**
 * Main execution
 */
async function main() {
  console.log("🌞 Energy Harvesting Dashboard - Local Mock Data Population");
  console.log("=".repeat(60));

  try {
    const result = await populateLocalDashboard();
    console.log("\n📊 Final Summary:");
    console.log(
      `Local: ${result.successCount} success, ${result.errorCount} errors`
    );

    if (result.successCount > 0) {
      console.log("\n🎉 Success! Your local dashboard should now have data.");
      console.log("🌐 Visit: http://localhost:3000");
    } else {
      console.log(
        "\n❌ No data was successfully added. Check the errors above."
      );
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSimpleSensorData, populateLocalDashboard };
