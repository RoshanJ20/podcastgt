/**
 * @module supabase/client
 *
 * Creates a Supabase client for browser-side (client component) usage.
 *
 * Key responsibilities:
 * - Initialize the Supabase browser client with public environment variables.
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in browser/client components.
 *
 * @returns A Supabase browser client configured with public URL and anon key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
