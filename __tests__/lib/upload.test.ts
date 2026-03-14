import { describe, it, expect } from 'vitest'
import { formatFileSize, filenameToTitle, filenameStem } from '@/lib/upload'

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(10240)).toBe('10.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
    expect(formatFileSize(1572864)).toBe('1.5 MB')
    expect(formatFileSize(52428800)).toBe('50.0 MB')
  })
})

describe('filenameToTitle', () => {
  it('strips extension and converts to title case', () => {
    expect(filenameToTitle('my-podcast.mp3')).toBe('My Podcast')
  })

  it('handles underscores', () => {
    expect(filenameToTitle('my_podcast_ep1.mp3')).toBe('My Podcast Ep1')
  })

  it('handles mixed separators', () => {
    expect(filenameToTitle('episode-01_intro.wav')).toBe('Episode 01 Intro')
  })

  it('handles files without extension', () => {
    expect(filenameToTitle('no-extension')).toBe('No Extension')
  })
})

describe('filenameStem', () => {
  it('returns lowercase name without extension', () => {
    expect(filenameStem('MyFile.pdf')).toBe('myfile')
  })

  it('handles multiple dots', () => {
    expect(filenameStem('my.file.name.mp3')).toBe('my.file.name')
  })

  it('handles no extension', () => {
    expect(filenameStem('noext')).toBe('noext')
  })
})
