import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create a function to get the Supabase client
// This prevents the client from being created during build time
export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not found");
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export a default client for convenience (only when env vars are available)
export const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
})();

// Database table types
export interface SensorDataRow {
  id: string;
  device_id: string;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  light_status: string | null;
  wind_speed: number | null;
  potential_wind_power: number | null;
  bus_voltage: number | null;
  current: number | null;
  power: number | null;
  battery_level: number | null;
  solar_efficiency: number | null;
  wind_efficiency: number | null;
  total_efficiency: number | null;
  energy_harvested: number | null;
  cost_savings: number | null;
  carbon_offset: number | null;
  is_online: boolean | null;
  connection_quality: string | null;
  created_at: string;
}

export interface DeviceStatusRow {
  id: string;
  device_id: string;
  is_online: boolean;
  last_seen: string;
  battery_level: number;
  connection_quality: string;
  created_at: string;
  updated_at: string;
}
