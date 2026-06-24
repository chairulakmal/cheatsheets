# React Patterns

Senior-level patterns and pitfalls for React 19. Assumes you know the basics (`useState`, `useEffect`, JSX) — the focus here is on the hooks, composition techniques, and concurrent features you reach for in larger apps, plus the tradeoffs that decide which to use. Examples target **React 19**; version-specific APIs are called out inline.

## Custom hooks — extract stateful logic

A custom hook is any function named `useXxx` that calls other hooks; it shares *logic*, not state — each call site gets its own independent state.

```tsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;
}
```

Bound by the **Rules of Hooks**: call them at the top level, in the same order every render — never in conditionals or loops. The `eslint-plugin-react-hooks` rule is non-negotiable; React tracks hook state by call order, so a conditional hook corrupts it.

```demo
import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}

function Demo() {
  const [on, toggle] = useToggle();
  return <button onClick={toggle}>{on ? "ON" : "OFF"} — click to toggle</button>;
}

createRoot(document.getElementById("root")).render(<Demo />);
```

## useReducer — state transitions as data

Prefer `useReducer` over multiple `useState` calls when the next state depends on the previous one or several fields change together — it centralizes transitions and is easier to test.

```tsx
type Action = { type: 'inc' } | { type: 'set'; value: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'inc': return state + 1;
    case 'set': return action.value;
  }
}
```

```tsx
const [count, dispatch] = useReducer(reducer, 0);
dispatch({ type: 'inc' });
```

The reducer must be pure — no fetches or mutations — which is exactly what makes the logic unit-testable in isolation.

```demo
import { useReducer } from "react";
import { createRoot } from "react-dom/client";

function reducer(state, action) {
  if (action.type === "inc") return state + 1;
  if (action.type === "dec") return state - 1;
  return 0; // reset
}

function Demo() {
  const [count, dispatch] = useReducer(reducer, 0);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => dispatch({ type: "dec" })}>−</button>
      <strong style={{ fontSize: 18 }}>{count}</strong>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "reset" })}>reset</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
```

## Context — and its re-render trap

`createContext` shares values without prop-drilling, but **every consumer re-renders whenever the provider's value changes** — and a new object literal as `value` changes identity every render.

```tsx
const ThemeContext = createContext<Theme | null>(null);

// Memoize the value so unrelated re-renders don't cascade
const value = useMemo(() => ({ dark, toggle }), [dark]);
return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
```

For frequently-changing state, split state and dispatch into separate contexts (or reach for a store like Zustand) so a value change doesn't re-render components that only dispatch. Context is for low-frequency global data, not a general state manager.

```demo
import { createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";

const ThemeContext = createContext("light");

function Label() {
  const theme = useContext(ThemeContext);
  return <p>Theme from context: <strong>{theme}</strong></p>;
}

function Demo() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      <Label />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle theme
      </button>
    </ThemeContext.Provider>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
```

## Memoization — and the React Compiler

Because React re-renders subtrees by default, `memo`, `useMemo`, and `useCallback` prevent wasted work and keep object/function identities stable across renders.

```tsx
const Row = memo(function Row({ item }: { item: Item }) { /* ... */ });
const sorted = useMemo(() => items.sort(byName), [items]);
const onPick = useCallback((id: string) => select(id), []);
```

`useMemo` is a **performance hint, not a guarantee** — React may discard it, so never put load-bearing logic inside. The **React Compiler** (React 19 era) auto-inserts this memoization, steadily retiring the hand-written boilerplate; understand the model anyway for debugging and for code the compiler can't prove safe.

## Refs for mutable values

`useRef` holds a mutable `.current` that persists across renders without triggering one — for timer ids, previous values, or the "latest value" pattern that dodges stale closures in long-lived callbacks.

```tsx
const latest = useRef(value);
useEffect(() => { latest.current = value });

useEffect(() => {
  const id = setInterval(() => console.log(latest.current), 1000);
  return () => clearInterval(id); // always reads the freshest value
}, []);
```

## useId — stable SSR-safe ids

`useId` generates an id that matches between server and client render, avoiding hydration mismatches — use it for `label`/`aria` wiring, never for list keys.

```tsx
const id = useId();
return <><label htmlFor={id}>Email</label><input id={id} /></>;
```

## useTransition and useDeferredValue

Concurrent React lets you mark updates as non-urgent so a slow render doesn't block typing. `useTransition` wraps the state update; `useDeferredValue` defers a derived value.

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(input)); // keeps the input responsive
```

```tsx
const deferredQuery = useDeferredValue(query); // lags behind under load
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

Reach for these when an expensive filter/render makes input feel janky — they trade slight result staleness for a responsive UI.

```demo
import { useState, useTransition } from "react";
import { createRoot } from "react-dom/client";

const items = Array.from({ length: 3000 }, (_, i) => "Item " + i);

function Demo() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState(items);
  const [isPending, startTransition] = useTransition();

  function onChange(e) {
    const v = e.target.value;
    setQuery(v);
    startTransition(() => setList(items.filter((x) => x.includes(v))));
  }

  return (
    <div>
      <input value={query} onChange={onChange} placeholder="Filter 3000 items…" />
      <p>{isPending ? "updating…" : list.length + " matches"}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
```

## useSyncExternalStore — subscribe to external state

