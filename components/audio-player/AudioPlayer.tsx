'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  shortUrl: string | null
  longUrl: string | null
  onTimeUpdate?: (currentTime: number) => void
  seekTo?: number | null
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ shortUrl, longUrl, onTimeUpdate, seekTo }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [duration_mode, setDurationMode] = useState<'short' | 'long'>(shortUrl ? 'short' : 'long')
  const [loading, setLoading] = useState(false)

  const activeUrl = duration_mode === 'short' ? shortUrl : longUrl

  // Seek externally (e.g. from transcript click)
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTo
      if (!isPlaying) audioRef.current.play().catch(() => null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekTo])

  const handleTimeUpdate = useCallback(() => {
    const t = audioRef.current?.currentTime ?? 0
    setCurrentTime(t)
    onTimeUpdate?.(t)
  }, [onTimeUpdate])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => null)
    }
  }

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const switchDuration = (mode: 'short' | 'long') => {
    const time = audioRef.current?.currentTime ?? 0
    setDurationMode(mode)
    setLoading(true)
    // After src change, seek to same relative position
    requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = time
        if (isPlaying) audioRef.current.play().catch(() => null)
      }
    })
  }

  if (!activeUrl) {
    return (
      <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        No audio available for this podcast.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <audio
        ref={audioRef}
        src={activeUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? 0)
          setLoading(false)
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Duration toggle */}
      {shortUrl && longUrl && (
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant={duration_mode === 'short' ? 'default' : 'outline'}
            onClick={() => switchDuration('short')}
            className="text-xs h-7 px-3"
          >
            Short
          </Button>
          <Button
            size="sm"
            variant={duration_mode === 'long' ? 'default' : 'outline'}
            onClick={() => switchDuration('long')}
            className="text-xs h-7 px-3"
          >
            Long
          </Button>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={[currentTime]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? (v as number[])[0] : (v as number)
            if (audioRef.current) audioRef.current.currentTime = val
          }}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => skip(-10)} title="Back 10s">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          disabled={loading}
          className="h-10 w-10 rounded-full"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => skip(10)} title="Forward 10s">
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Volume */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMuted((m) => {
                if (audioRef.current) audioRef.current.muted = !m
                return !m
              })
            }}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[muted ? 0 : volume]}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? (v as number[])[0] : (v as number)
              setVolume(val)
              if (audioRef.current) audioRef.current.volume = val
              if (val > 0) setMuted(false)
            }}
            className="w-20 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
