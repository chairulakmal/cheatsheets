# React vs Vue

A side-by-side reference for working frontend engineers. The API surface (state, effects, refs, derived values) is easy to memorize — what actually matters is the **reactivity model underneath**, because that single difference explains almost every other divergence: why React needs `useMemo` and Vue mostly doesn't, why Vue mutates state and React replaces it, and where each framework's footguns live. Read the first section before the cheat-sheet sections; everything else follows from it.

## The one difference that explains everything

The frameworks disagree on a single question: **when state changes, how does the framework know what to update?**

- **React re-renders by default.** When state changes, React re-runs the component function and, by default, every component below it. It then diffs the new virtual DOM against the old one and patches the difference. React does not track *which* piece of state a component reads — it just re-runs everything and relies on the diff (and on you adding memoization) to keep it cheap.
- **Vue tracks dependencies.** Vue wraps reactive state in ES Proxies. When a component renders, Vue records exactly which reactive values it read. When one of those values changes, Vue re-runs **only** the effects that depended on it — usually just that one component, often just one DOM node.

Hold onto this framing:

| | React | Vue |
|---|---|---|
| Update trigger | State setter called | Reactive value mutated |
| Granularity | Re-render component + subtree | Re-run only dependent effects |
| Dependency tracking | None — you list deps manually | Automatic at runtime |
| Default performance | Needs memoization to prune | Pruned by default |
| State updates | Immutable (replace) | Mutable (in place) |

Neither is "faster" in the abstract. React's model is simpler to reason about (a render is a pure function of props + state) but pushes performance work onto you. Vue's model is faster by default but adds a layer of runtime magic you occasionally have to understand to debug.

## Vue 3 — reactivity primitives

Vue's reactivity is a small set of functions. The mental model: you create reactive containers, read and mutate them normally, and Vue re-runs whatever depended on them.

### `ref` — reactive primitive (and the safe default)

`ref` wraps any value — primitive or object — in a reactive container. You read and write through `.value` in script; templates auto-unwrap it.

```javascript
const count = ref(0)
count.value++              // .value required in <script>
// in template: {{ count }} — Vue unwraps it for you
```

The `.value` ceremony is the price of a reactivity container that survives being passed around. Because a `ref` is an object, you can return it from a composable, pass it as an argument, or destructure it from an object without losing reactivity — the reactive link lives on the object, not the binding.

### `reactive` — reactive object (with a sharp edge)

`reactive` makes an object deeply reactive with no `.value` — you mutate properties directly.

```javascript
const property = reactive({ address: '渋谷', price: 5000 })
property.price = 6000      // direct mutation, no setter, no .value
```

The sharp edge: **reactivity lives on the proxy, so destructuring or spreading breaks it.** Pull a primitive out and you get a disconnected snapshot:

```javascript
const { price } = reactive({ price: 5000 })
// `price` is now a plain number — mutating it updates nothing
```

Use `toRefs` to destructure without losing the link:

```javascript
const state = reactive({ address: '渋谷', price: 5000 })
const { price } = toRefs(state) // price is now a ref → price.value works
```

**Senior guidance:** prefer `ref` consistently. Mixing `ref` and `reactive` forces every reader to track which mental model applies to which variable. A codebase that uses `ref` everywhere pays the `.value` tax but never hits the destructuring trap, and composables compose cleanly. `reactive` is fine for a self-contained local object you never destructure.

### `computed` — derived value with a real cache guarantee

`computed` derives a value from other reactive state. It is **lazy** (only evaluates when read) and **cached** (re-evaluates only when a tracked dependency actually changes).

```javascript
const summary = computed(() => `${property.address} — ¥${property.price}`)
// recomputes only when property.address or property.price changes
```

This caching is a **semantic guarantee**, not a hint — a detail that matters when you compare it to React's `useMemo` below. `computed` can also be writable with a getter/setter pair:

```javascript
const fullName = computed({
  get: () => `${first.value} ${last.value}`,
  set: (v) => { [first.value, last.value] = v.split(' ') },
})
```

### `watch` — explicit watcher with old + new values

`watch` runs a callback when a specific source changes. It is **lazy** (does not run on setup unless you pass `{ immediate: true }`) and hands you both the new and old value.

```javascript
watch(propertyId, (newId, oldId) => {
  if (newId !== oldId) fetchProperty(newId)
})
```

Watch a getter to react to a derived or nested value, and reach for `{ deep: true }` only when you must observe mutations inside an object (it is expensive):

```javascript
watch(() => filters.priceRange, onRangeChange)       // getter source
watch(cartItems, recalcTotal, { deep: true })        // deep = costly
```

### `watchEffect` — auto-tracked, eager

`watchEffect` runs immediately and re-runs whenever any reactive value it touched changes. No source list, no dependency array — it tracks whatever you access inside.

```javascript
watchEffect(() => {
  fetchProperty(propertyId.value) // Vue tracks this .value read automatically
})
```

Because tracking is automatic, there is no "forgot a dependency" class of bug. The tradeoff: you have less explicit control over exactly what triggers it, and it runs once on setup whether you wanted that or not.

### Cleanup and flush timing (the parts people miss)

