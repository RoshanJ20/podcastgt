/**
 * @module upload
 *
 * Client-side utilities for uploading files to Supabase storage via signed URLs.
 *
 * Key responsibilities:
 * - Request a signed upload URL from the backend.
 * - Upload the file with optional progress tracking via XMLHttpRequest.
 * - Provide filename manipulation helpers for display and path construction.
 */

/**
 * Upload a file to Supabase storage using a signed URL from the backend.
 *
 * Supports optional progress tracking via XMLHttpRequest. Falls back to
 * a simpler `fetch` PUT when no progress callback is provided.
 *
 * @param file - The File object to upload.
 * @param bucket - The storage bucket name (e.g. 'audio', 'thumbnails', 'bulletins').
 * @param pathPrefix - Directory prefix within the bucket.
 * @param onProgress - Optional callback receiving upload percentage (0–100).
 * @returns The public URL of the uploaded file.
 * @throws Error if the signed URL request or the file upload fails.
 */
export async function uploadFile(
  file: File,
  bucket: string,
  pathPrefix: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const extension = file.name.split('.').pop()
  const storagePath = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const signedUrlResponse = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path: storagePath, contentType: file.type }),
  })

  if (!signedUrlResponse.ok) {
    const errorBody = await signedUrlResponse.json().catch(() => ({ error: 'Failed to get upload URL' }))
    throw new Error(errorBody.error ?? `Upload failed (${signedUrlResponse.status})`)
  }

  const { signedUrl, publicUrl } = await signedUrlResponse.json()

  if (onProgress) {
    await uploadWithProgress(signedUrl, file, onProgress)
  } else {
    await uploadWithFetch(signedUrl, file)
  }

  return publicUrl
}

/**
 * Upload a file using XMLHttpRequest to enable progress tracking.
 *
 * @param signedUrl - The pre-signed upload URL.
 * @param file - The File object to upload.
 * @param onProgress - Callback receiving upload percentage (0–100).
 * @throws Error if the upload fails or the server returns a non-2xx status.
 */
function uploadWithProgress(signedUrl: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`File upload failed (${xhr.status})`))
    })
    xhr.addEventListener('error', () => reject(new Error('File upload failed')))
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Upload a file using a simple fetch PUT (no progress tracking).
 *
 * @param signedUrl - The pre-signed upload URL.
 * @param file - The File object to upload.
 * @throws Error if the server returns a non-ok status.
 */
async function uploadWithFetch(signedUrl: string, file: File): Promise<void> {
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!uploadResponse.ok) {
    throw new Error(`File upload failed (${uploadResponse.status})`)
  }
}

/**
 * Format a byte count into a human-readable file size string.
 *
 * @param bytes - The file size in bytes.
 * @returns A formatted string like "1.2 MB" or "512 B".
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Convert a filename to a human-readable title.
 *
 * Strips the file extension, replaces dashes/underscores with spaces,
 * and applies title case.
 *
 * @param filename - The original filename (e.g. "my-podcast_ep1.mp3").
 * @returns A formatted title string (e.g. "My Podcast Ep1").
 */
export function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

/**
 * Extract the stem (name without extension) from a filename, lowercased.
 *
 * @param filename - The original filename (e.g. "MyFile.pdf").
 * @returns The lowercase stem (e.g. "myfile").
 */
export function filenameStem(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').toLowerCase().trim()
}
