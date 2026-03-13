export async function uploadFile(
  file: File,
  bucket: string,
  pathPrefix: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, contentType: file.type }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get upload URL' }))
    throw new Error(err.error ?? `Upload failed (${res.status})`)
  }

  const { signedUrl, publicUrl } = await res.json()

  if (onProgress) {
    // Use XMLHttpRequest for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
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
  } else {
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) {
      throw new Error(`File upload failed (${uploadRes.status})`)
    }
  }

  return publicUrl
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[-_]+/g, ' ')  // replace dashes/underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case
    .trim()
}

export function filenameStem(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').toLowerCase().trim()
}
