/**
 * @module auth/callback
 *
 * Handles the OAuth/magic-link callback from Supabase Auth.
 *
 * Key responsibilities:
 * - Exchange the authorization code for a session.
 * - Redirect the user to their intended destination or a fallback.
 * - Validate the redirect target to prevent open-redirect vulnerabilities.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Allowed redirect path prefixes to prevent open-redirect attacks. */
const ALLOWED_REDIRECT_PREFIXES = ['/', '/admin', '/podcast', '/learning-path', '/profile', '/progress']

/**
 * Check whether a redirect path is safe (relative and within known prefixes).
 *
 * @param path - The redirect path to validate.
 * @returns `true` if the path is a safe relative redirect target.
 */
function isSafeRedirectPath(path: string): boolean {
  // Must be a relative path (no protocol or double-slash to prevent //evil.com)
  if (path.includes('://') || path.startsWith('//')) {
    return false
  }
  return ALLOWED_REDIRECT_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * Process the auth callback by exchanging the code for a session and redirecting.
 *
 * @param request - Incoming callback request with `code` and optional `redirectTo` query params.
 * @returns A redirect response to the target page or the login page on failure.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const authCode = searchParams.get('code')
  const requestedRedirect = searchParams.get('redirectTo') ?? '/'

  // Validate redirect target to prevent open-redirect attacks
  const safeRedirectPath = isSafeRedirectPath(requestedRedirect) ? requestedRedirect : '/'

  if (authCode) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${safeRedirectPath}`)
    }
    console.error('[Auth] Code exchange failed:', exchangeError.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
