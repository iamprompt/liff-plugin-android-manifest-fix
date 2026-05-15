import type { LiffPluginContext } from '@line/liff'

const MANIFEST_URL_PATTERN = 'liffsdk.line-scdn.net/xlt/'

function withCacheBust(urlString: string): string {
  const u = new URL(urlString)
  u.searchParams.set('t', String(Date.now()))
  return u.toString()
}

export const androidManifestFixPlugin = {
  name: 'android-manifest-fix' as const,

  install(context: LiffPluginContext): void {
    let originalFetch: typeof globalThis.fetch | undefined

    context.hooks.init.before(async () => {
      if (typeof globalThis.fetch !== 'function') return
      originalFetch = globalThis.fetch

      globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url

        if (url.includes(MANIFEST_URL_PATTERN)) {
          const bustUrl = withCacheBust(url)
          const modifiedInput = input instanceof Request ? new Request(bustUrl, input) : bustUrl
          return originalFetch!(modifiedInput, init)
        }

        return originalFetch!(input, init)
      }
    })

    context.hooks.init.after(async () => {
      if (originalFetch !== undefined) {
        globalThis.fetch = originalFetch
        originalFetch = undefined
      }
    })
  },
}

export default androidManifestFixPlugin
