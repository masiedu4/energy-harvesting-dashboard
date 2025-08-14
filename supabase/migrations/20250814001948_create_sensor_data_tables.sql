-- Create sensor_data table to store all sensor readings
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  light_status VARCHAR(100),
  wind_speed DECIMAL(6,2),
  potential_wind_power DECIMAL(8,2),
  bus_voltage DECIMAL(6,2),
  current DECIMAL(8,2),
  power DECIMAL(10,2),
  battery_level INTEGER,
  solar_efficiency DECIMAL(5,2),
  wind_efficiency DECIMAL(5,2),
  total_efficiency DECIMAL(5,2),
  energy_harvested DECIMAL(10,4),
  cost_savings DECIMAL(8,4),
  carbon_offset DECIMAL(8,4),
  is_online BOOLEAN DEFAULT true,
  connection_quality VARCHAR(20) DEFAULT 'good',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_status table to track device health
CREATE TABLE IF NOT EXISTS device_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  battery_level INTEGER DEFAULT 0,
  connection_quality VARCHAR(20) DEFAULT 'poor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_id ON sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_temperature ON sensor_data(temperature);
CREATE INDEX IF NOT EXISTS idx_sensor_data_power ON sensor_data(power);
CREATE INDEX IF NOT EXISTS idx_sensor_data_efficiency ON sensor_data(total_efficiency);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_device_status_updated_at 
  BEFORE UPDATE ON device_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for recent sensor data (last 200 readings)
CREATE OR REPLACE VIEW recent_sensor_data AS
SELECT * FROM sensor_data 
ORDER BY timestamp DESC 
LIMIT 200;

-- Create a view for hourly averages
CREATE OR REPLACE VIEW hourly_averages AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  device_id,
  AVG(temperature) as avg_temperature,
  AVG(humidity) as avg_humidity,
  AVG(power) as avg_power,
  AVG(wind_speed) as avg_wind_speed,
  AVG(solar_efficiency) as avg_solar_efficiency,
  AVG(wind_efficiency) as avg_wind_efficiency,
  AVG(total_efficiency) as avg_total_efficiency,
  SUM(energy_harvested) as total_energy_harvested,
  SUM(cost_savings) as total_cost_savings,
  SUM(carbon_offset) as total_carbon_offset
FROM sensor_data 
GROUP BY DATE_TRUNC('hour', timestamp), device_id
ORDER BY hour DESC;

-- Insert initial device status for ESP32_001
INSERT INTO device_status (device_id, is_online, last_seen, battery_level, connection_quality)
VALUES ('ESP32_001', false, NOW(), 0, 'poor')
ON CONFLICT (device_id) DO NOTHING;
