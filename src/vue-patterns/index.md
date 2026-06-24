# Vue Patterns

## `<script setup>` with TypeScript

`<script setup>` is the recommended composition style — more concise than the Options API and better integrated with TypeScript.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">Count: {{ count }} (×2 = {{ doubled }})</button>
</template>
```

## defineProps with TypeScript

Use the generic form of `defineProps` to declare props — no separate runtime declaration needed.

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})
</script>
```

## Reactive props destructure (Vue 3.5)

Destructuring `defineProps` used to drop reactivity; since Vue 3.5 (now stable) the compiler rewrites each destructured binding back into a `props.x` access, so they stay reactive — and `=` gives you native defaults, replacing `withDefaults`.

```vue
<script setup lang="ts">
const { count = 0, title } = defineProps<{ count?: number; title: string }>()
watchEffect(() => console.log(count)) // still reactive — compiled to props.count
</script>
```

The catch: once you *read* a destructured prop into a variable or pass it to a function, you pass a plain snapshot. To hand a prop to a composable reactively, wrap it in a getter (`() => count`) or `toRef(() => count)`.

## defineEmits with TypeScript (Vue 3.3+)

Typed emits catch mismatched event names and payload types at compile time.

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string]
  submit: [id: number, data: object]
  close:  []
}>()

function handleChange(e: Event) {
  emit('change', (e.target as HTMLInputElement).value)
}
</script>
```

## Generic components (Vue 3.3+)

Add `generic="T"` to `<script setup>` and the type parameter flows through props, emits, and slots — the way to build a reusable list, table, or select that stays fully typed for every caller.

```vue
<script setup lang="ts" generic="T extends { id: string | number }">
defineProps<{ items: T[]; modelValue: T | null }>()
const emit = defineEmits<{ 'update:modelValue': [item: T] }>()
</script>

<template>
  <button v-for="item in items" :key="item.id" @click="emit('update:modelValue', item)">
    <slot :item="item" />
  </button>
</template>
```

## defineModel

`defineModel` (Vue 3.4+) replaces the `modelValue` prop + `update:modelValue` emit pattern with a single reactive ref.

```vue
<script setup lang="ts">
// Parent uses: <MyInput v-model="text" />
const model = defineModel<string>({ required: true })
</script>

<template>
  <input
    :value="model"
    @input="model = ($event.target as HTMLInputElement).value"
  />
</template>
```

## v-model arguments and modifiers

Name a model to expose several `v-model`s on one component, and read custom modifiers (`.trim`, or your own) from the second tuple element of `defineModel` to transform the value on write.

```vue
<script setup lang="ts">
// Parent: <UserForm v-model:name="name" v-model:title.capitalize="title" />
const name = defineModel<string>('name')
const [title, mods] = defineModel<string>('title', {
  set: (v) => (mods.capitalize ? v[0].toUpperCase() + v.slice(1) : v),
})
</script>
```

## Composables

A composable is a function that encapsulates reactive state and logic so it can be shared across components.

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count   = ref(initial)
  const doubled = computed(() => count.value * 2)
  function increment() { count.value++ }
  function reset()     { count.value = initial }
  return { count, doubled, increment, reset }
}
```

```vue
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'
const { count, increment } = useCounter(10)
</script>
```

## Designing composables — accept refs, normalize with `toValue`

A robust composable accepts a plain value, a ref, *or* a getter, and normalizes with `toValue` (Vue 3.3) — so callers pass reactive or static input interchangeably and the composable re-runs when reactive input changes.

```typescript
import { toValue, watchEffect, ref, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  watchEffect(() => {
    fetch(toValue(url)).then(r => r.json()).then(d => (data.value = d))
  })
  return { data }
}
```

Two more conventions seniors hold to: name it `useXxx`, and register its own cleanup (`onWatcherCleanup`, `onScopeDispose`) *inside* the composable so callers never have to — a composable owns its teardown.

The demos below use the runtime template form (`createApp` + a template string) because a sandboxed iframe has no single-file-component compiler — the reactivity is identical to `<script setup>`.

