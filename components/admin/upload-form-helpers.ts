/**
 * @module upload-form-helpers
 * Helper functions for the UploadForm submit flow.
 * Extracts file-upload orchestration and API persistence logic
 * so the main form component stays focused on UI concerns.
 */

import type { Dispatch, SetStateAction } from 'react'
import { uploadFile } from '@/lib/upload'
import type { UploadFiles, FormValues } from './upload-form-types'

type ProgressSetter = Dispatch<SetStateAction<Record<string, number>>>

/** Result of uploading all files — single-value URLs plus bulletin URL array. */
export interface UploadResult {
  urls: Record<string, string>
  bulletinUrls: string[]
}

/** Upload all selected files and return the resulting URL payload fields. */
export async function uploadAllFiles(
  files: UploadFiles,
  setUploadProgress: ProgressSetter
): Promise<UploadResult> {
  const urls: Record<string, string> = {}

  const uploads: {
    key: string
    file: File | undefined
    bucket: string
    folder: string
    field: string
  }[] = [
    { key: 'thumbnail', file: files.thumbnail[0], bucket: 'thumbnails', folder: 'covers', field: 'thumbnail_url' },
    { key: 'audioShort', file: files.audioShort[0], bucket: 'audio', folder: 'short', field: 'audio_short_url' },
    { key: 'audioLong', file: files.audioLong[0], bucket: 'audio', folder: 'long', field: 'audio_long_url' },
  ]

  for (const { key, file, bucket, folder, field } of uploads) {
    if (!file) continue
    setUploadProgress((p) => ({ ...p, [key]: 0 }))
    urls[field] = await uploadFile(file, bucket, folder, (pct) =>
      setUploadProgress((p) => ({ ...p, [key]: pct }))
    )
  }

  // Upload multiple bulletin PDFs
  const bulletinUrls: string[] = []
  for (let i = 0; i < files.bulletin.length; i++) {
    const file = files.bulletin[i]
    const key = files.bulletin.length === 1 ? 'bulletin' : `bulletin_${i}`
    setUploadProgress((p) => ({ ...p, [key]: 0 }))
    const url = await uploadFile(file, 'bulletins', 'pdfs', (pct) =>
      setUploadProgress((p) => ({ ...p, [key]: pct }))
    )
    bulletinUrls.push(url)
  }

  return { urls, bulletinUrls }
}

/** Persist the bulletin (create or update) and optionally upload the transcript. */
export async function saveBulletin(
  formValues: FormValues,
  uploadResult: UploadResult,
  files: UploadFiles,
  editId?: string
): Promise<{ id: string; title: string | null; thumbnail_url: string | null; domain: string | null }> {
  const payload: Record<string, unknown> = { ...formValues, ...uploadResult.urls }
  if (uploadResult.bulletinUrls.length > 0) {
    payload.bulletin_urls = uploadResult.bulletinUrls
  }

  const url = editId ? `/api/podcasts/${editId}` : '/api/podcasts'
  const method = editId ? 'PATCH' : 'POST'

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to save bulletin')
  }

  const podcast = await res.json()

  const transcriptUploads: [keyof UploadFiles, string][] = [
    ['transcriptShort', 'short'],
    ['transcriptLong', 'long'],
  ]
  for (const [key, type] of transcriptUploads) {
    const file = files[key][0]
    if (file) {
      const text = await file.text()
      await fetch(`/api/podcasts/${podcast.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_text: text, transcript_type: type }),
      })
    }
  }

  return podcast
}
