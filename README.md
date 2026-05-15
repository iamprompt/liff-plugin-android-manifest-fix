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

This plugin hooks into `liff.init()` to temporarily intercept `fetch` during
initialization, appending a `t=<timestamp>` query parameter to every request
matching `liffsdk.line-scdn.net/xlt/`. Once `liff.init()` completes, the
original `fetch` is restored.

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
import androidManifestFixPlugin from 'liff-plugin-android-manifest-fix'

liff.use(androidManifestFixPlugin)

liff.init({ liffId: 'YOUR_LIFF_ID' }).then(() => {
  // your app logic
})
```

You can also import the class directly to create your own instance:

```typescript
import liff from '@line/liff'
import { AndroidManifestFixPlugin } from 'liff-plugin-android-manifest-fix'

liff.use(new AndroidManifestFixPlugin())
```

## Usage (CDN / `<script>` tag)

Include the IIFE build **before** the LIFF SDK initialisation:

```html
<script src="https://unpkg.com/liff-plugin-android-manifest-fix/dist/browser.js"></script>
<script src="https://static.line-scdn.net/liff/edge/versions/2.25.0/sdk.js"></script>
<script>
  liff.use(androidManifestFixPlugin)

  liff.init({ liffId: 'YOUR_LIFF_ID' }).then(function () {
    // your app logic
  })
</script>
```

> **Note:** When loaded via `<script>` tag, the plugin instance is available directly
> as the global variable `androidManifestFixPlugin`.

## How it works

1. The original `fetch` is captured at construction time and bound to `globalThis`.
2. `liff.use(plugin)` registers the plugin; `install()` hooks into `liff.init()` via the [LIFF Plugin API Hook](https://developers.line.biz/en/docs/liff/liff-plugin/#liff-api-hook).
3. **Before** `liff.init()` runs: `fetch` is replaced with a thin wrapper that appends `?t=<Date.now()>` (via the URL API) to every request matching `liffsdk.line-scdn.net/xlt`.
4. **After** `liff.init()` completes: the original `fetch` is restored — the wrapper is only active during initialization.
5. All non-manifest requests are forwarded to the original `fetch` untouched during initialization.

## License

MIT
