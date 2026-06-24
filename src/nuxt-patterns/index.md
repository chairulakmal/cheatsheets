# Nuxt Patterns

## Nuxt 4 project structure

Nuxt 4 moved application code into an `app/` directory by default (`app/pages`, `app/components`, `app/composables`), separating the Vue layer from `server/`, root config, and a new `shared/` folder for code both sides import. This sharpens the client/server boundary and speeds up file watching.

```bash
app/          # Vue app: pages, components, composables, layouts
server/       # Nitro: api routes, middleware, plugins, utils
shared/       # code safe to import from both client and server
nuxt.config.ts
```

Migrating from Nuxt 3? Opt into the new defaults incrementally, then drop the flag once you're fully on v4.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
})
```

## useFetch vs useAsyncData

`useFetch` is shorthand for `useAsyncData` + `$fetch`; use `useAsyncData` when you need a custom fetcher or want full control over the cache key.

```typescript
// useFetch — concise, URL is reactive
const { data, pending, error, refresh } = await useFetch<User[]>('/api/users', {
  query: { page: 1 },      // serialised as ?page=1
  pick: ['id', 'name'],    // only extract these keys from the response
})

// useAsyncData — explicit key prevents duplicate requests across components
const { data } = await useAsyncData('users', () =>
  $fetch<User[]>('/api/users')
)
```

## How Nuxt data fetching actually runs

`useFetch`/`useAsyncData` run **on the server during SSR**, serialize the result into the page payload, and the client **reuses it on hydration** rather than refetching. The explicit key dedupes concurrent callers and powers that payload reuse — omit it and Nuxt derives one from the call site, which can collide or duplicate.

```typescript
// Same key → one request, shared result, no second fetch on hydration
const { data } = await useAsyncData('user:42', () => $fetch('/api/users/42'))
```

Two senior rules: always `await` these in `<script setup>` (they block render by design), and never call them inside event handlers or `onMounted` — reach for plain `$fetch` there. Use `transform`/`pick` to shrink what lands in the payload, since everything you return is serialized to the client.

## $fetch for non-reactive requests

Use `$fetch` directly for mutations (POST/PUT/DELETE) or one-shot requests that don't need caching or SSR.

```typescript
async function createPost(title: string) {
  const post = await $fetch('/api/posts', {
    method: 'POST',
    body: { title },
  })
  return post
}
```

## Server-side `$fetch` skips the network

When `$fetch` calls one of your own `/api/*` routes *during server render*, Nitro invokes the handler function directly — no HTTP round-trip, no extra socket. Internal API calls in SSR are nearly free, which is also why `useRequestFetch` exists: to forward the original request's headers into that direct call.

```typescript
// During SSR this does NOT open a real connection to localhost
const stats = await $fetch('/api/stats') // direct Nitro handler invocation
```

## Server routes

Files in `server/api/` are automatically exposed as API endpoints — the filename encodes the HTTP method.

```typescript
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id    = getRouterParam(event, 'id')
  const query = getQuery(event)          // ?foo=bar → { foo: 'bar' }
  const body  = await readBody(event)    // parsed JSON body

  return { id }                          // auto-serialised as JSON
})
```

## Server middleware and Nitro plugins

Files in `server/middleware/` run on **every** server request with no routing — the place for request logging, header parsing, or attaching `event.context.user`. They must not return a value (returning ends the request).

```typescript
// server/middleware/context.ts
export default defineEventHandler((event) => {
  event.context.user = parseUser(getHeader(event, 'authorization'))
})
```

A Nitro plugin (`server/plugins/`) runs once at server startup — use it to open a database connection or hook Nitro lifecycle events like `render:html` or `close`.

```typescript
// server/plugins/db.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('close', () => db.disconnect())
})
```

## Route middleware

Middleware runs before a page renders — use it for auth guards, redirects, or setting page metadata.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useCookie('auth-token')
  if (!user.value) {
    return navigateTo('/login')
  }
})
```

```vue
<script setup lang="ts">
// pages/dashboard.vue
definePageMeta({ middleware: 'auth' })
</script>
```

## definePageMeta

`definePageMeta` sets per-page configuration that Nuxt reads at build time — layout, middleware, and custom meta.

```vue
<script setup lang="ts">
definePageMeta({
  layout:    'dashboard',
  middleware: ['auth'],
  title:     'Settings',    // accessible via route.meta.title
  keepalive: true,
})
</script>
```

## Route validation

`definePageMeta({ validate })` rejects invalid route params before the page renders — returning `false` (or a `createError`) triggers a 404, keeping malformed URLs out of your data layer entirely.

```vue
<script setup lang="ts">
definePageMeta({
  validate: (route) => /^\d+$/.test(route.params.id as string),
})
</script>
```

## useState

`useState` creates SSR-safe shared state — the value is serialised with the page payload so the client gets the exact same value, avoiding hydration mismatches.

```typescript
// composables/useTheme.ts
export const useTheme = () =>
  useState('theme', () => 'light')

// In any component
const theme = useTheme()
theme.value = 'dark' // reactive and shared across all components on this page
```

## callOnce — run logic exactly once

`callOnce` (Nuxt 3.9+) runs a block a single time during SSR and skips it on client hydration — for one-time setup like seeding a store or firing a server-side event that must not run twice.

```typescript
const store = useStore()
await callOnce('init-store', async () => {
  store.items = await $fetch('/api/items') // runs once, on the server
})
```

## Client- and server-only code

Reading `window`, `localStorage`, or `document` during SSR crashes the render. Guard browser-only logic with `import.meta.client` (and server-only work with `import.meta.server`), or defer it to `onMounted`, which never runs on the server.

```typescript
if (import.meta.client) {
  localStorage.setItem('seen', '1') // browser-only, skipped during SSR
}
```

For markup that can only render in the browser — a map, a chart that measures element size — wrap it in `<ClientOnly>` with a fallback to avoid hydration mismatches.

```vue
<template>
  <ClientOnly>
    <MapView />
    <template #fallback><MapSkeleton /></template>
  </ClientOnly>
</template>
```

## useCookie

`useCookie` is an SSR-safe reactive ref backed by a browser cookie — reads and writes work on both server and client without `document.cookie`.

```typescript
const token = useCookie('auth-token', {
  maxAge:   60 * 60 * 24 * 7, // 7 days in seconds
  secure:   true,
  sameSite: 'lax',
  httpOnly: false,             // must be false to be readable in JS
})

token.value = 'abc123' // sets the cookie
token.value = null     // clears the cookie
```

## Plugins

Plugins run once on app startup — use them to register global helpers or configure libraries.

```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.apiBase,
    onResponseError({ response }) {
      if (response.status === 401) navigateTo('/login')
    },
  })
  return { provide: { api } } // use as: const { $api } = useNuxtApp()
})
```

## Error handling

Use `createError` to throw typed HTTP errors; `NuxtErrorBoundary` catches non-fatal errors in a subtree without crashing the whole page.

```typescript
// In a server route:
throw createError({ statusCode: 404, message: 'User not found' })

// In a page — fatal shows the full error screen:
throw createError({ statusCode: 403, fatal: true })
```

```vue
<template>
  <NuxtErrorBoundary @error="logError">
    <RiskyComponent />
    <template #error="{ error }">{{ error.message }}</template>
  </NuxtErrorBoundary>
</template>
```

## Layouts

Create named layout files in `layouts/` and opt in per page with `definePageMeta`.

```vue
<!-- layouts/dashboard.vue -->
<template>
  <div class="dashboard">
    <Sidebar />
    <main><slot /></main>
  </div>
</template>
```

```vue
<!-- pages/settings.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>
```

## Hybrid rendering with routeRules

`routeRules` sets a rendering strategy per route — the key scalability lever, mixing static, ISR, SSR, and SPA in one app.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/':         { prerender: true },       // static at build time (SSG)
    '/blog/**':  { isr: 3600 },             // incremental static regen, 1h
    '/admin/**': { ssr: false },            // client-only SPA
    '/api/data': { cache: { maxAge: 60 } }, // cache the response 60s
  },
})
```

## Lazy data fetching

`useLazyFetch` (or `lazy: true`) returns immediately without blocking navigation — render a skeleton while data streams in.

```vue
<script setup lang="ts">
const { data, pending } = useLazyFetch('/api/products')
</script>

<template>
  <Skeleton v-if="pending" />
  <ProductGrid v-else :items="data" />
</template>
```

## Caching fetched data

`getCachedData` reuses the existing payload across navigations instead of refetching data the client already has.

```typescript
const { data } = await useAsyncData('products', () => $fetch('/api/products'), {
  getCachedData: (key, nuxtApp) =>
    nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
})
```

## Server route caching with Nitro

`cachedEventHandler` caches an endpoint's response in the Nitro layer, offloading repeated expensive work like database aggregation.

```typescript
// server/api/stats.get.ts
export default cachedEventHandler(
  async () => await computeExpensiveStats(),
  { maxAge: 60 * 5 } // cache for 5 minutes
)
```

## Nitro cache storage and SWR

`cachedEventHandler` and `defineCachedFunction` store results in a Nitro storage layer — in-memory by default, but point it at Redis or a KV driver so the cache survives restarts and is shared across instances.

```typescript
// nuxt.config.ts — back the cache with Redis in production
export default defineNuxtConfig({
  nitro: {
    storage: { cache: { driver: 'redis', url: process.env.REDIS_URL } },
  },
})
```

In `routeRules`, `swr: 3600` serves a cached response instantly while revalidating in the background (stale-while-revalidate) — distinct from `isr`, which persists the rendered page to the CDN/edge.

## Pinia with SSR hydration

State set on the server is serialised into the payload and rehydrated on the client automatically — no manual transfer, no double fetch.

```typescript
// In a component or plugin during SSR
const store = useAuthStore()
await store.fetchUser() // runs on the server; state ships in the payload
// The client reuses the same state — no second fetch, no hydration mismatch
```

## Forwarding headers in SSR fetch

On the server, `useRequestFetch` forwards the incoming request's cookies and headers so authenticated calls work during render.

```typescript
const requestFetch = useRequestFetch()
const { data } = await useAsyncData('me', () => requestFetch('/api/me'))
// Forwards the user's auth cookie to the internal API during server render
```

## Security — separate public and private runtime config

Anything in `runtimeConfig.public` is sent to the client — never put secrets there.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only — never exposed to the browser
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret:   process.env.JWT_SECRET,

    public: {
      // Exposed to the client — safe for public API base URLs etc.
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000',
    },
  },
})
```

## Security — validate server route input

`readBody` and `getQuery` return untyped data — always validate before using in queries or business logic.

```typescript
// server/api/posts.post.ts
import { z } from 'zod'

const BodySchema = z.object({
  title:   z.string().min(1).max(200),
  content: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const raw    = await readBody(event)
  const result = BodySchema.safeParse(raw)

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.message })
  }

  const { title, content } = result.data // typed and validated
  return await db.posts.create({ title, content })
})
```

## Security — CORS and CSRF on server routes

Nuxt server routes are accessible to any origin by default — configure CORS explicitly and use CSRF tokens for state-changing requests. For preflight handling, H3 ships `handleCors` / `appendCorsHeaders` as a higher-level alternative to the manual check below.

```typescript
// server/api/data.post.ts
export default defineEventHandler(async (event) => {
  // Restrict which origins may call this endpoint
  const origin = getHeader(event, 'origin')
  const allowed = ['https://yourapp.com']
  if (!origin || !allowed.includes(origin)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // For cookie-based auth, verify a CSRF token from the request header
  const csrf = getHeader(event, 'x-csrf-token')
  if (csrf !== getCookie(event, 'csrf-token')) {
    throw createError({ statusCode: 403, message: 'Invalid CSRF token' })
  }
})
```

## Security — httpOnly auth cookies

Store auth tokens in `httpOnly` cookies so JavaScript cannot read them — this prevents token theft via XSS.

```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  const token = await signJwt({ email }) // your JWT logic

  setCookie(event, 'auth-token', token, {
    httpOnly: true,   // not readable by JS — XSS-safe
    secure:   true,   // HTTPS only
    sameSite: 'lax',  // CSRF mitigation
    maxAge:   60 * 60 * 24 * 7,
  })

  return { ok: true }
})
```

## Security — set security headers via routeRules

Apply security headers globally with `routeRules` (or the `nuxt-security` module) to mitigate clickjacking, MIME sniffing, and XSS.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  },
})
```

## Security — enforce auth on the server, not just middleware

Route middleware only guards the UI; anyone can call `/api/*` directly, so re-check auth inside every protected server route.

```typescript
// server/utils/requireUser.ts
export async function requireUser(event: H3Event) {
  const token = getCookie(event, 'auth-token')
  const user = token ? await verifyJwt(token) : null
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  return user
}
```

```typescript
// server/api/admin/users.get.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event) // enforced server-side
  if (user.role !== 'admin') throw createError({ statusCode: 403 })
  return await db.users.findAll()
})
```

## Security — don't leak state across requests in SSR

Module-level variables are shared by every request on the server; never store per-user data there — use the event context, cookies, or `useState`.

```typescript
// DANGER: shared by every user hitting the server
let currentUser = null

// SAFE: per-request state, isolated between users
export default defineEventHandler((event) => {
  event.context.user = getUserFromRequest(event)
})
```
