/**
 * @module NodeEditModal
 *
 * Modal dialog for editing a podcast node within a learning graph.
 *
 * Key responsibilities:
 * - Allows editing of bulletin title, description, and domain
 * - Supports changing the node type (default, start, milestone, end)
 * - Displays attached media badges (audio, PDF)
 * - Persists changes to the podcast via API and notifies parent components
 */
'use client'

import { useState } from 'react'
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
import { Loader2, ExternalLink, FileText, Music } from 'lucide-react'
import { DOMAINS, GRAPH_NODE_TYPES, type GraphNodeType, type Domain } from '@/lib/supabase/types'

interface PodcastData {
  id: string
  title: string
  description: string | null
  domain: string
  thumbnailUrl: string | null
  audioShortUrl: string | null
  audioLongUrl: string | null
  bulletinUrl: string | null
}

interface NodeEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  podcast: PodcastData
  nodeType: GraphNodeType
  onNodeTypeChange: (nodeType: GraphNodeType) => void
  onPodcastUpdate: (podcast: PodcastData) => void
}

export function NodeEditModal({
  open,
  onOpenChange,
  nodeId,
  podcast,
  nodeType,
  onNodeTypeChange,
  onPodcastUpdate,
}: NodeEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(podcast.title)
  const [description, setDescription] = useState(podcast.description ?? '')
  const [domain, setDomain] = useState(podcast.domain)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/podcasts/${podcast.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, domain }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      onPodcastUpdate({
        ...podcast,
        title: updated.title,
        description: updated.description,
        domain: updated.domain,
      })
      toast.success('Bulletin updated!')
      onOpenChange(false)
    } catch (error) {
      console.error('[NodeEditModal] Failed to update bulletin:', error)
      toast.error('Failed to update bulletin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Bulletin Node</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {podcast.thumbnailUrl && (
            <img
              src={podcast.thumbnailUrl}
              alt=""
              className="w-full h-32 object-cover rounded-lg"
            />
          )}

          <div className="space-y-2">
            <Label>Title</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Domain</Label>
              <Select value={domain} onValueChange={(value) => value && setDomain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((domain) => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Node Type</Label>
              <Select value={nodeType} onValueChange={(value) => onNodeTypeChange(value as GraphNodeType)}>
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
          </div>

          {/* Media links */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Attached Media</p>
            <div className="flex flex-wrap gap-2">
              {podcast.audioShortUrl && (
                <Badge variant="outline" className="gap-1">
                  <Music className="h-3 w-3" />
                  Short Audio
                </Badge>
              )}
              {podcast.audioLongUrl && (
                <Badge variant="outline" className="gap-1">
                  <Music className="h-3 w-3" />
                  Long Audio
                </Badge>
              )}
              {podcast.bulletinUrl && (
                <a href={podcast.bulletinUrl} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
                    <FileText className="h-3 w-3" />
                    PDF
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Badge>
                </a>
              )}
              {!podcast.audioShortUrl && !podcast.audioLongUrl && !podcast.bulletinUrl && (
                <p className="text-xs text-muted-foreground italic">No media attached</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
