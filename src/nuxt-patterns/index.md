# Nuxt Patterns

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

Nuxt server routes are accessible to any origin by default — configure CORS explicitly and use CSRF tokens for state-changing requests.

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
