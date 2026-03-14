/**
 * @module upload-form-types
 * Shared types, Zod schema, and constants for the multi-step UploadForm.
 * Centralises form validation rules and type definitions used across
 * all UploadForm sub-components.
 */

import { z } from 'zod'
import type { Domain, ContentType } from '@/lib/supabase/types'

export const uploadFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  content_type: z.enum(['technical', 'learning_series']).optional(),
  tags: z.array(z.string()),
})

export type FormValues = z.infer<typeof uploadFormSchema>

export interface UploadFormProps {
  editPodcast?: {
    id: string
    title: string | null
    description: string | null
    domain: Domain | null
    year: number | null
    content_type: ContentType | null
    tags: string[]
  }
  onSuccess?: (podcast: {
    id: string
    title: string | null
    thumbnail_url: string | null
    domain: string | null
  }) => void
}

export interface UploadFiles {
  thumbnail: File[]
  audioShort: File[]
  audioLong: File[]
  bulletin: File[]
  transcriptShort: File[]
  transcriptLong: File[]
}

export const EMPTY_FILES: UploadFiles = {
  thumbnail: [],
  audioShort: [],
  audioLong: [],
  bulletin: [],
  transcriptShort: [],
  transcriptLong: [],
}

export const STEPS = [
  { label: 'Details', number: 1 },
  { label: 'Files', number: 2 },
  { label: 'Review', number: 3 },
] as const

export type FileKey = keyof UploadFiles
