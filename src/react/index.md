# React

React is a JavaScript library for building user interfaces. You build UIs by writing **components** — small, reusable pieces that each manage their own content and behaviour.

---

## Your First Component

A React component is a function that returns JSX — HTML-like syntax written inside JavaScript.

```tsx
function Hello() {
  return <h1>Hello, world!</h1>;
}
```

Component names must start with a capital letter. Always return a single root element (wrap multiple elements in a `<div>` or an empty `<>` fragment).

```demo
import { createRoot } from "react-dom/client";

function Hello() {
  return <h1>Hello, world!</h1>;
}

createRoot(document.getElementById("root")).render(<Hello />);
```

---

## JSX Rules

JSX looks like HTML but has a few differences.

```tsx
function Card() {
  const title = "TypeScript";

  return (
    <div className="card">        {/* use className, not class */}
      <h2>{title}</h2>            {/* {} runs any JavaScript expression */}
      <p>A typed superset of JavaScript.</p>
      <img src="logo.png" alt="Logo" />   {/* self-closing tags need / */}
    </div>
  );
}
```

---

## Props

**Props** are the inputs you pass into a component, like HTML attributes.

```tsx
function Greeting({ name, age }: { name: string; age: number }) {
  return <p>Hello, {name}! You are {age} years old.</p>;
}
```

Use the component by passing props as attributes.

```demo
import { createRoot } from "react-dom/client";

function Greeting({ name, color }: { name: string; color: string }) {
  return (
    <p style={{ color }}>
      Hello, <strong>{name}</strong>!
    </p>
  );
}

function App() {
  return (
    <>
      <Greeting name="Alice" color="royalblue" />
      <Greeting name="Bob" color="tomato" />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
```

---

## State

**State** is data that can change over time. When state changes, React re-renders the component. Use the `useState` hook to add state to a component.

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);  // initial value is 0

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

`useState` returns two things: the current value and a function to update it.

```demo
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button onClick={() => setCount(count - 1)}>−</button>
      <strong style={{ fontSize: 20 }}>{count}</strong>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Counter />);
```

---

## Handling Events

Pass a function to event props like `onClick`, `onChange`, and `onSubmit`.

```tsx
function NameInput() {
  const [name, setName] = useState("");

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type your name"
      />
      <p>Hello, {name || "stranger"}!</p>
    </div>
  );
}
```

---

## Conditional Rendering

Use a ternary (`? :`) or `&&` to show different content based on state.

```tsx
function Status({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div>
      {isLoggedIn ? <p>Welcome back!</p> : <p>Please log in.</p>}
      {isLoggedIn && <button>Log out</button>}
    </div>
  );
}
```

```demo
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Toggle() {
  const [on, setOn] = useState(false);

  return (
    <div>
      <button onClick={() => setOn(!on)}>
        Turn {on ? "off" : "on"}
      </button>
      {on && (
        <p style={{ color: "green", marginTop: 8 }}>
          The light is on!
        </p>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Toggle />);
```

---

## Rendering Lists

Use `.map()` to turn an array into a list of elements. Each element needs a unique `key` prop.

```tsx
const fruits = ["Apple", "Banana", "Cherry"];

function FruitList() {
  return (
    <ul>
      {fruits.map((fruit) => (
        <li key={fruit}>{fruit}</li>
      ))}
    </ul>
  );
}
```

```demo
import { useState } from "react";
import { createRoot } from "react-dom/client";

const languages = [
  { id: 1, name: "TypeScript", type: "Typed" },
  { id: 2, name: "Python",     type: "Dynamic" },
  { id: 3, name: "Rust",       type: "Systems" },
];

function LanguageList() {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {languages.map((lang) => (
        <li key={lang.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
          <strong>{lang.name}</strong> — {lang.type}
        </li>
      ))}
    </ul>
  );
}

createRoot(document.getElementById("root")).render(<LanguageList />);
```

---

## useEffect

`useEffect` runs code after the component renders — useful for fetching data, setting up timers, or syncing with external systems.

```tsx
import { useState, useEffect } from "react";

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(id);  // cleanup when component unmounts
  }, []);  // [] means run once, on mount

  return <p>Elapsed: {seconds}s</p>;
}
```

The dependency array controls when the effect re-runs:

```tsx
// No array — runs after every render
useEffect(() => { ... });

// Empty array — runs once on mount
useEffect(() => { ... }, []);

// With values — runs when those values change
useEffect(() => { ... }, [userId]);
```

---

## Component Composition

Build complex UIs by combining small, focused components.

```tsx
function Avatar({ name }: { name: string }) {
  return <div className="avatar">{name[0].toUpperCase()}</div>;
}

function UserCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="card">
      <Avatar name={name} />
      <div>
        <strong>{name}</strong>
        <p>{role}</p>
      </div>
    </div>
  );
}
```
