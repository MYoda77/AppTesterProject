import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a fresh Supabase client for the given URL/anon key pair.
 * Kept as a plain factory (not a singleton) because the Settings tab lets
 * the user swap projects at runtime while testing.
 */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export async function fetchTableRows(
  client: SupabaseClient,
  table: string,
  limit = 20
) {
  const { data, error } = await client.from(table).select('*').limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function insertTableRow(
  client: SupabaseClient,
  table: string,
  row: Record<string, unknown>
) {
  const { data, error } = await client.from(table).insert(row).select();
  if (error) throw error;
  return data ?? [];
}