```demo
import { createApp, ref, computed } from "vue";

function useCounter(initial = 0) {
  const count = ref(initial);
  const doubled = computed(() => count.value * 2);
  return { count, doubled, increment: () => count.value++ };
}

createApp({
  template: `
    <div>
      <p>Count: <strong>{{ count }}</strong> (×2 = {{ doubled }})</p>
      <button @click="increment">Add one</button>
    </div>
  `,
  setup: () => useCounter(5),
}).mount("#app");
```

## provide / inject

`provide` shares typed data from any ancestor; `inject` receives it in any descendant without prop-drilling.

```typescript
import { provide, inject, type InjectionKey } from 'vue'

interface Theme { dark: boolean }
const ThemeKey: InjectionKey<Theme> = Symbol('theme')

// In parent or plugin:
provide(ThemeKey, { dark: false })

// In any descendant:
const theme  = inject(ThemeKey)               // Theme | undefined
const theme2 = inject(ThemeKey, { dark: false }) // with default, never undefined
```

```demo
import { createApp, ref, provide, inject, h } from "vue";

const Child = {
  setup() {
    const theme = inject("theme");
    return () => h("p", "Injected theme: " + theme.value);
  },
};

createApp({
  components: { Child },
  template: `<div><Child /><button @click="toggle">Toggle theme</button></div>`,
  setup() {
    const theme = ref("light");
    provide("theme", theme); // descendants react when this ref changes
    const toggle = () => (theme.value = theme.value === "light" ? "dark" : "light");
    return { toggle };
  },
}).mount("#app");
```

## ref vs reactive

Use `ref` for primitives and single values; use `reactive` for objects, but avoid destructuring it directly.

```typescript
import { ref, reactive, toRefs } from 'vue'

const count = ref(0)
count.value++                 // must use .value

const state = reactive({ x: 0, y: 0 })
state.x++                     // no .value needed

// Destructuring reactive loses reactivity — use toRefs
const { x, y } = toRefs(state) // x and y remain reactive refs
```

```demo
import { createApp, reactive, computed } from "vue";

createApp({
  template: `
    <div>
      Price ¥<input v-model.number="form.price" type="number" style="width:90px" />
      <p>{{ form.address }} — total with tax: <strong>¥{{ total }}</strong></p>
    </div>
  `,
  setup() {
    const form = reactive({ address: "Shibuya", price: 5000 });
    const total = computed(() => Math.round(form.price * 1.1));
    return { form, total };
  },
}).mount("#app");
```

## Writable computed (getter/setter)

A `computed` with a `set` becomes two-way: the getter derives a value, the setter fans a write back out to the underlying refs. The classic use is binding one field to several pieces of state.

```demo
import { createApp, ref, computed } from "vue";

createApp({
  setup() {
    const first = ref("Ada"), last = ref("Lovelace");
    const fullName = computed({
      get: () => `${first.value} ${last.value}`,
      set: (v) => { const [f, ...r] = v.split(" "); first.value = f; last.value = r.join(" "); },
    });
    return { first, last, fullName };
  },
  template: `
    <div>
      <input :value="fullName" @input="fullName = $event.target.value" style="width:220px" />
      <p>first = <strong>{{ first }}</strong>, last = <strong>{{ last }}</strong></p>
    </div>
  `,
}).mount("#app");
```

## watch vs watchEffect

Use `watchEffect` to auto-track dependencies and run immediately; use `watch` when you need the old value or explicit control.

```typescript
import { ref, watch, watchEffect } from 'vue'

const query = ref('')
const page  = ref(1)

// Runs immediately, re-runs whenever query or page changes
watchEffect(() => console.log(query.value, page.value))

// Explicit source — gives old + new, lazy by default
watch(query, (newVal, oldVal) => {
  page.value = 1 // reset page when query changes
})
```

## watch — multiple sources, deep, and options

Pass an array to watch several sources at once (new/old arrive as tuples). Watching a getter that returns an object needs `deep`; `immediate` runs the callback on setup and `once` (Vue 3.4+) runs it a single time.

```typescript
import { watch } from 'vue'

// React to either source; new and old values come back as tuples
watch([query, page], ([q, p], [prevQ, prevP]) => { /* … */ })

// Deep-watch a getter, run immediately, then never again
watch(() => form.profile, onChange, { deep: true, immediate: true, once: true })
```

