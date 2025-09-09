-- Update sensor_data table for new ESP32 data format
-- Remove old columns and add new ones to match the exact ESP32 structure

-- Drop old columns that are no longer used
ALTER TABLE sensor_data 
DROP COLUMN IF EXISTS ldr_raw,
DROP COLUMN IF EXISTS irradiance,
DROP COLUMN IF EXISTS avg_wind;

-- Add new columns for the updated ESP32 format
ALTER TABLE sensor_data 
ADD COLUMN IF NOT EXISTS light_value INTEGER,
ADD COLUMN IF NOT EXISTS wind_count INTEGER;

-- Rename hour column to match ESP32 format (hr -> hour is already correct)
-- No change needed for hour column

-- Add constraints for new columns
ALTER TABLE sensor_data 
ADD CONSTRAINT check_light_value_range CHECK (light_value >= 0 AND light_value <= 4095),
ADD CONSTRAINT check_wind_count_range CHECK (wind_count >= 0 AND wind_count <= 10000);

-- Drop old constraints
ALTER TABLE sensor_data 
DROP CONSTRAINT IF EXISTS check_ldr_raw_range,
DROP CONSTRAINT IF EXISTS check_irradiance_range,
DROP CONSTRAINT IF EXISTS check_avg_wind_range;

-- Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_sensor_data_light_value ON sensor_data(light_value);
CREATE INDEX IF NOT EXISTS idx_sensor_data_wind_count ON sensor_data(wind_count);

-- Drop old indexes
DROP INDEX IF EXISTS idx_sensor_data_ldr_raw;
DROP INDEX IF EXISTS idx_sensor_data_irradiance;
DROP INDEX IF EXISTS idx_sensor_data_avg_wind;

-- Add comments for documentation
COMMENT ON COLUMN sensor_data.light_value IS 'Light sensor value (0-4095)';
COMMENT ON COLUMN sensor_data.wind_count IS 'Wind sensor count value';

-- Update any existing data if needed (this is safe to run even if no data exists)
-- No data transformation needed as we're starting fresh

-- Verify the schema matches ESP32 format:
-- temperature (number) ✓
-- humidity (number) ✓  
-- bus_voltage (number) ✓
-- current (number) ✓
-- power (number) ✓
-- light_value (number) ✓ - NEW
-- light_status (string) ✓
-- wind_count (number) ✓ - NEW
-- hour (number) ✓
