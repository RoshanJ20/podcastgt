import { describe, it, expect, vi } from 'vitest'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/error-response'

describe('API error responses', () => {
  it('unauthorizedResponse returns 401', async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error_code).toBe('UNAUTHORIZED')
    expect(body.message).toBe('Authentication required')
  })

  it('unauthorizedResponse accepts custom message', async () => {
    const res = unauthorizedResponse('Token expired')
    const body = await res.json()
    expect(body.message).toBe('Token expired')
  })

  it('forbiddenResponse returns 403', async () => {
    const res = forbiddenResponse()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error_code).toBe('FORBIDDEN')
    expect(body.message).toBe('Insufficient permissions')
  })

  it('notFoundResponse returns 404 with resource name', async () => {
    const res = notFoundResponse('Podcast')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error_code).toBe('NOT_FOUND')
    expect(body.message).toBe('Podcast not found')
  })

  it('validationErrorResponse returns 400', async () => {
    const res = validationErrorResponse('Invalid email', { email: 'must be valid' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error_code).toBe('VALIDATION_FAILED')
    expect(body.message).toBe('Invalid email')
    expect(body.details).toEqual({ email: 'must be valid' })
  })

  it('validationErrorResponse works without details', async () => {
    const res = validationErrorResponse('Missing field')
    const body = await res.json()
    expect(body.details).toBeUndefined()
  })

  it('internalErrorResponse returns 500 and logs error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('db connection failed')

    const res = internalErrorResponse('fetch podcasts', err)
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error_code).toBe('INTERNAL_ERROR')
    expect(body.message).toBe('Failed to fetch podcasts')
    // Should not leak the original error to the client
    expect(body.details).toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith('[API] Failed to fetch podcasts:', err)
    consoleSpy.mockRestore()
  })

  it('internalErrorResponse works without original error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = internalErrorResponse('save data')
    expect(res.status).toBe(500)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
