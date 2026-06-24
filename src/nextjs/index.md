# Next.js

Next.js is a framework built on top of React that adds server-side rendering, file-based routing, and built-in optimisations. It lets you build full web applications — not just the UI layer, but also the server-side logic — in a single project.

---

## App Router — folder structure

Next.js 13+ uses the **App Router**. Every folder inside `app/` becomes a route. A file named `page.tsx` is what visitors see at that URL.

```text
app/
  layout.tsx        ← shared wrapper for all pages
  page.tsx          ← the home page (/)
  about/
    page.tsx        ← /about
  blog/
    page.tsx        ← /blog
    [slug]/
      page.tsx      ← /blog/any-post-slug
```

---

## Page component

A page is a plain React component exported as the default from `page.tsx`. No special setup needed.

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return (
    <main>
      <h1>About Us</h1>
      <p>We build things for the web.</p>
    </main>
  );
}
```

---

## Layout

A layout wraps every page in its folder (and sub-folders). Use it for navigation, fonts, or any chrome that should stay on screen between page changes.

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>My Site</nav>
        {children}
      </body>
    </html>
  );
}
```

---

## Server Components vs Client Components

By default, every component in the App Router is a **Server Component** — it runs on the server and sends plain HTML. To use browser APIs or React hooks like `useState`, mark the file as a **Client Component** with `"use client"` at the top.

```typescript
// Server Component — no "use client", runs on the server
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts");
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

```typescript
// Client Component — "use client" at the top
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

```demo
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ fontFamily: "system-ui", padding: 8 }}>
      <p style={{ marginBottom: 8 }}>
        Client components use React hooks like <code>useState</code>.
      </p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}
      >
        Clicked {count} time{count !== 1 ? "s" : ""}
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Counter />);
```

---

## Data fetching in Server Components

Server Components can be `async` functions — call `fetch` directly. Since Next.js 15, fetch results aren't cached by default; opt in with `next: { revalidate }` (or `cache: "force-cache"`).

```typescript
// app/user/page.tsx
async function getUser() {
  const res = await fetch("https://api.example.com/user/1", {
    next: { revalidate: 60 },  // cache and re-fetch at most every 60 seconds
  });
  return res.json();
}

export default async function UserPage() {
  const user = await getUser();
  return <h1>Hello, {user.name}</h1>;
}
```

---

## Dynamic routes

Wrap a folder name in square brackets to make it a dynamic segment. The value arrives in `params`, which is a **Promise** in Next.js 15+ — `await` it.

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

---

## Navigation with Link

Use the `<Link>` component instead of `<a>` for client-side navigation — it prefetches pages and avoids a full reload.

```typescript
import Link from "next/link";

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/hello-world">A Post</Link>
    </nav>
  );
}
```

---

## Programmatic navigation

Use the `useRouter` hook inside a Client Component to navigate in response to events (form submit, button click, etc.).

```typescript
"use client";
import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();

  function handleLogin() {
    // ... do auth ...
    router.push("/dashboard");  // navigate programmatically
  }

  return <button onClick={handleLogin}>Log in</button>;
}
```

---

## Metadata

Export a `metadata` object from any `page.tsx` or `layout.tsx` to set the page title and description. Next.js injects these into the `<head>` automatically.

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Blog",
  description: "Articles about web development.",
};

export default function BlogPage() {
  return <main>...</main>;
}
```

For dynamic titles (based on data), export a `generateMetadata` function (`params` is a Promise here too):

```typescript
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());
  return { title: post.title };
}
```

---

## Route Handlers (API routes)

Create a file named `route.ts` inside `app/` to define an API endpoint. Export a function named after the HTTP method.

```typescript
// app/api/hello/route.ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ message: "Hello!" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

This endpoint is available at `/api/hello`.

---

## Loading and error states

Place a `loading.tsx` file next to a `page.tsx` to show a skeleton while the page fetches data. Place `error.tsx` to show a message when something goes wrong.

```typescript
// app/blog/loading.tsx
export default function Loading() {
  return <p>Loading posts…</p>;
}
```

```typescript
// app/blog/error.tsx
"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div>
      <p>Something went wrong.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Optimised Image

Use `next/image` instead of `<img>` — it resizes, compresses, and lazy-loads images automatically.

```typescript
import Image from "next/image";

export default function Avatar() {
  return (
    <Image
      src="/avatar.png"
      alt="User avatar"
      width={80}
      height={80}
      priority  // load immediately (above the fold)
    />
  );
}
```

---

## Environment variables

Store secrets in `.env.local` (not committed to git). Prefix a variable with `NEXT_PUBLIC_` to make it available in the browser.

```bash
# .env.local
DATABASE_URL=postgres://localhost/mydb
NEXT_PUBLIC_SITE_URL=https://mysite.com
```

```typescript
// Server-only (safe for secrets)
const dbUrl = process.env.DATABASE_URL;

// Available in the browser (public, not secret)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
```
