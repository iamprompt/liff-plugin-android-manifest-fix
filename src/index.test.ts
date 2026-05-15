import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { androidManifestFixPlugin } from './index'

const MANIFEST_URL = 'https://liffsdk.line-scdn.net/xlt/some/path/manifest.json'
const OTHER_URL = 'https://example.com/api/data'

type HookFn = () => Promise<void>

function createMockContext() {
  const beforeCallbacks: HookFn[] = []
  const afterCallbacks: HookFn[] = []

  return {
    context: {
      hooks: {
        init: {
          before: (fn: HookFn) => beforeCallbacks.push(fn),
          after: (fn: HookFn) => afterCallbacks.push(fn),
        },
      },
    } as never,
    triggerBefore: () => Promise.all(beforeCallbacks.map((fn) => fn())),
    triggerAfter: () => Promise.all(afterCallbacks.map((fn) => fn())),
  }
}

// Helper to extract call args from a spy without tuple-length TS errors
function callArgs(spy: ReturnType<typeof vi.fn>, callIndex: number): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (spy.mock.calls as any[][])[callIndex] ?? []
}

describe('androidManifestFixPlugin', () => {
  it('has the correct plugin name', () => {
    expect(androidManifestFixPlugin.name).toBe('android-manifest-fix')
  })

  describe('fetch interception (active during liff.init)', () => {
    let originalFetch: typeof fetch
    let fetchSpy: ReturnType<typeof vi.fn>
    let triggerBefore: () => Promise<void[]>
    let triggerAfter: () => Promise<void[]>

    beforeEach(async () => {
      originalFetch = globalThis.fetch
      fetchSpy = vi.fn().mockResolvedValue(new Response('ok'))
      globalThis.fetch = fetchSpy as unknown as typeof fetch

      const mock = createMockContext()
      triggerBefore = mock.triggerBefore
      triggerAfter = mock.triggerAfter
      androidManifestFixPlugin.install(mock.context)

      await triggerBefore()
    })

    afterEach(async () => {
      await triggerAfter()
      globalThis.fetch = originalFetch
    })

    it('appends t= timestamp to manifest URLs with no existing query string', async () => {
      const before = Date.now()
      await fetch(MANIFEST_URL)
      const after = Date.now()

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      const ts = Number(new URL(calledUrl).searchParams.get('t'))
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('overwrites existing t= param (no duplicate)', async () => {
      await fetch(`${MANIFEST_URL}?t=old`)
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      expect(calledUrl).toMatch(/\?t=\d+$/)
      expect(calledUrl).not.toContain('t=old')
    })

    it('uses & separator when URL already has other query parameters', async () => {
      await fetch(`${MANIFEST_URL}?v=1`)
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      expect(calledUrl).toMatch(/\?v=1&t=\d+/)
    })

    it('does not modify URLs that do not match the manifest pattern', async () => {
      await fetch(OTHER_URL)
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      expect(calledUrl).toBe(OTHER_URL)
    })

    it('passes through fetch options unchanged for non-manifest URLs', async () => {
      const init: RequestInit = { method: 'POST', body: 'payload' }
      await fetch(OTHER_URL, init)
      expect(fetchSpy).toHaveBeenCalledWith(OTHER_URL, init)
    })

    it('passes through fetch options for intercepted manifest URLs', async () => {
      const init: RequestInit = { headers: { 'X-Custom': 'header' } }
      await fetch(MANIFEST_URL, init)
      const calledInit: RequestInit = callArgs(fetchSpy, 0)[1]
      expect(calledInit).toEqual(init)
    })

    it('handles URL object input — intercepts and converts to string', async () => {
      await fetch(new URL(MANIFEST_URL))
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      expect(typeof calledUrl).toBe('string')
      expect(calledUrl).toContain('liffsdk.line-scdn.net/xlt/')
      expect(calledUrl).toMatch(/\?t=\d+/)
    })

    it('handles Request object input — intercepts and clones with modified URL', async () => {
      const req = new Request(MANIFEST_URL, { headers: { 'X-Custom': 'value' } })
      await fetch(req)
      const calledInput: unknown = callArgs(fetchSpy, 0)[0]
      expect(calledInput).toBeInstanceOf(Request)
      const calledReq = calledInput as Request
      expect(calledReq.headers.get('X-Custom')).toBe('value')
      expect(calledReq.url).toMatch(/\?t=\d+/)
      expect(calledReq.url).toContain('liffsdk.line-scdn.net/xlt/')
    })
  })

  describe('fetch restoration (after liff.init)', () => {
    it('restores original fetch after triggerAfter', async () => {
      const originalFetch = globalThis.fetch
      const fetchSpy = vi.fn().mockResolvedValue(new Response('ok'))
      globalThis.fetch = fetchSpy as unknown as typeof fetch

      const mock = createMockContext()
      androidManifestFixPlugin.install(mock.context)
      await mock.triggerBefore()

      expect(globalThis.fetch).not.toBe(fetchSpy)

      await mock.triggerAfter()

      expect(globalThis.fetch).toBe(fetchSpy)
      globalThis.fetch = originalFetch
    })

    it('does not intercept manifest URLs after restore', async () => {
      const originalFetch = globalThis.fetch
      const fetchSpy = vi.fn().mockResolvedValue(new Response('ok'))
      globalThis.fetch = fetchSpy as unknown as typeof fetch

      const mock = createMockContext()
      androidManifestFixPlugin.install(mock.context)
      await mock.triggerBefore()
      await mock.triggerAfter()

      await fetch(MANIFEST_URL)
      const calledUrl: string = callArgs(fetchSpy, 0)[0]
      expect(calledUrl).toBe(MANIFEST_URL)

      globalThis.fetch = originalFetch
    })
  })
})