## Flush timing and `nextTick`

Watchers run *before* Vue patches the DOM by default (`flush: 'pre'`). When a callback must read the updated DOM — measuring an element, syncing a third-party widget — use `flush: 'post'`. `flush: 'sync'` fires synchronously on every change and can thrash; reach for it rarely.

```typescript
watch(items, () => measureHeight(), { flush: 'post' }) // runs after DOM update
```

`nextTick` is the one-off equivalent — await it to read the DOM after a change you just made.

```typescript
count.value++
await nextTick()                       // DOM now reflects the new count
console.log(el.value?.textContent)
```

## Async components

`defineAsyncComponent` lazily loads a component, reducing the initial bundle size.

```typescript
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent:   ErrorMessage,
  delay:   200,   // show spinner after 200 ms
  timeout: 5000,  // show error after 5 s
})
```

## Suspense and async setup

A component with a top-level `await` in `<script setup>` becomes async; `<Suspense>` coordinates one fallback while any number of such children resolve, so you render a single loading state instead of many.

```vue
<script setup lang="ts">
const user = await fetchUser() // top-level await — this component is async
</script>
```

```vue
<template>
  <Suspense>
    <UserProfile />
    <template #fallback>Loading…</template>
  </Suspense>
</template>
```

`<Suspense>` is still flagged experimental, so its API can shift. Pair it with `onErrorCaptured`: a rejected async setup surfaces as a thrown error that needs a boundary.

## Error handling — `onErrorCaptured` and `errorHandler`

`onErrorCaptured` catches errors thrown by descendants — render, lifecycle, watchers, async setup — letting a component act as an error boundary. Return `false` to mark the error handled and stop it propagating.

```typescript
import { onErrorCaptured } from 'vue'

onErrorCaptured((err, instance, info) => {
  report(err, info)  // info names the Vue hook that threw
  return false       // handled — don't bubble to the parent boundary
})
```

Register an app-level handler as the last-resort net for anything no boundary caught.

```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => report(err, info)
```

## Teleport

`Teleport` renders content in a different DOM node — use it for modals that must escape `overflow: hidden` or stacking contexts.

```vue
<template>
  <button @click="open = true">Open modal</button>

  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="open = false">
      <div class="modal">Modal content</div>
    </div>
  </Teleport>
</template>
```

## Transition

Wrap a single element in `<Transition>` to animate enter and leave states with CSS class hooks.

```vue
<template>
  <Transition name="fade">
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
```

## Custom directives

When the logic is genuinely about direct DOM access — autofocus, scroll position, tooltips, intersection observers — a directive fits better than a component. In `<script setup>` a `const vName` is auto-registered as `v-name`; register app-wide with `app.directive`.

```demo
import { createApp } from "vue";

createApp({
  directives: {
    // template uses v-highlight="'#fde68a'"; binding.value is the color
    highlight: { mounted: (el, binding) => { el.style.background = binding.value; } },
  },
  template: `<p v-highlight="'#fde68a'" style="padding:8px">Styled by a custom v-highlight directive.</p>`,
}).mount("#app");
```

Directives expose the full element lifecycle — `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount`, `unmounted` — and each hook receives a `binding` with `value`, `arg`, and `modifiers`.

## Lifecycle hooks

Composition API lifecycle hooks run code at key moments — most commonly `onMounted` for setup and `onUnmounted` for cleanup.

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let timer: number
onMounted(() => { timer = window.setInterval(poll, 1000) })
onUnmounted(() => clearInterval(timer)) // prevent a memory leak when destroyed
</script>
```

## `<KeepAlive>` and cached lifecycle

`<KeepAlive>` caches a toggled component instead of destroying it, preserving its state (scroll, form input, fetched data) across switches. A cached component runs `onActivated`/`onDeactivated` on show/hide *instead of* mount/unmount — the right place to pause and resume work.

```vue
<template>
  <KeepAlive :max="10">
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

```typescript
import { onActivated, onDeactivated } from 'vue'

onActivated(() => resumePolling())    // re-shown from the cache
onDeactivated(() => pausePolling())   // hidden, but still alive
```

## defineExpose and `useTemplateRef` (Vue 3.5)

