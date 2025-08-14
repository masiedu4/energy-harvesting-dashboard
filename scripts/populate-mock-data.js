#!/usr/bin/env node

/**
 * Mock Data Population Script
 * Sends 1000 realistic sensor data entries to populate the dashboard
 * Includes AI predictions and varied environmental conditions
 */

const PRODUCTION_URL =
  "https://energy-harvesting-dashboard.vercel.app/api/sensor";
const LOCAL_URL = "http://localhost:3000/api/sensor";

// Configuration
const TOTAL_ENTRIES = 1000;
const BATCH_SIZE = 10; // Send in batches to avoid overwhelming the server
const DELAY_BETWEEN_BATCHES = 100; // ms

// Time range: Last 30 days
const START_TIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const END_TIME = new Date();

// Environmental conditions for different times of day
const timeBasedConditions = {
  morning: { lightStatus: "bright", avgPower: 120, avgEfficiency: 12 },
  noon: { lightStatus: "bright", avgPower: 180, avgEfficiency: 18 },
  afternoon: { lightStatus: "good", avgPower: 140, avgEfficiency: 14 },
  evening: { lightStatus: "moderate", avgPower: 80, avgEfficiency: 8 },
  night: { lightStatus: "night", avgPower: 0, avgEfficiency: 0 },
};

// Weather patterns for different days
const weatherPatterns = [
  {
    name: "sunny",
    tempRange: [25, 35],
    humidityRange: [40, 60],
    windRange: [0, 5],
    powerMultiplier: 1.2,
  },
  {
    name: "partly_cloudy",
    tempRange: [22, 30],
    humidityRange: [50, 70],
    windRange: [2, 8],
    powerMultiplier: 1.0,
  },
  {
    name: "cloudy",
    tempRange: [20, 28],
    humidityRange: [60, 80],
    windRange: [5, 12],
    powerMultiplier: 0.7,
  },
  {
    name: "rainy",
    tempRange: [18, 25],
    humidityRange: [75, 95],
    windRange: [8, 20],
    powerMultiplier: 0.4,
  },
  {
    name: "windy",
    tempRange: [20, 30],
    humidityRange: [45, 65],
    windRange: [15, 30],
    powerMultiplier: 0.8,
  },
];

/**
 * Generate realistic sensor data
 */
