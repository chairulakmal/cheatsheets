# Next.js Patterns

Senior-level patterns for the Next.js **App Router**, current as of **Next.js 16**. The mental model that drives everything: components render on the **server by default**, you opt into client interactivity explicitly, and data is **dynamic (uncached) by default** — you choose what to cache. Version-specific APIs are flagged inline; several changed in Next 16 (`proxy.ts`, fully-async request APIs, Cache Components).

## App Router structure

Each folder under `app/` is a route segment; special files give it behavior. Components are **Server Components** unless marked otherwise.

```bash
app/
  layout.tsx     # shared shell (persists across navigation)
  page.tsx       # the route's UI
  loading.tsx    # Suspense fallback while the segment streams
  error.tsx      # error boundary (Client Component)
  not-found.tsx  # 404 UI
```

Layouts preserve state and don't re-render on navigation between their children — put providers and chrome there, not in pages.

## Server vs Client Components

Server Components render on the server, ship zero JS, and can be `async` and touch the database directly. Add `'use client'` only when you need state, effects, or browser events — and keep it at the **leaves** of the tree.

```tsx
'use client';
import { useState } from 'react';

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

`'use client'` marks a boundary: everything imported below it ships to the browser. Pushing it down the tree keeps bundles small; passing Server Components as `children` to a Client Component avoids dragging the whole subtree client-side.

## Data fetching in Server Components

Fetch directly in an `async` Server Component — no `useEffect`, no loading-state plumbing, no client waterfall. Identical `fetch` calls within one render are automatically deduped (request memoization).

```tsx
export default async function Page() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());
  return <PostList posts={posts} />;
}
```

This keeps data on the server, sends only HTML, and never exposes API credentials to the client.

## Caching with Cache Components (Next 16)

In Next 16, data is **dynamic by default** — `fetch` is no longer implicitly cached. Opt into caching explicitly with the `use cache` directive, enabled by the `cacheComponents` config flag.

```typescript
// next.config.ts
export default { cacheComponents: true } satisfies NextConfig;
```

```tsx
async function getProducts() {
  'use cache'; // cache this function's result (data- or UI-level)
  return db.products.findAll();
}
```

With `cacheComponents`, Partial Prerendering is the default: a static shell is prerendered and dynamic holes stream in — you no longer choose static-vs-dynamic per route, you cache per component.

## Route handlers

A `route.ts` exports functions named for HTTP methods — the App Router replacement for `pages/api`.

```typescript
// app/api/users/route.ts
export async function GET() {
  return Response.json(await db.users.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(await db.users.create(body), { status: 201 });
}
```

## Server Actions

`'use server'` marks an async function as a server-only mutation that the client can call directly — wire it to a `<form action>` or call it from an event handler.

```tsx
async function createPost(formData: FormData) {
  'use server';
  await db.posts.create({ title: formData.get('title') });
  revalidateTag('posts', 'max'); // Next 16: a cache-life profile is required
}
```

Two Next 16 additions for Server Actions: `updateTag()` gives read-your-writes (expire and re-read fresh data in the same request), and `refresh()` refreshes uncached data only.

## Async request APIs (Next 16)

`cookies()`, `headers()`, `params`, and `searchParams` are now **fully async** — the synchronous access allowed in v15 was removed. Every page, layout, and handler that reads them must `await`.

```tsx
import { cookies } from 'next/headers';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;            // params is a Promise in Next 16
  const token = (await cookies()).get('token');
  return <Profile id={id} authed={!!token} />;
}
```

## proxy.ts — request guards (Next 16)

Next 16 renamed `middleware.ts` to **`proxy.ts`**; a `middleware.ts` file is now ignored. Export a function named `proxy`. It runs in the **Node.js runtime** (the Edge runtime is not supported in `proxy`).

```typescript
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (!request.cookies.get('session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = { matcher: ['/dashboard/:path*'] };
```

Use it for cheap edge-of-request checks (redirects, header rewrites) — not heavy auth logic, which belongs in the route or action it protects.

## Route segment config

Export reserved constants from a `layout`/`page`/`route` to control rendering and revalidation for that segment.

```typescript
export const dynamic = 'force-static';  // or 'force-dynamic'
export const revalidate = 3600;         // ISR: revalidate at most hourly
export const runtime = 'nodejs';        // or 'edge'
```

## generateStaticParams

Pre-render dynamic routes at build time by enumerating their params — the App Router's `getStaticPaths`.

```tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug })); // one static page per slug
}
```

## Streaming with Suspense

A `loading.tsx` wraps the segment in Suspense automatically, but you can also stream individual slow parts so the fast content paints immediately.

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<RowsSkeleton />}>
        <SlowTable /> {/* streams in when its data resolves */}
      </Suspense>
    </>
  );
}
```

## Metadata API

Export static `metadata` or an async `generateMetadata` to produce SEO tags on the server — no client-side document mutation.

```tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post.title, description: post.excerpt };
}
```

## Optimized images and fonts

`next/image` lazy-loads, serves modern formats, and reserves space to prevent layout shift; `next/font` self-hosts fonts at build time, eliminating the render-blocking request and CLS.

```tsx
import Image from 'next/image';
<Image src={hero} alt="Hero" width={1200} height={600} priority />;
```

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] }); // self-hosted, zero layout shift
```

## Navigation

In the App Router, navigation hooks come from `next/navigation` (not `next/router`). Redirect from the server with `redirect()`; navigate on the client with `useRouter`.

```tsx
import { redirect } from 'next/navigation';
redirect('/login'); // in a Server Component or action
```

```tsx
'use client';
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

## Parallel and intercepting routes

`@slot` folders render multiple independent pages into one layout (dashboards, split views); `(.)folder` intercepts a route to render it in the current context — the canonical "photo opens in a modal, but its URL still deep-links" pattern.

```bash
app/
  @team/page.tsx        # parallel slot, rendered alongside children
  @analytics/page.tsx
  photo/(.)[id]/page.tsx # intercepts /photo/[id] as a modal
```

## Security — environment variables

Only variables prefixed `NEXT_PUBLIC_` are inlined into the client bundle; everything else stays server-only. Never prefix a secret.

```typescript
const api = process.env.NEXT_PUBLIC_API_URL; // shipped to the browser
const dbUrl = process.env.DATABASE_URL;       // server-only — safe
```

## Security — authorize inside every Server Action

Server Actions and route handlers are **public HTTP endpoints**. A `proxy.ts` guard protects page *navigation*, not direct POSTs, so re-check authentication and authorization inside every mutation.

```tsx
async function deletePost(id: string) {
  'use server';
  const user = await getCurrentUser();
  if (user?.role !== 'admin') throw new Error('Unauthorized');
  await db.posts.delete(id);
}
```

Validate the input too (Zod) — `formData` and JSON bodies are untrusted, exactly like any other API surface.
