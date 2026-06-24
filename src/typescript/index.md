# TypeScript

TypeScript adds **types** to JavaScript. Types tell the computer what kind of value a variable holds — a number, a string, a list, and so on. This catches mistakes before your code runs.

---

## Basic Types

Every variable can be given a type using a colon after its name.

```typescript
let isDone: boolean = false;
let age: number = 25;
let username: string = "Alice";
let scores: number[] = [10, 20, 30];   // array of numbers
let nothing: null = null;
let missing: undefined = undefined;
```

TypeScript can usually **infer** the type from the value, so you don't always need to write it out:

```typescript
let city = "Kuala Lumpur";   // TypeScript knows this is a string
let count = 0;               // TypeScript knows this is a number
```

---

## Functions

Add types to parameters and return values so TypeScript can check your function calls.

```typescript
function add(a: number, b: number): number {
  return a + b;
}

function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

Use `?` to mark a parameter as optional. Use `??` to provide a fallback when it's missing.

```typescript
function sayHello(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}
```

```demo
function add(a: number, b: number): number {
  return a + b;
}

function sayHello(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}

console.log(add(3, 4));
console.log(sayHello("Alice"));
console.log(sayHello("Bob", "Hi"));
```

---

## Objects & Interfaces

An **interface** describes the shape of an object — what properties it has and what types they are.

```typescript
interface User {
  name: string;
  age: number;
  email?: string;      // optional property
  readonly id: number; // cannot be changed after creation
}
```

Use the interface as a type for function parameters and variables.

```typescript
function printUser(user: User): void {
  console.log(`${user.name} (${user.age})`);
}

const alice: User = { name: "Alice", age: 30, id: 1 };
printUser(alice);
```

---

## Type Aliases

A **type alias** gives a name to any type, including combinations of types.

```typescript
type ID = string | number;    // ID can be either a string or a number

type Point = {
  x: number;
  y: number;
};

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}
```

**Interface vs type alias** — use `interface` when describing objects that might be extended. Use `type` for unions, primitives, and one-off shapes.

---

## Union Types

A **union** lets a value be one of several types. Use `|` to separate the options.

```typescript
type Status = "active" | "inactive" | "banned";

function printId(id: number | string): void {
  console.log(`Your ID is: ${id}`);
}

printId(101);
printId("user_42");
```

Use an `if` check to narrow down which type you're working with:

```demo
type Result = { ok: true; value: number } | { ok: false; error: string };

function divide(a: number, b: number): Result {
  if (b === 0) return { ok: false, error: "Cannot divide by zero" };
  return { ok: true, value: a / b };
}

function display(result: Result): void {
  if (result.ok) {
    console.log("Answer:", result.value);
  } else {
    console.log("Error:", result.error);
  }
}

display(divide(10, 2));
display(divide(5, 0));
```

---

## Arrays & Tuples

```typescript
// Arrays — all elements have the same type
const names: string[] = ["Alice", "Bob", "Charlie"];
const prices: Array<number> = [9.99, 4.50, 12.00];

// Tuples — fixed length, each position has its own type
const coordinate: [number, number] = [51.5, -0.09];
const entry: [string, number] = ["Alice", 30];
```

---

## Enums

An **enum** is a set of named constants. Useful when a value can only be one of a few options.

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

function move(direction: Direction): void {
  console.log(`Moving: ${Direction[direction]}`);
}

move(Direction.Up);
move(Direction.Right);
```

---

## Generics

**Generics** let you write functions and types that work with any type while still being type-safe. Think of `<T>` as a placeholder for "whatever type the caller uses."

```typescript
function wrap<T>(value: T): T[] {
  return [value];
}

wrap("hello");   // returns string[]
wrap(42);        // returns number[]
wrap(true);      // returns boolean[]
```

A common use — a typed function that works on any array:

```demo
function firstItem<T>(items: T[]): T | undefined {
  return items[0];
}

function lastItem<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

console.log(firstItem([10, 20, 30]));
console.log(lastItem(["apple", "banana", "cherry"]));
console.log(firstItem([]));
```

---

## Classes

Classes bundle data and behaviour together. TypeScript adds type annotations and access modifiers.

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  speak(): void {
    console.log(`${this.name} makes a sound.`);
  }
}
```

Use `extends` to inherit from another class. Call `super()` to run the parent constructor.

```typescript
class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  speak(): void {
    console.log(`${this.name} barks.`);
  }
}

const dog = new Dog("Rex", "Labrador");
dog.speak();
```

Access modifiers control visibility. `private` means only the class itself can read or change that property.

```typescript
class BankAccount {
  private balance: number = 0;
  readonly owner: string;

  constructor(owner: string) {
    this.owner = owner;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

---

## Utility Types

TypeScript includes built-in helper types that transform existing types.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Partial — makes all properties optional
type UserUpdate = Partial<User>;

// Required — makes all properties required (opposite of Partial)
type UserFull = Required<User>;

// Readonly — prevents any property from being changed
type FrozenUser = Readonly<User>;
```

`Pick` and `Omit` create a new type by selecting or removing properties from an existing one.

```typescript
// Pick — keep only the listed properties
type UserPreview = Pick<User, "id" | "name">;

// Omit — remove the listed properties
type UserWithoutEmail = Omit<User, "email">;

// Record — a dictionary with specific key and value types
type Scores = Record<string, number>;
const leaderboard: Scores = { Alice: 100, Bob: 85 };
```

---

## Modules

Split your code across files using `export` and `import`.

```typescript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14159;
```

```typescript
// app.ts
import { add, PI } from "./math";

console.log(add(2, 3));   // 5
console.log(PI);          // 3.14159
```

Export a single default value:

```typescript
// logger.ts
export default function log(message: string): void {
  console.log(`[LOG] ${message}`);
}

// app.ts
import log from "./logger";
log("Application started");
```

---

## Type Narrowing

TypeScript **narrows** a union to a specific type when you check it with `typeof`, `in`, or `instanceof`.

```typescript
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);   // TypeScript knows it's a number here
  }
  return value.toUpperCase();  // here it must be a string
}
```

A custom **type guard** is a function returning `x is Type` that tells TypeScript what a value is.

```typescript
interface Dog { bark: () => void }
interface Cat { meow: () => void }

function isDog(pet: Dog | Cat): pet is Dog {
  return "bark" in pet;
}
```

---

## `unknown` vs `any`

`any` switches off type checking; `unknown` is the safe version — you must check the type before using it. Prefer `unknown` for data you don't control, like API responses.

```typescript
const data: unknown = JSON.parse('{"id": 1}');

// data.id;   // Error — you must narrow the type first
if (typeof data === "object" && data !== null && "id" in data) {
  console.log((data as { id: number }).id);  // safe after narrowing
}
```
