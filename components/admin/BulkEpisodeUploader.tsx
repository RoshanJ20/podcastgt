'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { FileDropZone } from './FileDropZone'
import { uploadFile, filenameToTitle, filenameStem } from '@/lib/upload'
import { Loader2, X, ChevronUp, ChevronDown, FileText, Music } from 'lucide-react'

interface PendingEpisode {
  id: string
  title: string
  audioFile: File
  matchedPdf: File | null
}

interface BulkEpisodeUploaderProps {
  onComplete: (playlistId: string) => void
  playlistMeta: {
    title: string
    description?: string
    domain: string
    year: number
  }
}

export function BulkEpisodeUploader({ onComplete, playlistMeta }: BulkEpisodeUploaderProps) {
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [episodes, setEpisodes] = useState<PendingEpisode[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })

  const handleAudioFilesChange = (files: File[]) => {
    setAudioFiles(files)
    // Build episode list from audio files
    const newEpisodes: PendingEpisode[] = files.map((f, i) => {
      const stem = filenameStem(f.name)
      const matchedPdf = pdfFiles.find((p) => filenameStem(p.name) === stem) ?? null
      return {
        id: `${i}-${f.name}`,
        title: filenameToTitle(f.name),
        audioFile: f,
        matchedPdf,
      }
    })
    setEpisodes(newEpisodes)
  }

  const handlePdfFilesChange = (files: File[]) => {
    setPdfFiles(files)
    // Re-match PDFs to existing episodes
    setEpisodes((prev) =>
      prev.map((ep) => {
        const stem = filenameStem(ep.audioFile.name)
        const matchedPdf = files.find((p) => filenameStem(p.name) === stem) ?? null
        return { ...ep, matchedPdf }
      })
    )
  }

  const updateTitle = (id: string, title: string) => {
    setEpisodes((prev) => prev.map((ep) => (ep.id === id ? { ...ep, title } : ep)))
  }

  const removeEpisode = (id: string) => {
    const ep = episodes.find((e) => e.id === id)
    if (ep) {
      setAudioFiles((prev) => prev.filter((f) => f !== ep.audioFile))
    }
    setEpisodes((prev) => prev.filter((e) => e.id !== id))
  }

  const moveEpisode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= episodes.length) return
    const next = [...episodes]
    const temp = next[index]
    next[index] = next[newIndex]
    next[newIndex] = temp
    setEpisodes(next)
  }

  const handleSubmit = async () => {
    if (episodes.length === 0) {
      toast.error('Add at least one audio file')
      return
    }

    setUploading(true)
    const total = episodes.length
    setProgress({ current: 0, total, label: 'Creating playlist...' })

    try {
      // 1. Create playlist
      const playlistRes = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistMeta),
      })
      if (!playlistRes.ok) throw new Error('Failed to create playlist')
      const playlist = await playlistRes.json()

      // 2. Upload files and build podcast records
      const podcastRecords: Record<string, unknown>[] = []

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i]
        setProgress({ current: i + 1, total, label: `Uploading "${ep.title}" (${i + 1}/${total})...` })

        const audioUrl = await uploadFile(ep.audioFile, 'audio', 'long')

        let bulletinUrl: string | undefined
        if (ep.matchedPdf) {
          bulletinUrl = await uploadFile(ep.matchedPdf, 'bulletins', 'pdfs')
        }

        podcastRecords.push({
          title: ep.title,
          domain: playlistMeta.domain,
          year: playlistMeta.year,
          content_type: 'learning_series',
          playlist_id: playlist.id,
          episode_order: i + 1,
          audio_long_url: audioUrl,
          bulletin_url: bulletinUrl ?? null,
          tags: [],
        })
      }

      // 3. Batch create podcasts
      setProgress({ current: total, total, label: 'Saving episodes...' })
      const batchRes = await fetch('/api/podcasts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcasts: podcastRecords }),
      })
      if (!batchRes.ok) throw new Error('Failed to create episodes')

      toast.success(`Playlist created with ${total} episodes!`)
      onComplete(playlist.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
      setProgress({ current: 0, total: 0, label: '' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Drop zones */}
      <div className="grid grid-cols-2 gap-4">
        <FileDropZone
          accept="audio/*"
          multiple
          label="Audio Files"
          description="Drop all episode audio files here"
          icon="audio"
          files={audioFiles}
          onFilesChange={handleAudioFilesChange}
        />
        <FileDropZone
          accept=".pdf"
          multiple
          label="PDF Bulletins"
          description="Drop matching PDF bulletins here"
          icon="pdf"
          files={pdfFiles}
          onFilesChange={handlePdfFilesChange}
        />
      </div>

      {/* Pending episodes list */}
      {episodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {episodes.length} Episode{episodes.length !== 1 ? 's' : ''} Ready
            </p>
            <p className="text-xs text-muted-foreground">
              {episodes.filter((e) => e.matchedPdf).length} PDF{episodes.filter((e) => e.matchedPdf).length !== 1 ? 's' : ''} matched
            </p>
          </div>

          <div className="space-y-1.5">
            {episodes.map((ep, index) => (
              <div
                key={ep.id}
                className="flex items-center gap-2 p-2.5 rounded-lg glass-card group hover:border-[#8B5CF6]/20 transition-all"
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0">
                  <button
                    type="button"
                    onClick={() => moveEpisode(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEpisode(index, 'down')}
                    disabled={index === episodes.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Episode number */}
                <span className="text-xs font-bold text-[#8B5CF6] w-5 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Audio icon */}
                <Music className="h-4 w-4 text-[#8B5CF6]/50 shrink-0" />

                {/* Editable title */}
                <Input
                  value={ep.title}
                  onChange={(e) => updateTitle(ep.id, e.target.value)}
                  className="h-8 text-sm flex-1"
                />

                {/* PDF match indicator */}
                {ep.matchedPdf ? (
                  <div className="flex items-center gap-1 text-xs text-green-500 shrink-0" title={ep.matchedPdf.name}>
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/40 shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                    —
                  </div>
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeEpisode(ep.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-[#8B5CF6]" />
            <span>{progress.label}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {progress.current} / {progress.total}
          </p>
        </div>
      )}

      {/* Submit */}
      {episodes.length > 0 && !uploading && (
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          Create Playlist & Upload {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}
