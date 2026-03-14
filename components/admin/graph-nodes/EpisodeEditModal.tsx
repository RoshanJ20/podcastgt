/**
 * @module EpisodeEditModal
 *
 * Modal dialog for editing an episode's content and node type within a learning path.
 *
 * Key responsibilities:
 * - Allows editing of episode title, description, and node type
 * - Supports audio file upload and thumbnail upload via Supabase storage
 * - Supports transcript upload (plain text file parsed to JSONB)
 * - Changes are saved to local state; actual persistence is done by the parent on "Save"
 */
'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Music, Upload, FileText, Image, X } from 'lucide-react'
import { GRAPH_NODE_TYPES, type GraphNodeType, type EpisodeTranscript } from '@/lib/supabase/types'
import { uploadFile } from '@/lib/upload'

export interface EpisodeData {
  title: string
  description: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  transcript: EpisodeTranscript | null
  nodeType: GraphNodeType
}

interface EpisodeEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  episode: EpisodeData
  onEpisodeUpdate: (nodeId: string, episode: EpisodeData) => void
}

export function EpisodeEditModal({
  open,
  onOpenChange,
  nodeId,
  episode,
  onEpisodeUpdate,
}: EpisodeEditModalProps) {
  const [title, setTitle] = useState(episode.title)
  const [description, setDescription] = useState(episode.description ?? '')
  const [audioUrl, setAudioUrl] = useState(episode.audioUrl)
  const [thumbnailUrl, setThumbnailUrl] = useState(episode.thumbnailUrl)
  const [transcript, setTranscript] = useState(episode.transcript)
  const [nodeType, setNodeType] = useState(episode.nodeType)
  const [uploading, setUploading] = useState<string | null>(null)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const transcriptInputRef = useRef<HTMLInputElement>(null)

  const handleAudioUpload = async (file: File) => {
    setUploading('audio')
    try {
      const url = await uploadFile(file, 'audio', 'episodes')
      setAudioUrl(url)
      toast.success('Audio uploaded')
    } catch (error) {
      console.error('[EpisodeEditModal] Audio upload failed:', error)
      toast.error('Audio upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    setUploading('thumbnail')
    try {
      const url = await uploadFile(file, 'thumbnails', 'episodes')
      setThumbnailUrl(url)
      toast.success('Thumbnail uploaded')
    } catch (error) {
      console.error('[EpisodeEditModal] Thumbnail upload failed:', error)
      toast.error('Thumbnail upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleTranscriptUpload = async (file: File) => {
    try {
      const text = await file.text()
      const parsed: EpisodeTranscript = { full_text: text, segments: null }

      // Try parsing as JSON with segments
      try {
        const json = JSON.parse(text)
        if (json.segments && Array.isArray(json.segments)) {
          parsed.segments = json.segments
          parsed.full_text = json.full_text ?? json.segments.map((s: { text: string }) => s.text).join(' ')
        }
      } catch {
        // Not JSON, treat as plain text — full_text is already set
      }

      setTranscript(parsed)
      toast.success('Transcript loaded')
    } catch (error) {
      console.error('[EpisodeEditModal] Transcript parse failed:', error)
      toast.error('Failed to read transcript file')
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    onEpisodeUpdate(nodeId, {
      title: title.trim(),
      description: description.trim() || null,
      thumbnailUrl,
      audioUrl,
      transcript,
      nodeType,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Episode</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {thumbnailUrl && (
            <div className="relative">
              <img
                src={thumbnailUrl}
                alt=""
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setThumbnailUrl(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Node Type</Label>
            <Select value={nodeType} onValueChange={(value) => setNodeType(value as GraphNodeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRAPH_NODE_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File uploads */}
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Media</p>

            <div className="flex flex-wrap gap-2">
              {/* Audio upload */}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAudioUpload(file)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={uploading === 'audio'}
                onClick={() => audioInputRef.current?.click()}
              >
                {uploading === 'audio' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Music className="h-3 w-3" />
                )}
                {audioUrl ? 'Replace Audio' : 'Upload Audio'}
              </Button>

              {/* Thumbnail upload */}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleThumbnailUpload(file)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={uploading === 'thumbnail'}
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {uploading === 'thumbnail' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Image className="h-3 w-3" />
                )}
                {thumbnailUrl ? 'Replace Thumbnail' : 'Upload Thumbnail'}
              </Button>

              {/* Transcript upload */}
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".txt,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleTranscriptUpload(file)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => transcriptInputRef.current?.click()}
              >
                <FileText className="h-3 w-3" />
                {transcript ? 'Replace Transcript' : 'Upload Transcript'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {audioUrl && (
                <Badge variant="outline" className="gap-1">
                  <Music className="h-3 w-3" />
                  Audio attached
                </Badge>
              )}
              {transcript && (
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Transcript loaded
                </Badge>
              )}
              {!audioUrl && !transcript && (
                <p className="text-xs text-muted-foreground italic">No media attached</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!!uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