The correct way to read from a store outside React (a browser API, a vanilla store) without tearing during concurrent rendering. The third argument supplies a server snapshot for SSR.

```tsx
const width = useSyncExternalStore(
  (cb) => { addEventListener('resize', cb); return () => removeEventListener('resize', cb); },
  () => window.innerWidth, // client snapshot
  () => 1024,              // server snapshot
);
```

## Error boundaries

Only a class component can catch render errors in its subtree; there is still no hook equivalent. Pair it with a reset key so recovery is possible.

```tsx
class ErrorBoundary extends React.Component<Props, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { report(error, info); }
  render() { return this.state.error ? this.props.fallback : this.props.children; }
}
```

Error boundaries catch render/lifecycle errors only — **not** event handlers or async code; handle those with `try/catch`.

## Suspense and lazy

`Suspense` shows a fallback while a lazy component or a suspending data read resolves — coordinating one loading state for a whole subtree.

```tsx
const Chart = lazy(() => import('./Chart'));

<Suspense fallback={<Spinner />}>
  <Chart />
</Suspense>
```

## Resetting state with `key`

Changing a component's `key` unmounts and remounts it, discarding all its state — the idiomatic way to reset a form or re-init a component when an identity changes.

```tsx
<UserForm key={userId} user={user} /> // fully resets when userId changes
```

This is cleaner than an effect that imperatively resets state on a prop change, and it's the React-blessed answer to "how do I reset state when a prop changes."

```demo
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Field() {
  const [text, setText] = useState("");
  return (
    <input value={text} onChange={(e) => setText(e.target.value)}
      placeholder="type, then reset" />
  );
}

function Demo() {
  const [k, setK] = useState(0);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Field key={k} />
      <button onClick={() => setK(k + 1)}>Reset field</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
```

## Controlled vs uncontrolled

A controlled input drives its value from state (predictable, validate-on-change); an uncontrolled input keeps its own DOM state and you read it via a ref (less code, fewer re-renders).

```tsx
// Controlled — React owns the value
<input value={name} onChange={(e) => setName(e.target.value)} />

// Uncontrolled — the DOM owns it; read on submit
<input ref={inputRef} defaultValue="" />
```

Default to controlled for anything you validate or react to live; reach for uncontrolled for large simple forms where per-keystroke re-renders cost more than they're worth.

## `use()` — read promises and context (React 19)

The `use` API unwraps a promise (suspending until it resolves) or reads context — and unlike hooks, it **may** be called conditionally.

```tsx
function Comment({ promise }: { promise: Promise<string> }) {
  const text = use(promise); // suspends until resolved
  const theme = use(ThemeContext); // also reads context
  return <p className={theme}>{text}</p>;
}
```

## Form actions (React 19)

React 19 turns `<form action={fn}>` into a first-class data-mutation primitive. `useActionState` tracks the result and pending state of an action.

```tsx
const [state, action, pending] = useActionState(submitFn, initialState);
return <form action={action}><button disabled={pending}>Save</button></form>;
```

`useFormStatus` reads the parent form's pending state from a nested component without prop-drilling; `useOptimistic` shows an optimistic result while the action is in flight.

```tsx
const [optimistic, addOptimistic] = useOptimistic(items, (cur, next) => [...cur, next]);
```

## You might not need an effect

The most common senior correction in React reviews: data derived from props/state should be **computed during render**, not synced via an effect. Effects are for synchronizing with *external* systems (network, subscriptions, non-React widgets).

```tsx
// ❌ effect + state to derive a value
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// ✅ just compute it
const fullName = `${first} ${last}`;
```

Each unnecessary effect adds a render pass, a stale-closure risk, and a dependency array to maintain.

## StrictMode

In development, `StrictMode` deliberately double-invokes renders and mounts/unmounts/remounts every component to surface missing effect cleanup and impure renders. It does nothing in production.

```tsx
<StrictMode><App /></StrictMode>
```

If a feature breaks only under StrictMode's double-mount, the code has a latent bug (usually missing cleanup or a render side effect) — fix the code, don't remove StrictMode.

## Security — `dangerouslySetInnerHTML`

JSX escapes interpolated values by default, so `{userInput}` is XSS-safe. `dangerouslySetInnerHTML` opts out of that protection — only ever feed it sanitized HTML.

```tsx
import DOMPurify from 'dompurify';

// DANGER: raw user HTML can run <script> / onerror handlers
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// SAFE: sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userBio) }} />
```

## Security — URL and link injection

A user-controlled `href` can carry a `javascript:` URL that executes on click. Validate the protocol before rendering any link or redirect target.

```tsx
function safeHref(url: string): string {
  const ok = /^(https?:|mailto:|\/)/i.test(url.trim());
  return ok ? url : '#';
}

<a href={safeHref(link)} rel="noopener noreferrer">Visit</a>
```

## Security — serialized state on the server

When you embed server state into HTML (SSR hydration, a `__DATA__` script), an unescaped `<` in the JSON can break out into a `<script>` tag. Escape it, and never serialize secrets into client-visible state.

```tsx
const json = JSON.stringify(data).replace(/</g, '\\u003c'); // break out of </script>
// <script id="data" type="application/json">{json}</script>
```

Treat anything that reaches the client bundle or payload as public — API keys and tokens belong on the server only.
