#!/usr/bin/env node

/**
 * Populate Local Dashboard with AI Predictions
 * Sends sensor data to the local dashboard and tests AI predictions
 */

const LOCAL_URL = "http://localhost:3000/api/sensor";

// Configuration
const TOTAL_ENTRIES = 50; // Smaller amount for testing
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 300; // Longer delay to see AI predictions

/**
 * Generate realistic sensor data with AI predictions
 */
function generateSensorDataWithAI(index) {
  const timestamp = new Date(Date.now() - index * 60 * 1000); // Each entry 1 minute apart
  const hour = timestamp.getHours();

  // Generate power based on time of day
  let power = 0;
  let lightStatus = "night";

  if (hour >= 6 && hour < 18) {
    // Daytime: generate power
    const timeOfDay = hour < 12 ? "morning" : "afternoon";
    const basePower = timeOfDay === "morning" ? 120 : 140;
    power = basePower + (Math.random() - 0.5) * 40;
    lightStatus = hour < 10 ? "bright" : "good";
  }

  // Environmental data
  const temperature = 20 + (hour - 6) * 0.5 + (Math.random() - 0.5) * 5;
  const humidity =
    50 +
    Math.sin(((hour - 6) * Math.PI) / 12) * 20 +
    (Math.random() - 0.5) * 10;
  const windSpeed = Math.max(0, 2 + Math.random() * 8);

  // Basic calculations
  const busVoltage = 5.0 + (Math.random() - 0.5) * 0.5;
  const current = power > 0 ? -(power / busVoltage) : 0;
  const batteryLevel = Math.max(20, 100 - index * 0.5);

  // Calculate efficiencies
  const solarEfficiency = power > 0 ? Math.min(25, (power / 1000) * 100) : 0;
  const windEfficiency =
    windSpeed > 5 ? Math.min(15, (windSpeed / 20) * 100) : 0;
  const totalEfficiency = Math.round((solarEfficiency + windEfficiency) / 2);

  // Calculate energy and cost savings
  const energyHarvested = (power / 1000) * (1 / 3600);
  const costSavings = energyHarvested * 0.12;
  const carbonOffset = energyHarvested * 0.92;

  // Calculate wind power potential
  const potentialWindPower = windSpeed > 3 ? Math.pow(windSpeed, 3) * 0.5 : 0;

  // Connection quality varies
  const connectionQualities = ["excellent", "good", "fair"];
  const connectionQuality = connectionQualities[Math.floor(Math.random() * 3)];

  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    lightStatus: lightStatus,
    windSpeed: Math.round(windSpeed * 10) / 10,
    potentialWindPower: Math.round(potentialWindPower * 10) / 10,
    busVoltage: Math.round(busVoltage * 100) / 100,
    current: Math.round(current * 10) / 10,
    power: Math.round(power * 10) / 10,
    batteryLevel: Math.round(batteryLevel),
    solarEfficiency: Math.round(solarEfficiency * 10) / 10,
    windEfficiency: Math.round(windEfficiency * 10) / 10,
    totalEfficiency: totalEfficiency,
    energyHarvested: Math.round(energyHarvested * 1000000) / 1000000,
    costSavings: Math.round(costSavings * 1000000) / 1000000,
    carbonOffset: Math.round(carbonOffset * 1000000) / 1000000,
    isOnline: true,
    connectionQuality: connectionQuality,
  };
}

/**
 * Send sensor data to the API
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
 * Test AI predictions
 */
async function testAIPredictions() {
  console.log("\n🧪 Testing AI Predictions...");

  try {
    // Test current hour prediction
    const currentResponse = await fetch(`${LOCAL_URL}/ai?type=current`);
    if (currentResponse.ok) {
      const currentPred = await currentResponse.json();
      console.log(
        `✅ Current hour prediction: ${currentPred.predicted_power}mW (${currentPred.source})`
      );
    }

    // Test day forecast
    const dayResponse = await fetch(`${LOCAL_URL}/ai?type=day`);
    if (dayResponse.ok) {
      const dayPred = await dayResponse.json();
      console.log(
        `✅ Day forecast: ${dayPred.forecast?.length} hours predicted`
      );
    }

    // Test specific hour (noon)
    const noonResponse = await fetch(`${LOCAL_URL}/ai?type=hour&hour=12`);
    if (noonResponse.ok) {
      const noonPred = await noonResponse.json();
      console.log(`✅ Noon prediction: ${noonPred.predicted_power}mW`);
    }
  } catch (error) {
    console.error("❌ AI prediction test failed:", error.message);
  }
}

/**
 * Main population function
 */
async function populateWithAI() {
  console.log("🚀 Starting to populate local dashboard with AI predictions...");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < TOTAL_ENTRIES; i += BATCH_SIZE) {
    const batch = [];

    // Create batch of data
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_ENTRIES; j++) {
      const index = i + j;
      const sensorData = generateSensorDataWithAI(index);
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

  console.log(`✅ Population completed!`);
  console.log(`📈 Success: ${successCount}, Errors: ${errorCount}`);

  return { successCount, errorCount };
}

/**
 * Main execution
 */
async function main() {
  console.log("🌞 Energy Harvesting Dashboard - AI-Enhanced Population");
  console.log("=".repeat(60));

  try {
    // Populate dashboard
    const result = await populateWithAI();

    if (result.successCount > 0) {
      console.log("\n🎉 Dashboard populated successfully!");

      // Test AI predictions
      await testAIPredictions();

      console.log("\n🌐 Visit your dashboard: http://localhost:3000");
      console.log(
        '🔍 Check the "AI Solar Predictions" section for mock AI data!'
      );
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

module.exports = { generateSensorDataWithAI, populateWithAI };
