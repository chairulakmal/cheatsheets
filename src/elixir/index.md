# Elixir Cheatsheet

Elixir is a functional programming language built on the Erlang virtual machine. It is designed for building reliable, concurrent systems — and has a friendly, readable syntax.

---

## Getting Started

```bash
# Install via https://elixir-lang.org/install.html
elixir --version

# Start an interactive shell
iex

# Run a script
elixir my_script.exs

# Create a new project
mix new my_app
cd my_app
mix run
```

---

## Basic Types

```elixir
42            # integer
3.14          # float
true          # boolean
:ok           # atom (like a symbol — often used as a label)
"hello"       # string
'hello'       # charlist (rarely used directly)
nil           # represents absence of a value
```

Atoms are constants whose name is their value. `:ok` and `:error` are common atoms you'll see in Elixir code.

---

## Variables

Variables are bound with `=`. In Elixir, `=` is the **match operator**, not just assignment.

```elixir
name = "Alice"
age  = 30
sum  = 1 + 2   # => 3
```

Variables are immutable — you can rebind a name, but the original value never changes.

---

## Strings

Strings are UTF-8 encoded. Use `"double quotes"` for strings.

```elixir
greeting = "Hello"
name     = "world"

"#{greeting}, #{name}!"   # => "Hello, world!"  (string interpolation)
String.length("hello")    # => 5
String.upcase("hello")    # => "HELLO"
String.split("a,b,c", ",") # => ["a", "b", "c"]
```

---

## Lists

Lists are ordered collections that can hold any type. They are implemented as linked lists.

```elixir
fruits = ["apple", "banana", "cherry"]

hd(fruits)    # => "apple"     (head — first element)
tl(fruits)    # => ["banana", "cherry"]  (tail — rest of the list)
length(fruits) # => 3

["mango" | fruits]  # => ["mango", "apple", "banana", "cherry"]
```

Concatenate or subtract lists:

```elixir
[1, 2, 3] ++ [4, 5]    # => [1, 2, 3, 4, 5]
[1, 2, 3, 2] -- [2]    # => [1, 3, 2]
```

---

## Tuples

Tuples are fixed-size collections, stored contiguously in memory. Good for grouping a known number of values.

```elixir
{:ok, "Alice", 30}

point = {10, 20}
{x, y} = point    # pattern match to extract values
x  # => 10
y  # => 20
```

A common Elixir convention is to return `{:ok, value}` on success and `{:error, reason}` on failure.

---

## Maps

Maps store key-value pairs. Keys can be any type, but atoms are most common.

```elixir
user = %{name: "Alice", age: 30, role: "admin"}

user.name           # => "Alice"
user[:role]         # => "admin"
Map.get(user, :age) # => 30
```

Update a map (returns a new map — the original is unchanged):

```elixir
updated = %{user | age: 31}
updated.age   # => 31
user.age      # => 30   (original untouched)
```

---

## Pattern Matching

Pattern matching is one of Elixir's most powerful features. The `=` operator matches the left side against the right side.

```elixir
{status, value} = {:ok, 42}
status  # => :ok
value   # => 42

[first | rest] = [1, 2, 3]
first  # => 1
rest   # => [2, 3]
```

Use `_` to ignore a value you don't need:

```elixir
{_, value} = {:ok, "hello"}
value  # => "hello"
```

---

## Functions

Anonymous functions are created with `fn ... end` and called with `.()`:

```elixir
double = fn x -> x * 2 end
double.(5)   # => 10

add = fn a, b -> a + b end
add.(3, 4)   # => 7
```

The `&` shorthand creates compact anonymous functions:

```elixir
double = &(&1 * 2)
double.(5)   # => 10

add = &(&1 + &2)
add.(3, 4)   # => 7
```

---

## Modules and Named Functions

Group related functions inside a `defmodule` block. Use `def` for public functions and `defp` for private ones.

```elixir
defmodule Greeter do
  def hello(name) do
    "Hello, #{name}!"
  end

  defp shout(text) do
    String.upcase(text)
  end
end

Greeter.hello("Alice")   # => "Hello, Alice!"
```

---

## Multiple Function Clauses

Elixir matches function clauses top to bottom. Write multiple clauses to handle different inputs.

```elixir
defmodule Math do
  def factorial(0), do: 1
  def factorial(n), do: n * factorial(n - 1)
end

Math.factorial(5)   # => 120
```

---

## Control Flow — `if` and `unless`

```elixir
if age >= 18 do
  "adult"
else
  "minor"
end

unless logged_in do
  "please log in"
end
```

---

## Control Flow — `case`

`case` matches a value against multiple patterns:

```elixir
case File.read("data.txt") do
  {:ok, contents} ->
    IO.puts("File contents: #{contents}")

  {:error, :enoent} ->
    IO.puts("File not found")

  {:error, reason} ->
    IO.puts("Error: #{reason}")
end
```

---

## Control Flow — `cond`

`cond` evaluates conditions in order and runs the first truthy one:

```elixir
cond do
  score >= 90 -> "A"
  score >= 80 -> "B"
  score >= 70 -> "C"
  true        -> "F"   # default — like else
end
```

---

## The Pipe Operator

`|>` passes the result of one expression as the **first argument** of the next. It makes chained operations easy to read.

Without pipe:

```elixir
String.downcase(String.trim("  Hello World  "))
# => "hello world"
```

With pipe:

```elixir
"  Hello World  "
|> String.trim()
|> String.downcase()
# => "hello world"
```

---

## Enum

The `Enum` module provides functions for working with lists and other collections.

```elixir
numbers = [1, 2, 3, 4, 5]

Enum.map(numbers, fn n -> n * 2 end)      # => [2, 4, 6, 8, 10]
Enum.filter(numbers, fn n -> n > 3 end)   # => [4, 5]
Enum.reduce(numbers, 0, fn n, acc -> acc + n end)  # => 15
Enum.sum(numbers)     # => 15
Enum.max(numbers)     # => 5
```

With the pipe operator:

```elixir
[1, 2, 3, 4, 5]
|> Enum.filter(&(&1 > 2))
|> Enum.map(&(&1 * 10))
# => [30, 40, 50]
```

---

## Mix — Build Tool

Mix is Elixir's built-in build tool. It handles dependencies, compilation, and running code.

```bash
mix new my_app            # create a new project
mix compile               # compile the project
mix run                   # run the project
mix test                  # run tests
mix deps.get              # install dependencies
iex -S mix                # open iex with the project loaded
```

Dependencies go in `mix.exs`:

```elixir
defp deps do
  [
    {:httpoison, "~> 2.0"},
    {:jason, "~> 1.4"}
  ]
end
```
