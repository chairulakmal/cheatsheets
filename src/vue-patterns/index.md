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
