/**
 * @module api/upload
 *
 * Generates signed upload URLs for direct client-to-Supabase storage uploads.
 *
 * Key responsibilities:
 * - Validate the requested storage bucket against an allowlist.
 * - Generate a time-limited signed upload URL via the Supabase service client.
 * - Return the signed URL and the resulting public URL for the uploaded file.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/** Storage buckets that clients are permitted to upload to. */
const ALLOWED_BUCKETS = ['audio', 'thumbnails', 'bulletins'] as const

/**
 * Generate a signed upload URL for a specific storage bucket and path.
 *
 * @param request - JSON body with `bucket` (required, must be in allowlist),
 *                  `path` (required, target file path), and `contentType` (optional MIME type).
 * @returns JSON with `signedUrl`, `token`, `path`, and `publicUrl`.
 * @throws 401 if user is not authenticated.
 * @throws 400 if the bucket is not in the allowlist or path is missing.
 * @throws 500 if the signed URL generation fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { bucket, path: filePath, contentType } = await request.json()

  if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
    return validationErrorResponse(`bucket must be one of: ${ALLOWED_BUCKETS.join(', ')}`)
  }
  if (!filePath || typeof filePath !== 'string') {
    return validationErrorResponse('path is required and must be a string')
  }

  // Use service client for storage operations (bypasses RLS on storage)
  const serviceClient = await createServiceClient()

  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from(bucket)
    .createSignedUploadUrl(filePath)

  if (uploadError) return internalErrorResponse('generate upload URL', uploadError)

  return NextResponse.json({
    signedUrl: uploadData.signedUrl,
    token: uploadData.token,
    path: uploadData.path,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`,
  })
}