Both watchers can register cleanup that runs before the next invocation and on unmount — essential for cancelling stale async work or tearing down listeners:

```javascript
watchEffect((onCleanup) => {
  const controller = new AbortController()
  fetch(url.value, { signal: controller.signal })
  onCleanup(() => controller.abort()) // cancel the in-flight request
})
```

By default watchers run **before** Vue patches the DOM. If your callback needs the updated DOM (measuring an element, reading a third-party widget), pass `{ flush: 'post' }`:

```javascript
watch(items, () => measureListHeight(), { flush: 'post' }) // after DOM update
```

### `onMounted` — DOM is ready

`onMounted` fires after the component's DOM is inserted. It's where you touch template refs and initialize imperative third-party libraries (maps, charts, editors).

```javascript
onMounted(() => {
  map = initZenrinMap(mapContainer.value)
})
onUnmounted(() => map?.destroy()) // always pair setup with teardown
```

## React — hooks

React's primitives are hooks: functions called at the top level of a component, in the same order every render. The model is "your component is a function of props and state; describe the UI, let React reconcile."

### `useState` — local state, replaced not mutated

`useState` returns the current value and a setter. Calling the setter schedules a re-render; React does **not** observe mutations, so you must produce a new value.

```javascript
const [count, setCount] = useState(0)
setCount(count + 1)        // setter required — React never sees a mutation
```

Three things every senior should keep reflexive:

```javascript
setCount((c) => c + 1)               // functional update: safe under batching
setItems([...items, next])           // new array/object — never push/mutate
const [v] = useState(() => expensive()) // lazy init: runs once, not every render
```

Updates are **batched** and **asynchronous** — `count` does not change on the line after `setCount`; it holds the new value on the next render. Reading `count` right after setting it gives you the stale value, which is the root of many "why didn't it update" bugs. Prefer the functional form whenever the next value depends on the previous.

### `useEffect` — synchronizing with the outside world

`useEffect` runs **after** the browser paints. The dependency array controls when it re-runs; the returned function cleans up before the next run and on unmount.

```javascript
useEffect(() => {
  const controller = new AbortController()
  fetchProperty(propertyId, controller.signal)
  return () => controller.abort()   // cleanup: cancel stale request
}, [propertyId])
```

The failure modes, in order of how often they bite:

- **Stale closures.** The effect closes over the props/state from the render that created it. Omit a value from the deps and the effect keeps reading the *old* one forever. Trust the `exhaustive-deps` ESLint rule; when it fights you, the real fix is usually a functional update or a ref, not silencing the lint.
- **Effects run after paint.** If you mutate layout in an effect, the user can see a flash of the pre-mutation frame. Use `useLayoutEffect` for synchronous, pre-paint DOM work (measuring, scroll positioning).
- **StrictMode double-invokes in dev.** React intentionally mounts, unmounts, and remounts every component in development to surface missing cleanup. Effects must be idempotent and clean up after themselves — if a double-mount breaks your code, the code has a latent bug.
- **Overuse.** Most data transformations don't belong in an effect at all — derive them during render. Effects are for *synchronizing with external systems* (network, subscriptions, non-React widgets), not for reacting to your own state.

### `useRef` — escape hatch from rendering

`useRef` holds a mutable `.current` that persists across renders **without** triggering one. Two uses: grabbing a DOM node, and stashing a mutable value (timer id, previous value, latest callback) that shouldn't cause re-renders.

```javascript
const mapContainer = useRef(null)
// <div ref={mapContainer} />
useEffect(() => { map = init(mapContainer.current) }, [])
```

Writing to `.current` never re-renders, so never store rendered UI state in a ref — it won't update the screen.

### `useMemo` / `useCallback` / `memo` — the memoization tax

Because React re-renders subtrees by default, you manually cache to prevent wasted work and to keep object/function identities stable across renders (which child `memo`/effect deps rely on).

```javascript
const total = useMemo(() => items.reduce(sum, 0), [items]) // cache a value
const onPick = useCallback((id) => select(id), [])         // stable function
const Row = memo(function Row(props) { /* skip re-render if props equal */ })
```

**Critical distinction from Vue:** `useMemo` is a **performance hint, not a guarantee**. React is permitted to discard a memo and recompute (e.g. under memory pressure). Never put logic that must run exactly once, or whose recomputation has side effects, inside `useMemo` — its correctness must not depend on the cache holding. Vue's `computed`, by contrast, is a guaranteed cache. The **React Compiler** (stable in the React 19 era) auto-inserts this memoization, which is steadily erasing the hand-written `useMemo`/`useCallback` boilerplate — but understanding the model still matters for debugging and for code the compiler can't prove safe.

## `watch` vs `watchEffect` — the key distinction

| | `watch` | `watchEffect` |
|---|---|---|
| Dependencies | Explicit source | Auto-tracked |
| Runs on setup | No (unless `immediate: true`) | Yes |
| Old value | Yes | No |
| Best when | You need old/new comparison or precise control | You just want to react to whatever you read |

`watch` — you name the source and get both values:

