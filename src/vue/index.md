# Vue Cheatsheet

Vue is a JavaScript framework for building user interfaces. You define what the UI should look like using **templates** — HTML with special Vue attributes — and Vue keeps the page in sync with your data automatically.

---

## Your First App

A Vue app starts with `createApp`. Pass it a component object with a `template` and a `setup` function, then mount it onto a DOM element.

```typescript
import { createApp } from "vue";

createApp({
  template: `<h1>Hello, Vue!</h1>`,
  setup() {
    return {};
  },
}).mount("#app");
```

```demo
import { createApp } from "vue";

createApp({
  template: `<h1 style="color: #42b883">Hello, Vue!</h1>`,
  setup() {
    return {};
  },
}).mount("#app");
```

---

## Reactive Data with `ref`

`ref` wraps a value so Vue can track changes to it. In the template, you use the value directly. In `setup`, you access it with `.value`.

```typescript
import { createApp, ref } from "vue";

createApp({
  template: `<p>Count: {{ count }}</p>`,
  setup() {
    const count = ref(0);
    return { count };
  },
}).mount("#app");
```

`{{ count }}` in the template displays the current value and updates automatically when it changes.

---

## Event Handling

Use `@click` (shorthand for `v-on:click`) to run a function when a button is clicked.

```demo
import { createApp, ref } from "vue";

createApp({
  template: `
    <div>
      <p>Count: <strong>{{ count }}</strong></p>
      <button @click="increment">Add one</button>
      <button @click="reset" style="margin-left:8px">Reset</button>
    </div>
  `,
  setup() {
    const count = ref(0);
    function increment() { count.value++; }
    function reset() { count.value = 0; }
    return { count, increment, reset };
  },
}).mount("#app");
```

---

## Template Syntax

Vue templates use `{{ }}` for text and `v-bind:` (or `:` shorthand) for dynamic attributes.

```html
<!-- Text interpolation -->
<p>{{ message }}</p>

<!-- Bind an attribute dynamically -->
<img :src="imageUrl" :alt="imageAlt" />

<!-- Bind a CSS class conditionally -->
<p :class="{ active: isActive }">Hello</p>

<!-- Bind inline styles -->
<span :style="{ color: textColor }">Styled text</span>
```

---

## Computed Properties

A **computed** property derives a value from reactive data. It recalculates automatically when its dependencies change.

```typescript
import { createApp, ref, computed } from "vue";

createApp({
  template: `
    <div>
      <input v-model="name" placeholder="Your name" />
      <p>{{ greeting }}</p>
    </div>
  `,
  setup() {
    const name = ref("");
    const greeting = computed(() =>
      name.value ? `Hello, ${name.value}!` : "Type your name above."
    );
    return { name, greeting };
  },
}).mount("#app");
```

---

## Two-Way Binding with `v-model`

`v-model` keeps an input and a reactive variable in sync — when the user types, the variable updates, and vice versa.

```demo
import { createApp, ref, computed } from "vue";

createApp({
  template: `
    <div>
      <input v-model="text" placeholder="Type something..." style="padding:4px 8px;width:200px" />
      <p>Characters: <strong>{{ length }}</strong></p>
      <p v-if="length > 0">Reversed: {{ reversed }}</p>
    </div>
  `,
  setup() {
    const text = ref("");
    const length = computed(() => text.value.length);
    const reversed = computed(() => text.value.split("").reverse().join(""));
    return { text, length, reversed };
  },
}).mount("#app");
```

---

## Conditional Rendering

`v-if` adds or removes an element from the DOM. `v-else` provides a fallback. `v-show` toggles visibility but keeps the element in the DOM.

```html
<p v-if="isLoggedIn">Welcome back!</p>
<p v-else>Please log in.</p>

<!-- v-show is better for elements that toggle frequently -->
<div v-show="isOpen">Dropdown content</div>
```

```demo
import { createApp, ref } from "vue";

createApp({
  template: `
    <div>
      <button @click="show = !show">
        {{ show ? "Hide" : "Show" }} message
      </button>
      <p v-if="show" style="color:green;margin-top:8px">
        You can see me!
      </p>
    </div>
  `,
  setup() {
    const show = ref(false);
    return { show };
  },
}).mount("#app");
```

---

## Rendering Lists with `v-for`

`v-for` repeats an element for each item in an array. Always provide a unique `:key`.

```html
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

```demo
import { createApp, ref } from "vue";

createApp({
  template: `
    <div>
      <ul style="list-style:none;padding:0">
        <li
          v-for="lang in languages"
          :key="lang.id"
          style="padding:4px 0;border-bottom:1px solid #eee"
        >
          <strong>{{ lang.name }}</strong> — {{ lang.type }}
        </li>
      </ul>
    </div>
  `,
  setup() {
    const languages = ref([
      { id: 1, name: "TypeScript", type: "Typed" },
      { id: 2, name: "Python",     type: "Dynamic" },
      { id: 3, name: "Rust",       type: "Systems" },
    ]);
    return { languages };
  },
}).mount("#app");
```

---

## Components

A component is a reusable piece of UI. Register child components in the `components` option.

```typescript
const Button = {
  props: ["label", "color"],
  template: `
    <button :style="{ background: color, color: '#fff', padding: '4px 12px' }">
      {{ label }}
    </button>
  `,
};

createApp({
  components: { Button },
  template: `
    <div>
      <Button label="Save" color="#42b883" />
      <Button label="Delete" color="#e53e3e" />
    </div>
  `,
  setup() { return {}; },
}).mount("#app");
```

---

## Props

**Props** are the inputs a parent passes to a child component. Declare them in the `props` option.

```typescript
const UserCard = {
  props: {
    name: { type: String, required: true },
    role: { type: String, default: "Member" },
  },
  template: `
    <div style="border:1px solid #ddd;padding:8px;border-radius:6px;margin:4px 0">
      <strong>{{ name }}</strong>
      <span style="color:#888;margin-left:8px">{{ role }}</span>
    </div>
  `,
};
```

Use it in a parent template:

```html
<UserCard name="Alice" role="Admin" />
<UserCard name="Bob" />
```

---

## Watchers

A **watcher** runs a function whenever a reactive value changes — useful for side effects like saving or fetching data.

```typescript
import { ref, watch } from "vue";

const search = ref("");
watch(search, (newValue, oldValue) => {
  console.log(`Search changed from "${oldValue}" to "${newValue}"`);
});
```

Use `watch` to react to a value changing. Use `computed` when you only need to derive a new value from existing ones.

---

## Lifecycle Hooks

Lifecycle hooks run code at key moments — when a component appears (`onMounted`) or is removed (`onUnmounted`).

```typescript
import { onMounted, onUnmounted } from "vue";

setup() {
  let timer;
  onMounted(() => { timer = setInterval(() => console.log("tick"), 1000); });
  onUnmounted(() => clearInterval(timer)); // clean up to prevent memory leaks
}
```

Always clean up timers, listeners, and subscriptions in `onUnmounted` — forgetting to is a common cause of memory leaks.
