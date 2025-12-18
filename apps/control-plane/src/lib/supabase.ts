import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration and initialization
 * 
 * This module provides two types of Supabase clients:
 * 1. Admin client - uses service_role key for server-side operations with full access
 * 2. User client - uses anon key for user-scoped operations with RLS policies
 */

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Admin Supabase client with service_role key
 * Use this for server-side operations that need to bypass RLS policies
 * WARNING: This client has full database access - use with caution
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * User-scoped Supabase client with anon key
 * Use this for operations that should respect RLS policies
 * This is safer for user-initiated operations
 */
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client with a specific user's JWT token
 * Use this when you need to perform operations on behalf of a specific user
 * 
 * @param accessToken - The user's JWT access token
 * @returns A Supabase client configured for the specific user
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify a user's JWT token and return the user ID
 * 
 * @param accessToken - The JWT token to verify
 * @returns The user object if valid, null otherwise
 */
export async function verifyUserToken(accessToken: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  
  if (error || !data.user) {
    return null;
  }
  
  return data.user;
}

