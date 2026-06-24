# TypeScript Patterns

## Generics

A generic function works with any type while preserving type information across the call.

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);   // number | undefined
const s = first(['a', 'b']);  // string | undefined
```

Constrain a generic with `extends` to require specific properties.

```typescript
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

getLength('hello');    // 5
getLength([1, 2, 3]);  // 3
// getLength(42);      // Error: number has no .length
```

## Generic interfaces and classes

Use generics in interfaces and classes to make reusable, type-safe data structures.

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User { id: number; name: string }

const res: ApiResponse<User> = {
  data: { id: 1, name: 'Alice' },
  status: 200,
  message: 'OK',
};
```

## Utility types — shape modifiers

`Partial` makes every property optional; `Required` makes every property required; `Readonly` prevents mutation.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UpdateUser = Partial<User>;   // all fields optional — for PATCH requests
type StrictUser = Required<User>;  // all fields required
type FrozenUser = Readonly<User>;  // no mutation allowed after creation
```

## Utility types — key selectors

`Pick` keeps named keys; `Omit` removes them; `Record` builds an object type from a key union and value type.

```typescript
interface User { id: number; name: string; email: string; password: string }

type PublicUser  = Omit<User, 'password'>;            // id, name, email
type Credentials = Pick<User, 'email' | 'password'>;  // email, password

type RoleMap = Record<'admin' | 'editor' | 'viewer', boolean>;
// { admin: boolean; editor: boolean; viewer: boolean }
```

## Utility types — function introspection

Extract type information from existing functions without duplicating type declarations. `Awaited` (TypeScript 4.5+) unwraps a `Promise` to its resolved type.

```typescript
async function fetchUser(id: number): Promise<{ name: string }> {
  return { name: 'Alice' };
}

type Params  = Parameters<typeof fetchUser>;             // [id: number]
type Return  = ReturnType<typeof fetchUser>;             // Promise<{ name: string }>
type Resolved = Awaited<ReturnType<typeof fetchUser>>;  // { name: string }
```

## Utility types — union manipulation

`Exclude` removes members from a union; `Extract` keeps only matching members; `NonNullable` strips `null` and `undefined`.

```typescript
type Status = 'active' | 'inactive' | 'banned' | 'pending';

type Enabled  = Exclude<Status, 'inactive' | 'banned'>; // 'active' | 'pending'
type Disabled = Extract<Status, 'inactive' | 'banned'>; // 'inactive' | 'banned'

type MaybeStr = string | null | undefined;
type Str = NonNullable<MaybeStr>;                        // string
```

## Discriminated unions

A shared literal field lets TypeScript narrow which variant you have inside a conditional.

```typescript
type Result<T> =
  | { ok: true;  value: T }
  | { ok: false; error: string };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: 'Division by zero' };
  return { ok: true, value: a / b };
}

const r = divide(10, 2);
if (r.ok) console.log(r.value); // TypeScript knows .value exists here
```

## Type narrowing

Use `typeof`, `instanceof`, `in`, or a custom type predicate to narrow a union to a specific branch.

```typescript
type Cat = { meow(): void };
type Dog = { bark(): void };

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // Cat here
  } else {
    animal.bark(); // Dog here
  }
}
```

A predicate is an *unchecked claim* — TypeScript trusts the boolean you return and does not verify it. A wrong predicate (`return 'bark' in animal` above) silently corrupts narrowing everywhere it's used, so keep the body trivially correct and consider a runtime validator (Zod) for untrusted input.

## Assertion functions

An `asserts` signature narrows by *throwing*: after the call returns, the compiler treats the value as the asserted type for the rest of the scope — useful for invariants and validation guards.

```typescript
function assert(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg ?? 'Assertion failed');
}
```

```typescript
function assertIsString(v: unknown): asserts v is string {
  if (typeof v !== 'string') throw new TypeError('expected string');
}

assertIsString(input);
input.toUpperCase(); // narrowed to string for the rest of the scope
```

Like predicates, the signature is trusted, not checked — and a function with an `asserts` return type must be annotated explicitly; inference will not add it for you.

## Conditional types

A conditional type picks between two types based on a compile-time assignability check.

```typescript
type IsArray<T> = T extends unknown[] ? true : false;

type A = IsArray<string[]>; // true
type B = IsArray<number>;   // false

// infer captures the matched portion
type ElementOf<T> = T extends (infer U)[] ? U : T;

