import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { androidManifestFixPlugin } from './index'

const MANIFEST_URL =
  'https://liffsdk.line-scdn.net/xlt/some/path/manifest.json'
const OTHER_URL = 'https://example.com/api/data'

describe('androidManifestFixPlugin', () => {
  it('has the correct plugin name', () => {
    expect(androidManifestFixPlugin.name).toBe('android-manifest-fix')
  })

  describe('install()', () => {
    let originalFetch: typeof fetch
    let fetchSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      originalFetch = globalThis.fetch
      fetchSpy = vi.fn().mockResolvedValue(new Response('ok'))
      globalThis.fetch = fetchSpy
      androidManifestFixPlugin.install({} as never)
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('appends t= timestamp to manifest URLs with no existing query string', async () => {
      const before = Date.now()
      await fetch(MANIFEST_URL)
      const after = Date.now()

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledUrl: string = fetchSpy.mock.calls[0][0]
      const ts = Number(new URL(calledUrl).searchParams.get('t'))
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('uses & separator when URL already has query parameters', async () => {
      await fetch(`${MANIFEST_URL}?v=1`)

      const calledUrl: string = fetchSpy.mock.calls[0][0]
      expect(calledUrl).toMatch(/\?v=1&t=\d+$/)
    })

    it('does not modify URLs that do not match the manifest pattern', async () => {
      await fetch(OTHER_URL)

      const calledUrl: string = fetchSpy.mock.calls[0][0]
      expect(calledUrl).toBe(OTHER_URL)
    })

    it('passes through the original fetch options unchanged', async () => {
      const init: RequestInit = { method: 'POST', body: 'payload' }
      await fetch(OTHER_URL, init)

      expect(fetchSpy).toHaveBeenCalledWith(OTHER_URL, init)
    })

    it('passes through options for intercepted manifest URLs', async () => {
      const init: RequestInit = { headers: { 'X-Custom': 'header' } }
      await fetch(MANIFEST_URL, init)

      const [, calledInit] = fetchSpy.mock.calls[0]
      expect(calledInit).toEqual(init)
    })

    it('URL object input is intercepted', async () => {
      await fetch(new URL(MANIFEST_URL))

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledUrl = fetchSpy.mock.calls[0][0]
      expect(typeof calledUrl === 'string').toBe(true)
      expect(calledUrl).toContain('liffsdk.line-scdn.net/xlt/')
      expect(calledUrl).toMatch(/\?t=\d+/)
    })

    it('Request object input is intercepted', async () => {
      await fetch(new Request(MANIFEST_URL))

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledInput = fetchSpy.mock.calls[0][0]
      expect(calledInput).toBeInstanceOf(Request)
      const calledReq = calledInput as Request
      expect(calledReq.url).toContain('liffsdk.line-scdn.net/xlt/')
      expect(calledReq.url).toMatch(/\?t=\d+/)
    })

    it('preserves Request object metadata when intercepting manifest URL', async () => {
      const req = new Request(MANIFEST_URL, { headers: { 'X-Custom': 'value' } })
      await fetch(req)

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledInput = fetchSpy.mock.calls[0][0]
      expect(calledInput).toBeInstanceOf(Request)
      const calledReq = calledInput as Request
      expect(calledReq.headers.get('X-Custom')).toBe('value')
      expect(calledReq.url).toMatch(/\?t=\d+/)
    })
  })
})