```javascript
watch(selectedProperty, (newProp, oldProp) => {
  if (newProp?.id !== oldProp?.id) map.flyTo([newProp.lat, newProp.lng])
})
```

`watchEffect` — tracks every reactive read inside, runs immediately:

```javascript
watchEffect(() => {
  if (selectedProperty.value) {
    map.flyTo([selectedProperty.value.lat, selectedProperty.value.lng])
  }
})
```

## Derived state: `computed` vs `useMemo`

These look like analogues and are the place engineers most often conflate the two frameworks. They are not the same:

| | Vue `computed` | React `useMemo` |
|---|---|---|
| Dependencies | Auto-tracked | Manual array |
| Caching | Guaranteed | Best-effort (may be dropped) |
| Safe for "run once" logic | No (still derived) | No — explicitly not |
| Stale-dep risk | None | Yes, if array is wrong |

Rule of thumb: in Vue, reach for `computed` freely — it's cheap and correct. In React, reach for `useMemo` only when profiling shows a real cost or you need a stable reference; treat it as optional and disposable, never load-bearing.

## DOM refs and the React 19 change

Both frameworks give you an escape hatch to the real DOM, available after mount.

Vue — a `ref` whose name matches the template attribute, read in `onMounted`:

```javascript
const input = ref(null)        // <input ref="input">
onMounted(() => input.value.focus())
```

React — `useRef` plus the `ref` attribute. **React 19 made `ref` a regular prop**, so a function component receives it directly and the old `forwardRef` wrapper is no longer needed:

```jsx
function TextField({ ref, ...props }) {  // React 19: ref is just a prop
  return <input ref={ref} {...props} />
}
```

On React 18 and earlier you still need `const TextField = forwardRef((props, ref) => …)`. Know which version you're on before reviewing this pattern.

## Sharing logic: composables vs hooks

Both extract stateful logic into plain functions. The conventions and constraints differ sharply.

Vue **composables** are functions that use reactivity APIs and return refs. Reactive setup (`ref`, `watch`, lifecycle hooks) must happen synchronously during `setup`, but there are no positional rules — you can call composables conditionally as long as the reactive wiring runs at setup time.

```javascript
function useProperty(id) {
  const data = ref(null)
  watchEffect(() => fetchProperty(id.value).then((d) => data.value = d))
  return { data }
}
```

React **custom hooks** are functions starting with `use`, bound by the **Rules of Hooks**: call them at the top level, in the same order, every render — never inside conditionals, loops, or after an early `return`. React tracks hook state by call order, so a conditional hook corrupts that mapping.

```jsx
function useProperty(id) {
  const [data, setData] = useState(null)
  useEffect(() => { fetchProperty(id).then(setData) }, [id])
  return data
}
```

The Rules of Hooks are React's most common footgun for newcomers and the reason the `react-hooks` lint plugin is non-negotiable. Vue's composables trade that rigidity for the reactivity caveats covered above.

## State updates: immutable vs mutable

This is a daily ergonomic difference with real consequences.

```javascript
// React — produce a new reference every time
setUser({ ...user, name: 'Aiko' })
setList(list.filter((x) => x.id !== id))
```

```javascript
// Vue — mutate in place
user.name = 'Aiko'
list.splice(list.findIndex((x) => x.id === id), 1)
```

React's immutability makes change detection a cheap reference check and makes time-travel/undo and concurrent rendering tractable — at the cost of verbose deep updates (hence Immer's popularity). Vue's mutability is more concise and intuitive but means equality checks can't rely on reference identity, which is part of why Vue tracks dependencies instead.

## Forms and two-way binding

```jsx
// React — controlled component, one-way data + explicit handler
<input value={name} onChange={(e) => setName(e.target.value)} />
```

```vue
<!-- Vue — v-model sugar over :value + @input -->
<input v-model="name" />
```

React keeps the loop explicit (value down, change up), which is verbose but leaves no hidden magic. Vue's `v-model` is a thin macro over the same idea and supports custom-component two-way binding and modifiers (`.trim`, `.number`, `.lazy`).

## Choosing between them

The technical gap is small; most real decisions are about constraints around the code:

- **Default performance vs. control.** Vue is fast out of the box thanks to fine-grained reactivity; React asks you to manage memoization (until the React Compiler does it for you). If your team won't invest in performance discipline, Vue's defaults are safer.
- **Mental model.** React's "UI is a pure function, re-render everything, you manage identity" is conceptually clean but has more footguns (stale closures, exhaustive-deps, rules of hooks). Vue's "mutate state, framework tracks it" is gentler day-to-day but has its own traps (reactivity loss on destructure, `.value`).
- **Ecosystem and hiring.** React has the larger ecosystem, job market, and the broadest set of meta-frameworks and component libraries. Vue's first-party story (Router, Pinia, Nuxt) is more cohesive and opinionated, with less decision fatigue.
- **Escape hatches and ceiling.** Both scale to large apps. React's concurrent features and Server Components push the frontier of streaming/SSR; Vue's compiler optimizations and Vapor mode push raw render performance.

There is no wrong choice here for most products. Pick for your team's existing expertise and the meta-framework you'll actually build on (Next.js vs Nuxt), not for a micro-benchmark.
