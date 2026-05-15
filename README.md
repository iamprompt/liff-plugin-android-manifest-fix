# liff-plugin-android-manifest-fix

A [LIFF](https://developers.line.biz/en/docs/liff/overview/) plugin that fixes
Android WebView manifest fetch errors caused by aggressive HTTP caching.

## Why it exists

On certain Android devices, the WebView caches the LIFF SDK's internal
`manifest.json` indefinitely. When LINE updates the SDK, the stale cached
manifest causes fetch errors such as:

```
Failed to fetch https://liffsdk.line-scdn.net/xlt/.../manifest.json
```

This plugin intercepts `window.fetch` and appends a `t=<timestamp>` query
parameter to every request matching `liffsdk.line-scdn.net/xlt/`, effectively
bypassing the cache on each app load.

## Installation

```bash
npm install liff-plugin-android-manifest-fix
# or
yarn add liff-plugin-android-manifest-fix
# or
pnpm add liff-plugin-android-manifest-fix
```

`@line/liff` is a peer dependency — install it separately if you haven't
already:

```bash
npm install @line/liff
```

## Usage (npm / bundler)

```typescript
import liff from '@line/liff'
import { androidManifestFixPlugin } from 'liff-plugin-android-manifest-fix'

liff.use(androidManifestFixPlugin)

liff.init({ liffId: 'YOUR_LIFF_ID' }).then(() => {
  // your app logic
})
```

## Usage (CDN / `<script>` tag)

Include the IIFE build **before** the LIFF SDK initialisation:

```html
<script src="https://unpkg.com/liff-plugin-android-manifest-fix/dist/index.global.js"></script>
<script src="https://static.line-scdn.net/liff/edge/versions/2.25.0/sdk.js"></script>
<script>
  liff.use(AndroidManifestFixPlugin.default)

  liff.init({ liffId: 'YOUR_LIFF_ID' }).then(function () {
    // your app logic
  })
</script>
```

> **Note:** When loaded via `<script>` tag, the global variable is
> `AndroidManifestFixPlugin`. The plugin object itself is at
> `AndroidManifestFixPlugin.default`.

## How it works

1. On `install()`, the plugin replaces `globalThis.fetch` with a thin wrapper.
2. For any request whose URL contains `liffsdk.line-scdn.net/xlt/`, the wrapper
   appends `?t=<Date.now()>` (using the URL API, which correctly handles
   existing query parameters).
3. All other requests are forwarded to the original `fetch` untouched.
4. If `install()` is called more than once, subsequent calls are a no-op —
   the fetch function is never double-wrapped.

## License

MIT
