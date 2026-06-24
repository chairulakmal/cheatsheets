# HTML

HTML is the language that describes the structure of a web page — headings, paragraphs, links,
images, and forms. You write **elements** wrapped in **tags** like `<p>...</p>`.

## The document skeleton

Every HTML page starts with this structure; the visible content goes inside `<body>`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello!</h1>
  </body>
</html>
```

## Headings and paragraphs

Use `<h1>` to `<h6>` for headings (one `<h1>` per page) and `<p>` for paragraphs.

```demo
<h1>Big heading</h1>
<h2>Smaller heading</h2>
<p>A paragraph of normal text.</p>
```

## Text formatting

Wrap words to emphasise them: `<strong>` for important, `<em>` for stress, `<code>` for code.

```demo
<p>This is <strong>important</strong> and this is <em>emphasised</em>.</p>
<p>Run <code>npm install</code> to start.</p>
```

## Links

`<a>` makes a link; `href` is the destination. Add `target="_blank"` to open in a new tab.

```demo
<a href="https://developer.mozilla.org">Read the MDN docs</a>
```

## Images

`<img>` shows an image; `src` is the file and `alt` describes it for screen readers.

```html
<img src="cat.jpg" alt="A sleeping cat" width="200" />
```

## Lists

`<ul>` is an unordered (bulleted) list, `<ol>` is ordered (numbered); each item is an `<li>`.

```demo
<ul>
  <li>Apples</li>
  <li>Oranges</li>
</ul>
<ol>
  <li>First</li>
  <li>Second</li>
</ol>
```

## Tables

A `<table>` has rows (`<tr>`); header cells are `<th>` and normal cells are `<td>`.

```demo
<style>
  table { border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
</style>
<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>Ana</td><td>29</td></tr>
  <tr><td>Bo</td><td>34</td></tr>
</table>
```

## Forms and inputs

A `<form>` collects user input; `<label>` names a field and `<input>` accepts the value.

```demo
<form>
  <label>Email: <input type="email" placeholder="you@site.com" /></label>
  <br /><br />
  <label>Age: <input type="number" value="18" /></label>
</form>
```

## Buttons and select

`<button>` triggers actions; `<select>` offers a dropdown of `<option>` choices.

```demo
<button>Save</button>
<select>
  <option>Small</option>
  <option>Medium</option>
  <option>Large</option>
</select>
```

## Semantic layout

Use meaningful tags — `<header>`, `<nav>`, `<main>`, `<footer>` — instead of generic `<div>`s.

```html
<header>Site title</header>
<nav>Menu links</nav>
<main>Page content</main>
<footer>Copyright</footer>
```

## Block vs inline elements

Block elements (`<div>`, `<p>`) stack vertically; inline elements (`<span>`, `<a>`) flow in a line.

```demo
<div>Block one</div>
<div>Block two</div>
<span>Inline</span> <span>on the same line</span>
```

## id, class, and other attributes

`id` is a unique name for one element; `class` groups elements so CSS can style them together.

```html
<div id="header" class="card highlight">Content</div>
```

## Comments

Anything between `<!--` and `-->` is ignored by the browser — useful for notes.

```html
<!-- This is a comment; it won't show on the page -->
```
