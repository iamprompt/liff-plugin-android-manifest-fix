const MANIFEST_URL_PATTERN = 'liffsdk.line-scdn.net/xlt/'

const PATCHED = Symbol('android-manifest-fix-patched')

function withCacheBust(urlString: string): string {
  const u = new URL(urlString)
  u.searchParams.set('t', String(Date.now()))
  return u.toString()
}

export const androidManifestFixPlugin = {
  name: 'android-manifest-fix' as const,

  install(_liff: unknown): void {
    if (typeof globalThis.fetch === 'undefined') return
    if ((globalThis.fetch as typeof fetch & Record<symbol, boolean>)[PATCHED]) return

    const originalFetch = globalThis.fetch.bind(globalThis)

    const patchedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      if (url.includes(MANIFEST_URL_PATTERN)) {
        return originalFetch(withCacheBust(url), init)
      }

      return originalFetch(input, init)
    }

    ;(patchedFetch as typeof fetch & Record<symbol, boolean>)[PATCHED] = true
    globalThis.fetch = patchedFetch
  },
}

export default androidManifestFixPlugin
