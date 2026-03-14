/**
 * @module AudioPlayer
 *
 * Full-featured audio player with short/long duration toggle, progress slider, and volume controls.
 *
 * Key responsibilities:
 * - Plays audio with support for both short and long versions of a bulletin
 * - Provides playback controls (play/pause, skip forward/back, seek)
 * - Manages volume and mute state with a slider control
 * - Reports current playback time to parent via callback for transcript syncing
 */
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
    requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = time
        if (isPlaying) audioRef.current.play().catch(() => null)
      }
    })
  }

  if (!activeUrl) {
    return (
      <div className="rounded-xl glass-card p-6 text-center text-sm text-muted-foreground">
        No audio available.
      </div>
    )
  }

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
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
          <button
            onClick={() => switchDuration('short')}
            className={`text-xs h-7 px-4 rounded-full font-medium transition-all ${
              duration_mode === 'short'
                ? 'btn-gradient'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            Short
          </button>
          <button
            onClick={() => switchDuration('long')}
            className={`text-xs h-7 px-4 rounded-full font-medium transition-all ${
              duration_mode === 'long'
                ? 'btn-gradient'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            Long
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={[currentTime]}
          onValueChange={(sliderValue) => {
            const seekPosition = Array.isArray(sliderValue) ? (sliderValue as number[])[0] : (sliderValue as number)
            if (audioRef.current) audioRef.current.currentTime = seekPosition
          }}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-[#60A5FA] font-medium">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => skip(-10)} title="Back 10s" className="text-muted-foreground hover:text-foreground">
          <SkipBack className="h-4 w-4" />
        </Button>
        <button
          onClick={togglePlay}
          disabled={loading}
          className="h-14 w-14 rounded-full btn-gradient flex items-center justify-center glow-primary disabled:opacity-50 transition-all hover:scale-105"
        >
          {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-0.5" />}
        </button>
        <Button variant="ghost" size="icon" onClick={() => skip(10)} title="Forward 10s" className="text-muted-foreground hover:text-foreground">
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Volume */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMuted((isMuted) => {
                if (audioRef.current) audioRef.current.muted = !isMuted
                return !isMuted
              })
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[muted ? 0 : volume]}
            onValueChange={(sliderValue) => {
              const volumeLevel = Array.isArray(sliderValue) ? (sliderValue as number[])[0] : (sliderValue as number)
              setVolume(volumeLevel)
              if (audioRef.current) audioRef.current.volume = volumeLevel
              if (volumeLevel > 0) setMuted(false)
            }}
            className="w-20 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
