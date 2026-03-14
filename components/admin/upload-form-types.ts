/**
 * @module upload-form-types
 * Shared types, Zod schema, and constants for the multi-step UploadForm.
 * Centralises form validation rules and type definitions used across
 * all UploadForm sub-components.
 */

import { z } from 'zod'
import type { Domain } from '@/lib/supabase/types'

export const uploadFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  year: z.number().int().min(2000).max(2100),
  tags: z.array(z.string()),
})

export type FormValues = z.infer<typeof uploadFormSchema>

export interface UploadFormProps {
  editPodcast?: {
    id: string
    title: string
    description: string | null
    domain: Domain
    year: number
    tags: string[]
  }
  onSuccess?: (podcast: {
    id: string
    title: string
    thumbnail_url: string | null
    domain: string
  }) => void
}

export interface UploadFiles {
  thumbnail: File[]
  audioShort: File[]
  audioLong: File[]
  bulletin: File[]
  transcript: File[]
}

export const EMPTY_FILES: UploadFiles = {
  thumbnail: [],
  audioShort: [],
  audioLong: [],
  bulletin: [],
  transcript: [],
}

export const STEPS = [
  { label: 'Details', number: 1 },
  { label: 'Files', number: 2 },
  { label: 'Review', number: 3 },
] as const

export type FileKey = keyof UploadFiles
