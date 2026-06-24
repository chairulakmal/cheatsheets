# Nuxt

Nuxt is a framework built on top of Vue that adds server-side rendering, file-based routing, and automatic imports. It handles the configuration so you can focus on building features instead of wiring things together.

---

## Folder structure

Nuxt uses conventions over configuration. Drop a `.vue` file in `pages/` and it becomes a route automatically — no router config needed.

```text
pages/
  index.vue         ← the home page (/)
  about.vue         ← /about
  blog/
    index.vue       ← /blog
    [slug].vue      ← /blog/any-post-slug
components/
  AppNav.vue        ← auto-imported everywhere
composables/
  useCounter.ts     ← auto-imported everywhere
server/
  api/
    hello.get.ts    ← GET /api/hello
app.vue             ← root component (wraps all pages)
nuxt.config.ts      ← framework configuration
```

---

## Pages

Any `.vue` file inside `pages/` becomes a page. The `<template>` is what the user sees.

```html
<!-- pages/about.vue -->
<template>
  <main>
    <h1>About Us</h1>
    <p>We build things for the web.</p>
  </main>
</template>
```

---

## Dynamic routes

Wrap a filename in square brackets to create a dynamic segment. Access the value with `useRoute`.

```html
<!-- pages/blog/[slug].vue -->
<script setup>
const route = useRoute();
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`);
</script>

<template>
  <article>
    <h1>{{ post?.title }}</h1>
    <p>{{ post?.body }}</p>
  </article>
</template>
```

---

## useFetch — data fetching

`useFetch` fetches data on the server and passes the result to the client — no extra API call needed on page load.

```html
<script setup>
const { data, pending, error } = await useFetch("/api/posts");
</script>

<template>
  <div v-if="pending">Loading…</div>
  <div v-else-if="error">Something went wrong.</div>
  <ul v-else>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

---

## Layouts

A layout wraps pages with shared chrome (navigation, footer). Create one in `layouts/` and opt in per page.

```html
<!-- layouts/default.vue -->
<template>
  <div>
    <header><nav>My Site</nav></header>
    <main><slot /></main>
    <footer>© 2025</footer>
  </div>
</template>
```

Use a custom layout in a page:

```html
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({ layout: "dashboard" });
</script>

<template>
  <h1>Dashboard</h1>
</template>
```

---

## Components — auto-import

Components in `components/` are automatically available everywhere — no `import` statement needed.

```html
<!-- components/AppButton.vue -->
<script setup>
defineProps<{ label: string }>();
</script>

<template>
  <button class="btn">{{ label }}</button>
</template>
```

```html
<!-- pages/index.vue — AppButton used without importing -->
<template>
  <AppButton label="Click me" />
</template>
```

---

## Composables — reusable logic

A composable is a function that encapsulates reactive state and logic. Files in `composables/` are auto-imported.

```typescript
// composables/useCounter.ts
export function useCounter(start = 0) {
  const count = ref(start);
  function increment() { count.value++; }
  function decrement() { count.value--; }
  return { count, increment, decrement };
}
```

```html
<!-- pages/index.vue -->
<script setup>
const { count, increment } = useCounter(10);
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

```demo
import { createApp, ref } from "vue";

createApp({
  setup() {
    const count = ref(10);
    return { count };
  },
  template: `
    <div style="font-family:system-ui;padding:12px">
      <p style="margin-bottom:8px">
        Composables wrap reactive state — <code>useCounter</code> could live in <code>composables/useCounter.ts</code>.
      </p>
      <button @click="count++" style="padding:6px 16px;border-radius:6px;cursor:pointer">
        Count: {{ count }}
      </button>
    </div>
  `,
}).mount("#app");
```

---

## Navigation with NuxtLink

Use `<NuxtLink>` instead of `<a>` for internal links — it handles client-side navigation and prefetching.

```html
<template>
  <nav>
    <NuxtLink to="/">Home</NuxtLink>
    <NuxtLink to="/about">About</NuxtLink>
    <NuxtLink to="/blog">Blog</NuxtLink>
  </nav>
</template>
```

Navigate programmatically with `navigateTo`:

```html
<script setup>
async function handleLogin() {
  // ... do auth ...
  await navigateTo("/dashboard");
}
</script>
```

---

## Server API routes

Create files in `server/api/` to define API endpoints. The filename sets the path and HTTP method.

```typescript
// server/api/hello.get.ts  → GET /api/hello
export default defineEventHandler(() => {
  return { message: "Hello!" };
});
```

```typescript
// server/api/user.post.ts  → POST /api/user
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return { received: body };
});
```

---

## useHead — page metadata

Set the page title and meta tags from any component using `useHead`. Nuxt updates the `<head>` automatically.

```html
<script setup>
useHead({
  title: "My Blog",
  meta: [
    { name: "description", content: "Articles about web development." },
  ],
});
</script>
```

For SEO-friendly social previews, use `useSeoMeta`:

```html
<script setup>
useSeoMeta({
  title: "My Post Title",
  description: "A short summary of the post.",
  ogImage: "https://mysite.com/og.png",
});
</script>
```

---

## Middleware

Route middleware runs before a page loads — useful for authentication checks. Create a file in `middleware/`.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const loggedIn = false; // replace with real auth check
  if (!loggedIn) {
    return navigateTo("/login");
  }
});
```

Apply it to a page with `definePageMeta`:

```html
<script setup>
definePageMeta({ middleware: "auth" });
</script>
```

---

## Environment variables

Store secrets in `.env` (not committed to git). Expose public values in `nuxt.config.ts` under `runtimeConfig`.

```bash
# .env
DATABASE_URL=postgres://localhost/mydb
NUXT_PUBLIC_SITE_URL=https://mysite.com
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,  // server-only
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,  // available in browser
    },
  },
});
```

```html
<script setup>
const config = useRuntimeConfig();
console.log(config.public.siteUrl);  // safe to use in browser
</script>
```

---

## nuxt.config.ts — common options

```typescript
export default defineNuxtConfig({
  ssr: true,                    // server-side rendering (default)
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/main.css"],
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      link: [{ rel: "icon", href: "/favicon.ico" }],
    },
  },
});
```

---

## Shared state with useState

`useState` creates state shared across components and safe for server-side rendering — use it instead of a plain `ref` for app-wide values.

```typescript
// composables/useCart.ts
export const useCart = () => useState<string[]>("cart", () => []);
```

```html
<script setup>
const cart = useCart();  // same value everywhere, survives SSR hydration
</script>
```

A module-level `ref` would be shared across all users on the server — `useState` keeps each request's state separate.

---

## Error handling

Throw an error with `createError` to stop rendering and show an error response. Set `fatal: true` to render the full-screen error page.

```typescript
// server/api/post/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }
});
```

Customise the error page by creating `error.vue` in the project root.

```html
<!-- error.vue -->
<script setup>
defineProps<{ error: { statusCode: number } }>();
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <NuxtLink to="/">Go home</NuxtLink>
  </div>
</template>
```
