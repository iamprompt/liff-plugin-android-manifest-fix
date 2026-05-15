import type { LiffPlugin, LiffPluginContext } from '@line/liff'

const MANIFEST_URL_PATTERN = 'liffsdk.line-scdn.net/xlt'

function withCacheBust(urlString: string): string {
  const u = new URL(urlString)
  u.searchParams.set('t', String(Date.now()))
  return u.toString()
}

export class AndroidManifestFixPlugin implements LiffPlugin<void> {
  readonly name = 'android-manifest-fix' as const

  private readonly originalFetch: typeof globalThis.fetch

  constructor() {
    this.originalFetch = globalThis.fetch.bind(globalThis)
  }

  install(context: LiffPluginContext): void {
    context.hooks.init.before(this.patchFetch.bind(this))
    context.hooks.init.after(this.restoreFetch.bind(this))
  }

  private patchFetch() {
    window.fetch = (input, options) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      if (url.includes(MANIFEST_URL_PATTERN)) {
        const bustUrl = withCacheBust(url)
        const modifiedInput = input instanceof Request ? new Request(bustUrl, input) : bustUrl
        return this.originalFetch(modifiedInput, options)
      }
      return this.originalFetch(url, options)
    }
    return Promise.resolve()
  }

  private restoreFetch() {
    window.fetch = this.originalFetch
    return Promise.resolve()
  }
}

export default new AndroidManifestFixPlugin()