type C = ElementOf<string[]>; // string
type D = ElementOf<number>;   // number
```

## Distributive conditional types

A conditional type over a *naked* type parameter distributes across each union member — it's applied once per member, then re-unioned. This bites people who don't expect it.

```typescript
type ToArray<T> = T extends unknown ? T[] : never;
type R = ToArray<string | number>; // string[] | number[] — NOT (string | number)[]
```

Wrap both sides in a one-tuple to switch distribution off and treat the union as a whole.

```typescript
type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never;
type R2 = ToArrayWhole<string | number>; // (string | number)[]
```

This `[T] extends [U]` trick is also how you write conditions that should compare the *whole* union — e.g. an `IsNever<T>` check, which a naked parameter would get wrong.

## Mapped types

Transform every property in an existing type using a `[K in keyof T]` loop.

```typescript
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// Add null to every value
type Nullable<T> = { [K in keyof T]: T[K] | null };

interface User { id: number; name: string }
type NullableUser = Nullable<User>;
// { id: number | null; name: string | null }
```

## Template literal types

Combine string literal types to describe string patterns at the type level.

```typescript
type Event = 'click' | 'focus' | 'blur';
type Handler = `on${Capitalize<Event>}`; // 'onClick' | 'onFocus' | 'onBlur'

type CssLength = `${number}px` | `${number}rem` | `${number}%`;
const good: CssLength = '16px';  // OK
// const bad: CssLength = '1em'; // Error
```

## `as const` and const assertions

`as const` narrows every value to its exact literal type and makes the structure deeply readonly.

```typescript
const ROLES = ['admin', 'editor', 'viewer'] as const;
// readonly ['admin', 'editor', 'viewer']

type Role = (typeof ROLES)[number]; // 'admin' | 'editor' | 'viewer'

const config = { host: 'localhost', port: 3000 } as const;
// { readonly host: 'localhost'; readonly port: 3000 }
```

## `satisfies` operator (TypeScript 4.9+)

`satisfies` validates that a value matches a type without widening the inferred literal types.

```typescript
type Colors = Record<string, [number, number, number] | string>;

const colors = {
  red:  [255, 0, 0],
  blue: '#0000ff',
} satisfies Colors;

// Without satisfies, colors.red would be typed as the wide Colors value.
// With satisfies, TypeScript keeps the narrow tuple type:
const [r] = colors.red;  // OK — inferred as [number, number, number]
```

## keyof and indexed access types

`keyof` produces a union of an object's keys; indexed access (`T[K]`) reads the type of a property.

```typescript
interface User { id: number; name: string; email: string }

type UserKey = keyof User       // 'id' | 'name' | 'email'
type NameType = User['name']    // string
type Values = User[keyof User]  // number | string

// A fully type-safe property getter — return type is exactly T[K]
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

## typeof type operator

In type position, `typeof` captures the type of an existing value, keeping types in sync with runtime constants.

```typescript
const config = { host: 'localhost', port: 3000, secure: true }
type Config = typeof config // { host: string; port: number; secure: boolean }

const ROLES = ['admin', 'editor'] as const
type Role = (typeof ROLES)[number] // 'admin' | 'editor'
```

## Function overloads

Overload signatures describe multiple call shapes for one function, giving a precise return type per argument pattern.

```typescript
function parse(input: string): object
function parse(input: string, raw: true): string
function parse(input: string, raw: false): object
function parse(input: string, raw?: boolean): object | string {
  return raw ? input : JSON.parse(input)
}

const obj = parse('{}')         // object
const str = parse('{}', true)   // string
const obj2 = parse('{}', false) // object
```

## never and exhaustiveness checking

Assigning the remaining value to `never` in a `default` branch makes adding a new union member a compile-time error.

```typescript
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; size: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'square': return s.size ** 2
    default:
      const _exhaustive: never = s // errors if a new kind is added
      return _exhaustive
  }
}
```

## Branded types

A branded type stops you mixing values that share a primitive type, like passing a raw string where a validated `UserId` is required.

```typescript
type UserId = string & { readonly __brand: 'UserId' }

function asUserId(id: string): UserId {
  // run validation here
  return id as UserId
}

function getUser(id: UserId) { /* ... */ }

getUser(asUserId('u_123')) // OK
// getUser('u_123')        // Error: plain string is not a UserId
```

## Readonly for immutability

`readonly` arrays prevent mutation, making shared data safe to pass around a large codebase without defensive copies.

```typescript
function sum(nums: readonly number[]): number {
  // nums.push(1) // Error: push does not exist on a readonly array
  return nums.reduce((a, b) => a + b, 0)
}

const config: ReadonlyArray<string> = ['a', 'b']
// config[0] = 'c' // Error
```

## `interface` vs `type` — when to reach for which

