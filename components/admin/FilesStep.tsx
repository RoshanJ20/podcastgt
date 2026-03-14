/**
 * @module FilesStep
 * Step 2 of the UploadForm wizard. Provides drag-and-drop file
 * upload zones for thumbnail, short/long audio, bulletin PDF,
 * and an optional transcript file.
 */

'use client'

import { FileDropZone } from './FileDropZone'
import type { UploadFiles } from './upload-form-types'

interface FilesStepProps {
  files: UploadFiles
  onFilesChange: (updater: (prev: UploadFiles) => UploadFiles) => void
}

export function FilesStep({ files, onFilesChange }: FilesStepProps) {
  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
          Upload Files
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Drag & drop or click to select files
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FileDropZone
          accept="image/*"
          label="Thumbnail Image"
          icon="image"
          files={files.thumbnail}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, thumbnail: f }))
          }
          showPreview
        />
        <FileDropZone
          accept="audio/*"
          label="Audio — Brief Summary"
          icon="audio"
          files={files.audioShort}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, audioShort: f }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FileDropZone
          accept="audio/*"
          label="Audio — Detailed Overview"
          icon="audio"
          files={files.audioLong}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, audioLong: f }))
          }
        />
        <FileDropZone
          accept=".pdf"
          label="Attachment (PDF)"
          icon="pdf"
          multiple
          files={files.bulletin}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, bulletin: f }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FileDropZone
          accept=".txt,.vtt"
          label="Transcript (Short)"
          description="Plain text or VTT for short audio"
          icon="file"
          files={files.transcriptShort}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, transcriptShort: f }))
          }
        />
        <FileDropZone
          accept=".txt,.vtt"
          label="Transcript (Long)"
          description="Plain text or VTT for long audio"
          icon="file"
          files={files.transcriptLong}
          onFilesChange={(f) =>
            onFilesChange((prev) => ({ ...prev, transcriptLong: f }))
          }
        />
      </div>
    </div>
  )
}
