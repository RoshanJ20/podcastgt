/**
 * @module ReviewStep
 * Step 3 of the UploadForm wizard. Displays a read-only summary of
 * all bulletin metadata and selected files, along with real-time
 * upload progress bars during submission.
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Check, FileText, Music, Image as ImageIcon } from 'lucide-react'
import type { FormValues, UploadFiles } from './upload-form-types'

interface ReviewStepProps {
  values: FormValues
  tags: string[]
  files: UploadFiles
  uploadProgress: Record<string, number>
}

/** Metadata about each file slot for the summary list. */
const FILE_SLOTS = [
  { key: 'thumbnail', label: 'Thumbnail', Icon: ImageIcon },
  { key: 'audioShort', label: 'Audio (Short)', Icon: Music },
  { key: 'audioLong', label: 'Audio (Long)', Icon: Music },
  { key: 'bulletin', label: 'Bulletin PDF', Icon: FileText },
  { key: 'transcript', label: 'Transcript', Icon: FileText },
] as const

export function ReviewStep({
  values,
  tags,
  files,
  uploadProgress,
}: ReviewStepProps) {
  const fileCount = Object.values(files).filter((f) => f.length > 0).length

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
          Review & Upload
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Confirm everything looks good
        </p>
      </div>

      <MetadataSummary values={values} tags={tags} />

      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-2">
          Files ({fileCount} selected)
        </p>
        <div className="space-y-2">
          {FILE_SLOTS.map(({ key, label, Icon }) => (
            <FileRow
              key={key}
              label={label}
              Icon={Icon}
              file={files[key][0]}
              progress={uploadProgress[key]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Left/right columns showing bulletin metadata. */
function MetadataSummary({
  values,
  tags,
}: {
  values: FormValues
  tags: string[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <Detail label="Title" value={values.title || '\u2014'} />
        <Detail label="Domain" value={values.domain || '\u2014'} />
        <Detail label="Year" value={String(values.year)} />
        <Detail
          label="Content Type"
          value={
            values.content_type === 'learning_series'
              ? 'Learning Series'
              : 'Bulletin'
          }
        />
      </div>
      <div className="space-y-3">
        {values.description && (
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm line-clamp-3">{values.description}</p>
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-[#60A5FA]/15 text-[#93C5FD]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Single label/value pair in the metadata summary. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

/** Single row in the file summary list with optional progress indicator. */
function FileRow({
  label,
  Icon,
  file,
  progress,
}: {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  file: File | undefined
  progress: number | undefined
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      {file ? (
        <span className="truncate">{file.name}</span>
      ) : (
        <span className="text-muted-foreground/50 italic">Not selected</span>
      )}
      {progress !== undefined && progress < 100 && (
        <div className="ml-auto w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-[#38BDF8] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {progress === 100 && (
        <Check className="h-3.5 w-3.5 text-green-500 ml-auto" />
      )}
    </div>
  )
}