For a plain object shape they're nearly interchangeable; the senior decision turns on three things. `interface` declarations **merge** — two with the same name combine, which is how you augment third-party types.

```typescript
interface Animal { name: string }
interface Animal { age: number } // merged — Animal has both
```

`type` aliases cannot merge (a redeclaration is an error) but can express what interfaces can't: unions, tuples, mapped and conditional types. Guidance: use `interface` for public object/class contracts (mergeable, faster on large `extends` chains, clearer error messages); use `type` for unions, tuples, and anything computed.

## Variance and the `in` / `out` modifiers (TS 4.7)

Variance is *why* a `Dog[]` is assignable to an `Animal[]` but a function taking `Animal` is assignable where one taking `Dog` is expected (params are contravariant, returns covariant). You can annotate intended variance on a generic parameter to document it and get earlier, clearer errors.

```typescript
interface Producer<out T> { get(): T }        // covariant — only produces T
interface Consumer<in T> { set(value: T): void } // contravariant — only consumes T
```

This pairs with `strictFunctionTypes`, which makes function-parameter checks contravariant (sound) instead of bivariant. Method parameters stay bivariant for ergonomic reasons — a real soundness hole worth knowing.

## `const` type parameters (TS 5.0)

A `const` type parameter infers the narrowest literal type from the argument, so callers no longer need `as const` at every call site.

```typescript
function asTuple<const T extends readonly unknown[]>(t: T): T { return t; }

const r = asTuple(['a', 'b']); // readonly ['a', 'b'] — no `as const` needed
```

## Variadic tuple types

Spread elements inside tuple types model variable-length argument lists — the backbone of typing `concat`, `compose`, `curry`, and `Function.bind`.

```typescript
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type R = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]
```

```typescript
function tail<T extends unknown[]>(arr: readonly [unknown, ...T]): T {
  return arr.slice(1) as T;
}
const t = tail([1, 'a', true] as const); // ['a', true] (readonly)
```

## Forcing evaluation — the `Prettify` trick

Intersections and deep generics render as unreadable `A & B & …` in editor tooltips. Mapping over the keys and intersecting `& {}` makes TypeScript eagerly flatten the type — purely a DX aid, with no runtime or semantic effect.

```typescript
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Messy = { a: number } & { b: string };
type Clean = Prettify<Messy>; // shows as { a: number; b: string }
```

## Compiler strictness — the flags `strict` doesn't include

`strict: true` is table stakes. These extra flags catch a class of bugs it leaves on the table.

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

`noUncheckedIndexedAccess` is the highest-value one: it adds `| undefined` to every index access (`arr[i]`, `record[key]`), forcing you to handle the missing case the type system otherwise pretends can't happen. `exactOptionalPropertyTypes` distinguishes a missing property from one explicitly set to `undefined`.

## Type-checker performance

Conditional and recursive types are re-evaluated on every check, so they can dominate build time and IDE latency. Seniors watch recursion depth (TS caps non-tail recursion around 50 instantiations), prefer `interface extends` over large intersection chains, and avoid gratuitous deep generics in hot library types.

```bash
tsc --noEmit --extendedDiagnostics   # instantiation counts + check time
tsc --generateTrace trace            # flame-graph the type checker in trace/
```

## Security — `unknown` instead of `any`

`any` disables all type checking; `unknown` forces you to narrow before use, making it safe for untrusted data like API responses or `JSON.parse` output.

```typescript
function parseJson(raw: string): unknown {
  return JSON.parse(raw); // unknown, not any
}

const data = parseJson('{"id":1}');

// data.id         // Error: cannot access property of unknown
// (data as any).id // dangerous — bypasses all checks

if (typeof data === 'object' && data !== null && 'id' in data) {
  console.log((data as { id: unknown }).id); // safe
}
```

## Security — runtime validation with Zod

TypeScript types are erased at runtime, so validate untrusted data (API responses, form input, env vars) with a runtime schema library.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id:    z.number().int().positive(),
  email: z.string().email(),
  role:  z.enum(['admin', 'editor', 'viewer']),
});

type User = z.infer<typeof UserSchema>; // type derived from schema — single source of truth

const result = UserSchema.safeParse(await response.json());
if (!result.success) throw new Error(result.error.message);
const user: User = result.data; // fully typed and validated
```

## Security — type-safe environment variables

Accessing `process.env.FOO` returns `string | undefined`; validate and type env vars at startup so missing variables fail loudly instead of silently.

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  PORT:         z.coerce.number().default(3000),
});

export const env = EnvSchema.parse(process.env);
// Throws at startup if any required var is missing or invalid.
// Use env.DATABASE_URL everywhere — always string, never undefined.
```
