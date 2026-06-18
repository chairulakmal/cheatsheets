# JavaScript Cheatsheet

JavaScript is the language of the web — it runs in every browser and powers everything from simple interactions to full applications. It is the foundation that TypeScript, React, Vue, Next.js, and Nuxt are all built on.

---

## Variables

Use `const` when the value won't change, and `let` when it will. Avoid `var` — it has confusing scoping rules and is considered outdated.

```javascript
const name = "Alice";       // cannot be reassigned
let score = 0;              // can be reassigned
score = 10;

const PI = 3.14159;
```

---

## Data Types

```javascript
// Primitive types
let text    = "hello";       // string
let age     = 25;            // number
let price   = 9.99;          // number (no separate float type)
let active  = true;          // boolean
let nothing = null;          // intentional absence of a value
let missing = undefined;     // declared but not assigned
```

Check the type of a value with `typeof`:

```javascript
typeof "hello"    // => "string"
typeof 42         // => "number"
typeof true       // => "boolean"
typeof null       // => "object"  (a known quirk of JavaScript)
```

---

## Strings

```javascript
const first = "Alice";
const last  = "Smith";

// Template literals use backticks and ${}
const full = `${first} ${last}`;         // => "Alice Smith"
const greeting = `Hello, ${first}!`;     // => "Hello, Alice!"
```

Useful string methods:

```javascript
"hello".toUpperCase()          // => "HELLO"
"  hello  ".trim()             // => "hello"
"hello world".includes("world") // => true
"a,b,c".split(",")             // => ["a", "b", "c"]
"hello".replace("l", "r")      // => "herlo"
```

---

## Arrays

Arrays hold an ordered list of values.

```javascript
const fruits = ["apple", "banana", "cherry"];

fruits[0]          // => "apple"
fruits.length      // => 3
fruits.push("mango")        // add to end
fruits.pop()                // remove from end
fruits.includes("banana")   // => true
```

Common array methods — these return a new array and don't change the original:

```javascript
const numbers = [1, 2, 3, 4, 5];

numbers.map(n => n * 2)          // => [2, 4, 6, 8, 10]
numbers.filter(n => n > 3)       // => [4, 5]
numbers.find(n => n > 3)         // => 4
numbers.reduce((sum, n) => sum + n, 0)  // => 15
```

```demo
const numbers = [1, 2, 3, 4, 5];

console.log("doubled:", numbers.map(n => n * 2));
console.log("big ones:", numbers.filter(n => n > 3));
console.log("total:", numbers.reduce((sum, n) => sum + n, 0));
```

---

## Objects

Objects store key-value pairs, like a record or dictionary.

```javascript
const user = {
  name: "Alice",
  age: 30,
  active: true,
};

user.name          // => "Alice"
user["age"]        // => 30
user.role = "admin";  // add a new property
```

Loop over an object's entries:

```javascript
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}
```

---

## Functions

Three ways to write a function — they all work, but each has slightly different behaviour:

```javascript
// Function declaration (hoisted — can be called before it's defined)
function add(a, b) {
  return a + b;
}
```

```javascript
// Function expression
const multiply = function(a, b) {
  return a * b;
};
```

```javascript
// Arrow function — the most common modern style
const subtract = (a, b) => a - b;

// Arrow function with a body
const greet = (name) => {
  const message = `Hello, ${name}!`;
  return message;
};
```

```demo
const add = (a, b) => a + b;

function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

console.log(add(3, 4));
console.log(greet("Alice"));
console.log(greet("Bob", "Hi"));
```

---

## Destructuring

Pull values out of arrays or objects into named variables in one step.

```javascript
// Array destructuring
const [first, second] = ["apple", "banana", "cherry"];
first   // => "apple"
second  // => "banana"
```

```javascript
// Object destructuring
const { name, age } = { name: "Alice", age: 30, role: "admin" };
name  // => "Alice"
age   // => 30
```

Useful in function parameters:

```javascript
function display({ name, age }) {
  console.log(`${name} is ${age} years old.`);
}
```

---

## Spread and Rest

The `...` operator spreads an array/object out, or collects remaining values.

```javascript
// Spread — copy or merge
const a = [1, 2, 3];
const b = [...a, 4, 5];        // => [1, 2, 3, 4, 5]

const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };  // => { x: 1, y: 2, z: 3 }
```

```javascript
// Rest — collect remaining arguments into an array
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3, 4)  // => 10
```

---

## Control Flow

```javascript
const age = 20;

if (age >= 18) {
  console.log("adult");
} else if (age >= 13) {
  console.log("teenager");
} else {
  console.log("child");
}
```

The ternary operator — a compact `if/else` for simple cases:

```javascript
const label = age >= 18 ? "adult" : "minor";
```

---

## Loops

```javascript
// for — classic index-based loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// for...of — iterate over values (arrays, strings)
for (const fruit of ["apple", "banana"]) {
  console.log(fruit);
}

// forEach — array method, runs a function for each item
["a", "b", "c"].forEach((item, index) => {
  console.log(index, item);
});
```

---

## Promises and async/await

JavaScript handles long-running operations (like fetching data) asynchronously so the page doesn't freeze. A **Promise** represents a value that will arrive later.

```javascript
// Using async/await — reads like regular code
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;
}
```

Handle errors with `try/catch`:

```javascript
async function loadData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log("Something went wrong:", error.message);
  }
}
```

---

## Modules

Split code across files using `export` and `import`.

```javascript
// math.js
export function add(a, b) { return a + b; }
export const PI = 3.14159;
export default function multiply(a, b) { return a * b; }
```

```javascript
// app.js
import multiply, { add, PI } from "./math.js";

console.log(add(2, 3));       // => 5
console.log(PI);              // => 3.14159
console.log(multiply(4, 5));  // => 20
```