A `<script setup>` component is *closed* by default — parents cannot reach its internals. `defineExpose` opts specific members into the public instance.

```vue
<script setup lang="ts">
const inputEl = ref<HTMLInputElement | null>(null)
function focus() { inputEl.value?.focus() }
defineExpose({ focus }) // parent: childRef.value.focus()
</script>
```

Vue 3.5's `useTemplateRef` replaces the name-matched template ref, decoupling the variable name from the `ref="…"` attribute — clearer in components with many refs.

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
const el = useTemplateRef('inputEl') // binds to ref="inputEl"
</script>
```

## Fallthrough attributes, `useAttrs`, and `defineOptions`

Attributes a parent puts on a component that aren't declared props — `class`, `id`, listeners — "fall through" to the root element. When the real target isn't the root, set `inheritAttrs: false` via `defineOptions` (Vue 3.3+) and forward `useAttrs()` yourself.

```vue
<script setup lang="ts">
import { useAttrs } from 'vue'
defineOptions({ inheritAttrs: false })
const attrs = useAttrs() // { class, id, onClick, … }
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-bind="attrs" />  <!-- forward to the input, not the wrapper -->
  </label>
</template>
```

## Pinia — scalable state management

Pinia is Vue's official store; a setup store mirrors `<script setup>` — refs are state, computed are getters, and functions are actions.

```typescript
// stores/auth.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => user.value !== null)
  async function login(creds: Credentials) {
    const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(creds) })
    user.value = await res.json()
  }
  function logout() { user.value = null }
  return { user, isLoggedIn, login, logout }
})
```

Destructure state and getters with `storeToRefs` to keep them reactive; call actions directly off the store.

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
const auth = useAuthStore()
const { user, isLoggedIn } = storeToRefs(auth) // reactivity preserved
// const { user } = auth                        // WRONG — loses reactivity
</script>
```

## Plugins

A plugin is the install-time seam for app-wide concerns — register global components or directives, `provide` shared config, or attach a service. It's an object with an `install(app, options)` method (or a bare function) passed to `app.use`.

```typescript
import type { App } from 'vue'

export const analytics = {
  install(app: App, options: { id: string }) {
    app.provide('analytics', createTracker(options.id)) // inject() anywhere
    app.directive('track', { mounted: (el, b) => bindTracking(el, b.value) })
    app.config.globalProperties.$track = track          // usable in templates
  },
}
// main.ts: app.use(analytics, { id: 'UA-123' })
```

## Slots

Slots let a parent inject markup into a child; named slots target specific outlets and the default slot catches the rest.

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <header><slot name="title">Default title</slot></header>
    <slot /> <!-- default slot -->
  </div>
</template>
```

```vue
<template>
  <Card>
    <template #title>Custom Title</template>
    <p>Body content goes in the default slot.</p>
  </Card>
</template>
```

## Scoped slots

A scoped slot passes child-owned data back up to the parent, letting the parent control how that data renders.

```vue
<!-- UserList.vue -->
<template>
  <li v-for="u in users" :key="u.id">
    <slot :user="u" />
  </li>
</template>
```

```vue
<template>
  <UserList>
    <template #default="{ user }">
      <strong>{{ user.name }}</strong>
    </template>
  </UserList>
</template>
```

## Render functions and `h()`

Templates compile to render functions; write one directly with `h(type, props, children)` when the structure is dynamic in a way a template expresses awkwardly — like choosing the element tag at runtime. JSX is available via `@vitejs/plugin-vue-jsx`.

```typescript
import { h } from 'vue'

// A heading whose level is data-driven — clumsy in a template, clear here
const Heading = (props: { level: number }, { slots }: any) =>
  h(`h${props.level}`, { class: 'title' }, slots.default?.())

// props carries attrs, class/style, and onXxx event listeners
h('button', { class: 'btn', onClick: () => emit('go') }, 'Click me')
```

## Reactivity performance

For large immutable data, `shallowRef` skips deep tracking and `markRaw` excludes an object entirely — both cut overhead in big apps.

```typescript
import { shallowRef, markRaw } from 'vue'

