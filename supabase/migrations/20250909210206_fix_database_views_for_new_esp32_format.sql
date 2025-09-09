-- Fix database views to work with new ESP32 format
-- This migration updates the views to use the new column names and structure

-- First, drop the existing views that depend on old columns
DROP VIEW IF EXISTS recent_sensor_data;
DROP VIEW IF EXISTS hourly_averages;

-- Add missing columns for the new ESP32 format
ALTER TABLE sensor_data 
ADD COLUMN IF NOT EXISTS light_value INTEGER,
ADD COLUMN IF NOT EXISTS wind_count INTEGER,
ADD COLUMN IF NOT EXISTS hr INTEGER;

-- Add AI prediction columns
ALTER TABLE sensor_data 
ADD COLUMN IF NOT EXISTS ai_prediction JSONB,
ADD COLUMN IF NOT EXISTS prediction_accuracy DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS efficiency_vs_prediction DECIMAL(5,2);

-- Drop old columns that are no longer used (now safe since views are dropped)
ALTER TABLE sensor_data 
DROP COLUMN IF EXISTS wind_speed,
DROP COLUMN IF EXISTS potential_wind_power,
DROP COLUMN IF EXISTS ldr_raw,
DROP COLUMN IF EXISTS irradiance,
DROP COLUMN IF EXISTS avg_wind,
DROP COLUMN IF EXISTS hour;

-- Add constraints for new columns (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_light_value_range') THEN
        ALTER TABLE sensor_data ADD CONSTRAINT check_light_value_range CHECK (light_value >= 0 AND light_value <= 4095);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_wind_count_range') THEN
        ALTER TABLE sensor_data ADD CONSTRAINT check_wind_count_range CHECK (wind_count >= 0 AND wind_count <= 1000);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_hr_range') THEN
        ALTER TABLE sensor_data ADD CONSTRAINT check_hr_range CHECK (hr >= 0 AND hr <= 23);
    END IF;
END $$;

-- Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_sensor_data_light_value ON sensor_data(light_value);
CREATE INDEX IF NOT EXISTS idx_sensor_data_wind_count ON sensor_data(wind_count);
CREATE INDEX IF NOT EXISTS idx_sensor_data_hr ON sensor_data(hr);
CREATE INDEX IF NOT EXISTS idx_sensor_data_ai_prediction ON sensor_data USING GIN(ai_prediction);

-- Recreate the recent_sensor_data view with new structure
CREATE OR REPLACE VIEW recent_sensor_data AS
SELECT * FROM sensor_data 
ORDER BY timestamp DESC 
LIMIT 200;

-- Recreate the hourly_averages view with new structure
CREATE OR REPLACE VIEW hourly_averages AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  device_id,
  AVG(temperature) as avg_temperature,
  AVG(humidity) as avg_humidity,
  AVG(power) as avg_power,
  AVG(light_value) as avg_light_value,
  AVG(wind_count) as avg_wind_count,
  AVG(solar_efficiency) as avg_solar_efficiency,
  AVG(wind_efficiency) as avg_wind_efficiency,
  AVG(total_efficiency) as avg_total_efficiency,
  SUM(energy_harvested) as total_energy_harvested,
  SUM(cost_savings) as total_cost_savings,
  SUM(carbon_offset) as total_carbon_offset
FROM sensor_data 
GROUP BY DATE_TRUNC('hour', timestamp), device_id
ORDER BY hour DESC;

-- Add comments for documentation
COMMENT ON COLUMN sensor_data.light_value IS 'Light sensor reading (0-4095)';
COMMENT ON COLUMN sensor_data.wind_count IS 'Wind count from anemometer';
COMMENT ON COLUMN sensor_data.hr IS 'Hour of the day (0-23)';
COMMENT ON COLUMN sensor_data.ai_prediction IS 'AI prediction data as JSON';
COMMENT ON COLUMN sensor_data.prediction_accuracy IS 'AI prediction accuracy percentage';
COMMENT ON COLUMN sensor_data.efficiency_vs_prediction IS 'Actual efficiency vs AI prediction';
