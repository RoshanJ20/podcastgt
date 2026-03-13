import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Returns a signed upload URL for direct client-to-Supabase storage uploads
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucket, path, contentType } = await request.json()

  const ALLOWED_BUCKETS = ['audio', 'thumbnails', 'bulletins']
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Use service client for storage operations (bypasses RLS on storage)
  const serviceClient = await createServiceClient()

  const { data, error } = await serviceClient.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
  })
}
