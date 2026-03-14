import { describe, it, expect } from 'vitest'
import { learningGraphSchema, saveGraphDataSchema } from '@/lib/schemas/learning-graph'

describe('learningGraphSchema', () => {
  it('accepts valid input', () => {
    const result = learningGraphSchema.safeParse({
      title: 'Intro to Auditing',
      domain: 'Auditing',
      path_type: 'linear',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid input with optional description', () => {
    const result = learningGraphSchema.safeParse({
      title: 'Intro to Auditing',
      description: 'A beginner course',
      domain: 'Auditing',
      path_type: 'graph',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = learningGraphSchema.safeParse({
      title: '',
      domain: 'Auditing',
      path_type: 'linear',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty domain', () => {
    const result = learningGraphSchema.safeParse({
      title: 'Title',
      domain: '',
      path_type: 'linear',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid path_type', () => {
    const result = learningGraphSchema.safeParse({
      title: 'Title',
      domain: 'Auditing',
      path_type: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = learningGraphSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('saveGraphDataSchema', () => {
  it('accepts valid episodes and edges', () => {
    const result = saveGraphDataSchema.safeParse({
      episodes: [
        {
          title: 'Episode 1',
          position_x: 0,
          position_y: 0,
          node_type: 'start',
          sort_order: 0,
        },
      ],
      edges: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts episodes with optional fields', () => {
    const result = saveGraphDataSchema.safeParse({
      episodes: [
        {
          id: 'abc-123',
          title: 'Episode 1',
          description: 'First episode',
          thumbnail_url: 'https://example.com/thumb.jpg',
          audio_url: 'https://example.com/audio.mp3',
          position_x: 100,
          position_y: 200,
          label: 'Start here',
          node_type: 'start',
          sort_order: 1,
        },
      ],
      edges: [
        {
          source_episode_id: 'abc-123',
          target_episode_id: 'def-456',
          label: 'Next',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects episode without title', () => {
    const result = saveGraphDataSchema.safeParse({
      episodes: [
        {
          position_x: 0,
          position_y: 0,
        },
      ],
      edges: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects edge without source_episode_id', () => {
    const result = saveGraphDataSchema.safeParse({
      episodes: [],
      edges: [
        {
          target_episode_id: 'def-456',
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
