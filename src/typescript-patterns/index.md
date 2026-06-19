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

Extract type information from existing functions without duplicating type declarations.

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

## `satisfies` operator

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