function generateMockSensorData(index) {
  const timestamp = new Date(
    START_TIME.getTime() +
      (index * (END_TIME.getTime() - START_TIME.getTime())) / TOTAL_ENTRIES
  );
  const hour = timestamp.getHours();

  // Determine time of day
  let timeOfDay;
  if (hour >= 6 && hour < 10) timeOfDay = "morning";
  else if (hour >= 10 && hour < 14) timeOfDay = "noon";
  else if (hour >= 14 && hour < 18) timeOfDay = "afternoon";
  else if (hour >= 18 && hour < 22) timeOfDay = "evening";
  else timeOfDay = "night";

  // Select weather pattern (cycle through patterns)
  const weatherPattern = weatherPatterns[index % weatherPatterns.length];

  // Generate base values
  const baseTemp =
    (weatherPattern.tempRange[0] + weatherPattern.tempRange[1]) / 2;
  const baseHumidity =
    (weatherPattern.humidityRange[0] + weatherPattern.humidityRange[1]) / 2;
  const baseWind =
    (weatherPattern.windRange[0] + weatherPattern.windRange[1]) / 2;

  // Add realistic variations
  const temperature = baseTemp + (Math.random() - 0.5) * 6;
  const humidity = Math.max(
    20,
    Math.min(95, baseHumidity + (Math.random() - 0.5) * 20)
  );
  const windSpeed = Math.max(0, baseWind + (Math.random() - 0.5) * 8);

  // Calculate power based on conditions
  const basePower =
    timeBasedConditions[timeOfDay].avgPower * weatherPattern.powerMultiplier;
  const power = Math.max(0, basePower + (Math.random() - 0.5) * 40);

  // Calculate derived values
  const busVoltage = 5.0 + (Math.random() - 0.5) * 0.5;
  const current = power > 0 ? -(power / busVoltage) : 0;
  const batteryLevel = Math.max(20, 100 - index * 0.05); // Gradual battery drain

  // Calculate efficiencies
  const solarEfficiency = power > 0 ? Math.min(25, (power / 1000) * 100) : 0;
  const windEfficiency =
    windSpeed > 5 ? Math.min(15, (windSpeed / 20) * 100) : 0;
  const totalEfficiency = Math.round((solarEfficiency + windEfficiency) / 2);

  // Calculate energy and cost savings
  const energyHarvested = (power / 1000) * (1 / 3600); // kWh per second
  const costSavings = energyHarvested * 0.12; // $0.12 per kWh
  const carbonOffset = energyHarvested * 0.92; // kg CO2 per kWh

  // Determine light status based on conditions
  let lightStatus;
  if (timeOfDay === "night") lightStatus = "night";
  else if (weatherPattern.name === "sunny") lightStatus = "bright";
  else if (weatherPattern.name === "partly_cloudy") lightStatus = "good";
  else if (weatherPattern.name === "cloudy") lightStatus = "moderate";
  else lightStatus = "low";

  // Calculate wind power potential
  const potentialWindPower = windSpeed > 3 ? Math.pow(windSpeed, 3) * 0.5 : 0;

  // Connection quality varies slightly
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
 * Generate AI prediction for the sensor data
 */
function generateAIPrediction(sensorData, timestamp) {
  const hour = timestamp.getHours();

  // Skip predictions for night time
  if (hour >= 18 || hour < 6) {
    return {
      source: "mock-ai-night",
      temperature: sensorData.temperature,
      irradiance: 0,
      humidity: sensorData.humidity,
      hr: hour,
      hr_sin: Math.sin((2 * Math.PI * hour) / 24),
      hr_cos: Math.cos((2 * Math.PI * hour) / 24),
      predicted_power: 0,
    };
  }

  // Calculate irradiance from light status
  const irradianceMap = {
    bright: 800,
    good: 600,
    moderate: 400,
    low: 200,
    night: 0,
  };

  const irradiance = irradianceMap[sensorData.lightStatus] || 400;

  // Simple physics-based prediction
  const basePower = (irradiance / 1000) * 20; // 20W panel
  const tempEffect = 1 + 0.004 * (sensorData.temperature - 25); // Temperature coefficient
  const humidityEffect = 1 - (sensorData.humidity / 100) * 0.1; // Humidity effect

  let predictedPower = basePower * tempEffect * humidityEffect;

  // Add some realistic variation
  predictedPower = predictedPower * (0.8 + Math.random() * 0.4);

  return {
    source: "mock-ai-prediction",
    temperature: sensorData.temperature,
    irradiance: irradiance,
    humidity: sensorData.humidity,
    hr: hour,
    hr_sin: Math.sin((2 * Math.PI * hour) / 24),
    hr_cos: Math.cos((2 * Math.PI * hour) / 24),
    predicted_power: Math.max(0, Math.round(predictedPower * 100) / 100),
  };
}

/**
 * Send data to the API
 */
async function sendSensorData(url, sensorData, aiPrediction) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...sensorData,
        aiPrediction: aiPrediction,
        predictionAccuracy:
          aiPrediction.predicted_power > 0
            ? Math.max(
                0,
                100 -
                  (Math.abs(sensorData.power - aiPrediction.predicted_power) /
                    aiPrediction.predicted_power) *
                    100
              )
            : 100,
        efficiencyVsPrediction:
          aiPrediction.predicted_power > 0
            ? sensorData.totalEfficiency -
              (sensorData.power / aiPrediction.predicted_power) * 100
            : 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
async function populateDashboard(targetUrl, label) {
  console.log(
    `🚀 Starting to populate ${label} dashboard with ${TOTAL_ENTRIES} entries...`
  );

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < TOTAL_ENTRIES; i += BATCH_SIZE) {
    const batch = [];

    // Create batch of data
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_ENTRIES; j++) {
      const index = i + j;
      const sensorData = generateMockSensorData(index);
      const timestamp = new Date(
        START_TIME.getTime() +
          (index * (END_TIME.getTime() - START_TIME.getTime())) / TOTAL_ENTRIES
      );
      const aiPrediction = generateAIPrediction(sensorData, timestamp);

      batch.push({ sensorData, aiPrediction, timestamp });
    }

    // Send batch
    const promises = batch.map(({ sensorData, aiPrediction }) =>
      sendSensorData(targetUrl, sensorData, aiPrediction)
    );

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
        `📊 ${label} Progress: ${progress}% (${successCount} success, ${errorCount} errors)`
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

  console.log(`✅ ${label} Population completed!`);
  console.log(`📈 Success: ${successCount}, Errors: ${errorCount}`);

  return { successCount, errorCount };
}

/**
 * Main execution
 */
async function main() {
  console.log("🌞 Energy Harvesting Dashboard - Mock Data Population");
  console.log("=".repeat(60));

  try {
    // Populate production dashboard
    console.log("\n🎯 Targeting Production Dashboard...");
    const productionResult = await populateDashboard(
      PRODUCTION_URL,
      "Production"
    );

    // Populate local dashboard (if available)
    console.log("\n🏠 Targeting Local Dashboard...");
    try {
      const localResult = await populateDashboard(LOCAL_URL, "Local");
      console.log("\n📊 Final Summary:");
      console.log(
        `Production: ${productionResult.successCount} success, ${productionResult.errorCount} errors`
      );
      console.log(
        `Local: ${localResult.successCount} success, ${localResult.errorCount} errors`
      );
    } catch (error) {
      console.log("⚠️  Local dashboard not available, skipping...");
      console.log("\n📊 Final Summary:");
      console.log(
        `Production: ${productionResult.successCount} success, ${productionResult.errorCount} errors`
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

module.exports = {
  generateMockSensorData,
  generateAIPrediction,
  populateDashboard,
};
