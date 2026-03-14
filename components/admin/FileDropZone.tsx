/**
 * @module FileDropZone
 *
 * Reusable drag-and-drop file upload zone with preview support.
 *
 * Key responsibilities:
 * - Handles file drag-and-drop and click-to-browse interactions
 * - Supports single or multiple file selection with configurable limits
 * - Renders file list with size display and removal controls
 * - Optionally shows image previews for uploaded image files
 */
'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, FileAudio, FileText, Image as ImageIcon } from 'lucide-react'
import { formatFileSize } from '@/lib/upload'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  accept: string
  multiple?: boolean
  maxFiles?: number
  label: string
  description?: string
  icon?: 'audio' | 'pdf' | 'image' | 'file'
  files: File[]
  onFilesChange: (files: File[]) => void
  showPreview?: boolean
  className?: string
}

const iconMap = {
  audio: FileAudio,
  pdf: FileText,
  image: ImageIcon,
  file: Upload,
}

export function FileDropZone({
  accept,
  multiple = false,
  maxFiles = 50,
  label,
  description,
  icon = 'file',
  files,
  onFilesChange,
  showPreview = false,
  className,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const Icon = iconMap[icon]

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles)
      if (multiple) {
        const combined = [...files, ...arr].slice(0, maxFiles)
        onFilesChange(combined)
      } else {
        onFilesChange(arr.slice(0, 1))
      }
    },
    [files, multiple, maxFiles, onFilesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const previewUrl = showPreview && files[0] && files[0].type.startsWith('image/')
    ? URL.createObjectURL(files[0])
    : null

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'drop-zone rounded-xl p-6 cursor-pointer text-center transition-all',
          isDragOver && 'drop-zone-active',
          files.length > 0 && 'border-[#60A5FA]/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-24 w-24 rounded-lg object-cover border border-border"
            />
            <p className="text-xs text-muted-foreground">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center transition-transform',
              isDragOver ? 'bg-[#60A5FA]/20 scale-110' : 'bg-[#60A5FA]/10'
            )}>
              <Icon className="h-6 w-6 text-[#60A5FA]" />
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description ?? (multiple ? 'Drag & drop files or click to browse' : 'Drag & drop a file or click to browse')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && !showPreview && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm group"
            >
              <Icon className="h-3.5 w-3.5 text-[#60A5FA] shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(i)
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && showPreview && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{files[0].name}</span>
          <span>({formatFileSize(files[0].size)})</span>
          <button
            type="button"
            onClick={() => onFilesChange([])}
            className="text-destructive hover:text-destructive/80 ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
