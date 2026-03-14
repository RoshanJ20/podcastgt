/**
 * @module supabase/server
 *
 * Creates Supabase clients for server-side usage (API routes, Server Components).
 *
 * Key responsibilities:
 * - Provide a session-aware server client that reads/writes auth cookies.
 * - Provide a service-role client for admin operations that bypass RLS.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Create a session-aware Supabase server client.
 *
 * Reads auth cookies from the incoming request and writes updated cookies
 * on token refresh. The `setAll` catch block is intentional: in Server Components
 * the cookie store is read-only, so mutation attempts are silently ignored.
 *
 * @returns A Supabase server client bound to the current user's session.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components have a read-only cookie store; mutation is expected to fail here
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client with the service role key for admin operations.
 *
 * This client bypasses Row Level Security and should only be used for
 * operations that require elevated privileges (e.g. listing auth users,
 * writing to storage buckets).
 *
 * @returns A Supabase client authenticated with the service role key.
 */
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