// Only reassigning .value is reactive; nested mutations are not tracked
const rows = shallowRef<Row[]>([])
rows.value = await fetchRows()

// Never make a heavy third-party instance reactive
const map = markRaw(new MapLibreInstance())
```

`v-memo` skips re-rendering a subtree unless its listed dependencies change — useful in long lists.

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
    <!-- re-renders only when item.selected changes -->
  </div>
</template>
```

## Escaping and steering reactivity

`toRaw` returns the original object behind a proxy — use it for expensive reads or identity checks where tracking is wasted. `triggerRef` forces dependents to re-run after you mutate a `shallowRef` in place.

```typescript
import { shallowRef, triggerRef, toRaw } from 'vue'

const rows = shallowRef<Row[]>([])
rows.value.push(newRow)      // shallowRef ignores nested mutation…
triggerRef(rows)             // …so force dependents to re-run
const raw = toRaw(reactiveObj) // unwrap the proxy, no tracking
```

`customRef` builds a ref with bespoke dependency tracking — the standard way to implement a debounced or throttled reactive value.

```demo
import { createApp, customRef } from "vue";

function useDebouncedRef(initial, delay = 500) {
  let timer, value = initial;
  return customRef((track, trigger) => ({
    get() { track(); return value; },
    set(v) { clearTimeout(timer); timer = setTimeout(() => { value = v; trigger(); }, delay); },
  }));
}

createApp({
  template: `
    <div>
      <input :value="text" @input="text = $event.target.value" placeholder="type fast…" />
      <p>Debounced (500ms): <strong>{{ text }}</strong></p>
    </div>
  `,
  setup: () => ({ text: useDebouncedRef("") }),
}).mount("#app");
```

## Watcher cleanup (Vue 3.5+)

`onWatcherCleanup` cancels stale async work when a watched source changes again — prevents race conditions and leaks.

```typescript
import { watch, onWatcherCleanup } from 'vue'

watch(query, async (q) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort()) // abort the previous request
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
    signal: controller.signal,
  })
  results.value = await res.json()
})
```

## effectScope — own a group of effects

`effectScope` collects every watcher and computed created inside it so you can dispose them together. It's the primitive Pinia is built on, and the right tool for reactive logic created dynamically or living outside a component's lifecycle.

```typescript
import { effectScope, watch, ref } from 'vue'

const scope = effectScope()
scope.run(() => {
  const x = ref(0)
  watch(x, console.log)  // owned by this scope
})

scope.stop() // tears down every effect created inside run() at once
```

## Security — never use v-html with user content

`v-html` injects raw HTML and bypasses Vue's XSS protection — treat it like `innerHTML`.

```vue
<template>
  <!-- DANGER: if userBio contains <script> or <img onerror=...> it executes -->
  <div v-html="userBio" />

  <!-- SAFE: Vue escapes {{ }} automatically -->
  <div>{{ userBio }}</div>

  <!-- If you must render HTML, sanitize it first with DOMPurify -->
  <div v-html="sanitize(userBio)" />
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
const sanitize = (html: string) => DOMPurify.sanitize(html)
</script>
```

## Security — validate props at runtime

TypeScript prop types are erased at runtime, so validate props from external sources with a schema when the data is untrusted.

```vue
<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{ userId: string }>()

// userId comes from the URL — validate it before using in a query
const IdSchema = z.string().uuid()
const safeId = IdSchema.parse(props.userId)
// Throws if userId is not a valid UUID, preventing invalid queries
</script>
```

## Security — avoid dynamic component names from user input

Never pass user-controlled strings to `<component :is="...">` — it can render arbitrary registered components.

```vue
<template>
  <!-- DANGER: if widgetType comes from user input, attacker can render any component -->
  <component :is="widgetType" />

  <!-- SAFE: whitelist allowed components explicitly -->
  <component :is="ALLOWED_WIDGETS[widgetType] ?? FallbackWidget" />
</template>

<script setup lang="ts">
import ChartWidget from './ChartWidget.vue'
import TableWidget from './TableWidget.vue'
import FallbackWidget from './FallbackWidget.vue'

const ALLOWED_WIDGETS: Record<string, unknown> = {
  chart: ChartWidget,
  table: TableWidget,
}
</script>
```
