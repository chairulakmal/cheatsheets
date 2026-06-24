# Python

Python is a beginner-friendly language known for its readable syntax and broad use in web development, data analysis, automation, and artificial intelligence. It runs on a server or your local machine — not in the browser.

---

## Variables

Python figures out the type of a variable automatically — you don't need to declare it.

```python
name = "Alice"
age = 30
price = 9.99
active = True
nothing = None     # like null in other languages
```

Check the type of a value:

```python
type("hello")   # => <class 'str'>
type(42)        # => <class 'int'>
type(3.14)      # => <class 'float'>
type(True)      # => <class 'bool'>
```

---

## Strings

```python
first = "Alice"
last = "Smith"

# f-strings — the modern way to embed values in strings
full = f"{first} {last}"        # => "Alice Smith"
greeting = f"Hello, {first}!"   # => "Hello, Alice!"
```

Useful string methods:

```python
"hello".upper()              # => "HELLO"
"  hello  ".strip()          # => "hello"
"hello world".split()        # => ["hello", "world"]
"a,b,c".split(",")           # => ["a", "b", "c"]
",".join(["a", "b", "c"])    # => "a,b,c"
"hello".replace("l", "r")    # => "herro"
```

Multi-line strings use triple quotes:

```python
message = """
Dear Alice,
Welcome aboard.
"""
```

---

## Numbers

```python
10 + 3    # => 13   addition
10 - 3    # => 7    subtraction
10 * 3    # => 30   multiplication
10 / 3    # => 3.333...  division (always returns float)
10 // 3   # => 3    floor division (whole number)
10 % 3    # => 1    remainder (modulo)
2 ** 8    # => 256  exponentiation
```

Convert between types:

```python
int("42")       # => 42
float("3.14")   # => 3.14
str(100)        # => "100"
```

---

## Lists

A list holds an ordered sequence of values. Items can be any type and can be mixed.

```python
fruits = ["apple", "banana", "cherry"]

fruits[0]           # => "apple"   (first item)
fruits[-1]          # => "cherry"  (last item)
len(fruits)         # => 3
fruits.append("mango")    # add to end
fruits.pop()              # remove and return last item
"banana" in fruits        # => True
```

Slicing — grab a portion of a list:

```python
numbers = [0, 1, 2, 3, 4, 5]
numbers[1:4]    # => [1, 2, 3]
numbers[:3]     # => [0, 1, 2]
numbers[3:]     # => [3, 4, 5]
numbers[-2:]    # => [4, 5]
```

---

## List comprehensions

A compact way to build a list by transforming or filtering another list.

```python
numbers = [1, 2, 3, 4, 5]

doubled = [n * 2 for n in numbers]
# => [2, 4, 6, 8, 10]

evens = [n for n in numbers if n % 2 == 0]
# => [2, 4]

squares = [n ** 2 for n in range(1, 6)]
# => [1, 4, 9, 16, 25]
```

---

## Dictionaries

A dictionary stores key-value pairs, like a lookup table.

```python
user = {
    "name": "Alice",
    "age": 30,
    "active": True,
}

user["name"]            # => "Alice"
user.get("role", "N/A") # => "N/A"  (safe access with default)
user["role"] = "admin"  # add or update a key
del user["active"]      # remove a key
"name" in user          # => True
```

Loop over a dictionary:

```python
for key, value in user.items():
    print(f"{key}: {value}")
```

---

## Tuples and sets

A **tuple** is like a list but cannot be changed after creation. Use it for fixed collections.

```python
point = (10, 20)
point[0]      # => 10
x, y = point  # unpack into variables
```

A **set** holds unique values and has no order. Useful for removing duplicates or membership tests.

```python
tags = {"python", "web", "python"}  # duplicate removed
# => {"python", "web"}

"web" in tags    # => True
tags.add("api")
```

---

## Functions

Define a function with `def`. Python uses indentation (spaces) instead of curly braces to mark blocks.

```python
def greet(name):
    return f"Hello, {name}!"

greet("Alice")   # => "Hello, Alice!"
```

Default parameters and keyword arguments:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Alice")              # => "Hello, Alice!"
greet("Bob", greeting="Hi") # => "Hi, Bob!"
```

---

## Control flow

```python
age = 20

if age >= 18:
    print("adult")
elif age >= 13:
    print("teenager")
else:
    print("child")
```

The one-line conditional expression (similar to a ternary operator):

```python
label = "adult" if age >= 18 else "minor"
```

---

## Loops

```python
# for loop — iterate over a list
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)

# range — generate a sequence of numbers
for i in range(5):       # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 6):    # 1, 2, 3, 4, 5
    print(i)
```

Use `enumerate` to get the index alongside the value:

```python
for index, fruit in enumerate(["apple", "banana"]):
    print(index, fruit)
# 0 apple
# 1 banana
```

`while` loops run as long as a condition is true:

```python
count = 0
while count < 3:
    print(count)
    count += 1
```

---

## Error handling

Wrap code that might fail in a `try` block, and handle the error in `except`.

```python
try:
    number = int("abc")
except ValueError as e:
    print(f"That's not a number: {e}")
finally:
    print("This always runs")
```

Raise your own errors with `raise`:

```python
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

---

## Classes

A class is a template for creating objects that bundle together data and behaviour.

```python
class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed

    def speak(self):
        return f"{self.name} says woof!"
```

Create an instance and call its methods:

```python
dog = Dog("Rex", "Labrador")
dog.name       # => "Rex"
dog.speak()    # => "Rex says woof!"
```

Inherit from another class to extend it:

```python
class GuideDog(Dog):
    def speak(self):
        return f"{self.name} is working — please don't pet."
```

---

## Modules and imports

Split code into separate files and import what you need.

```python
# Import a whole module
import math
math.sqrt(16)     # => 4.0
math.pi           # => 3.14159...

# Import specific names
from math import sqrt, pi
sqrt(25)          # => 5.0

# Import and rename
import datetime as dt
dt.date.today()   # => 2025-06-18
```

Install third-party packages with pip:

```bash
pip install requests
```

```python
import requests
response = requests.get("https://api.example.com/data")
data = response.json()
```

---

## File input and output

Read and write files using `open`. The `with` statement closes the file automatically.

```python
# Write to a file
with open("notes.txt", "w") as f:
    f.write("Hello, file!\n")

# Read the whole file
with open("notes.txt", "r") as f:
    content = f.read()
    print(content)    # => Hello, file!

# Read line by line
with open("notes.txt", "r") as f:
    for line in f:
        print(line.strip())
```
