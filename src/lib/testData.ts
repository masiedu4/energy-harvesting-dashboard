import { ESP32SensorData } from "@/types/sensor";

/**
 * Generate realistic test data that matches ESP32 sensor output
 */
export function generateTestSensorData(): ESP32SensorData {
  const now = new Date();
  const hour = now.getHours();

  // Simulate day/night cycle for light status
  const isDaytime = hour >= 6 && hour <= 18;
  const lightStatus = isDaytime
    ? "Light available, good for solar energy"
    : "No light";

  // Simulate realistic temperature variations (day/night cycle)
  const baseTemp = 20; // Base temperature
  const tempVariation = Math.sin(((hour - 6) * Math.PI) / 12) * 8; // ±8°C variation
  const temperature = baseTemp + tempVariation + (Math.random() - 0.5) * 2;

  // Simulate humidity (inverse relationship with temperature)
  const humidity = Math.max(
    30,
    Math.min(90, 70 - tempVariation * 2 + (Math.random() - 0.5) * 10)
  );

  // Simulate wind speed (random with some realistic patterns)
  const windSpeed = Math.max(0, Math.random() * 25 + Math.sin(hour * 0.5) * 5);

  // Simulate wind power potential (based on wind speed)
  const potentialWindPower =
    windSpeed > 3 ? windSpeed * 8 + Math.random() * 20 : 0;

  // Simulate solar power (only during daytime)
  const solarPower = isDaytime
    ? Math.max(
        0,
        Math.sin(((hour - 6) * Math.PI) / 12) * 4000 + Math.random() * 1000
      )
    : 0;

  // Simulate battery voltage (12V system with some variation)
  const busVoltage = 12.0 + (Math.random() - 0.5) * 1.0;

  // Simulate current draw (based on power and voltage)
  const current =
    solarPower > 0 ? (solarPower / busVoltage) * 1000 : Math.random() * 100;

  // Calculate total power
  const power = solarPower + potentialWindPower * 0.1; // Wind power scaled down

  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    lightStatus,
    windSpeed: Math.round(windSpeed * 10) / 10,
    potentialWindPower: Math.round(potentialWindPower * 10) / 10,
    busVoltage: Math.round(busVoltage * 100) / 100,
    current: Math.round(current * 100) / 100,
    power: Math.round(power * 100) / 100,
  };
}

/**
 * Generate a sequence of test data points
 */
export function generateTestDataSequence(count: number): ESP32SensorData[] {
  const data: ESP32SensorData[] = [];

  for (let i = 0; i < count; i++) {
    // Add some time variation to make it more realistic
    const timeOffset = i * 5000; // 5 seconds between readings
    const testTime = new Date(Date.now() - timeOffset);

    const testData = generateTestSensorData();
    data.push(testData);
  }

  return data;
}

/**
 * Simulate real-time data stream for testing
 */
export function startTestDataStream(
  onData: (data: ESP32SensorData) => void,
  interval: number = 5000
): () => void {
  const intervalId = setInterval(() => {
    const testData = generateTestSensorData();
    onData(testData);
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Test data for specific scenarios
 */
export const testScenarios = {
  sunnyDay: (): ESP32SensorData => ({
    temperature: 28.5,
    humidity: 45.2,
    lightStatus: "Light available, good for solar energy",
    windSpeed: 8.3,
    potentialWindPower: 66.4,
    busVoltage: 12.45,
    current: 245.67,
    power: 3056.78,
  }),

  cloudyDay: (): ESP32SensorData => ({
    temperature: 22.1,
    humidity: 68.7,
    lightStatus: "Light available, good for solar energy",
    windSpeed: 12.5,
    potentialWindPower: 100.0,
    busVoltage: 12.12,
    current: 156.23,
    power: 1893.45,
  }),

  windyDay: (): ESP32SensorData => ({
    temperature: 18.9,
    humidity: 55.3,
    lightStatus: "Light available, good for solar energy",
    windSpeed: 25.7,
    potentialWindPower: 205.6,
    busVoltage: 12.78,
    current: 189.45,
    power: 2421.23,
  }),

  nightTime: (): ESP32SensorData => ({
    temperature: 15.2,
    humidity: 78.9,
    lightStatus: "No light",
    windSpeed: 3.1,
    potentialWindPower: 24.8,
    busVoltage: 11.95,
    current: 23.45,
    power: 280.23,
  }),

  lowBattery: (): ESP32SensorData => ({
    temperature: 24.7,
    humidity: 62.1,
    lightStatus: "Light available, good for solar energy",
    windSpeed: 5.2,
    potentialWindPower: 41.6,
    busVoltage: 10.8,
    current: 89.12,
    power: 962.45,
  }),
};
