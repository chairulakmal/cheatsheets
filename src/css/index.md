# CSS

CSS controls how a web page looks — colors, fonts, spacing, and layout. You write **rules**: a
**selector** picks elements, and a block of **property: value** pairs styles them.

## How to add CSS

The common way is an external file linked in `<head>`; you can also use a `<style>` block.

```html
<link rel="stylesheet" href="styles.css" />
<style>
  p { color: navy; }
</style>
```

## Anatomy of a rule

The selector chooses what to style; each declaration ends with a semicolon.

```css
p {
  color: navy;
  font-size: 16px;
}
```

## Selectors

Target by tag, by `.class`, or by `#id`; combine them to be more specific.

```demo
<style>
  p { color: gray; }
  .hot { color: crimson; font-weight: bold; }
  #lead { font-size: 20px; }
</style>
<p id="lead">Lead paragraph</p>
<p class="hot">Important</p>
<p>Normal</p>
```

## Colors and backgrounds

Set text color with `color` and the background with `background-color`; values can be names or hex.

```demo
<style>
  .box { background-color: #2563eb; color: white; padding: 12px; }
</style>
<div class="box">Blue box with white text</div>
```

## Text and fonts

Control size, weight, family, and alignment of text.

```demo
<style>
  .title { font-family: system-ui, sans-serif; font-size: 22px; font-weight: 700; text-align: center; }
</style>
<p class="title">Centered bold title</p>
```

## The box model

Every element is a box: `padding` is space inside the border, `margin` is space outside it.

```demo
<style>
  .card { border: 2px solid #2563eb; padding: 16px; margin: 12px; background: #eff6ff; }
</style>
<div class="card">Padding inside, margin outside</div>
```

## Units

`px` is fixed pixels; `rem` scales with the root font size; `%` is relative to the parent.

```css
.box {
  width: 50%;       /* half the parent */
  padding: 1rem;    /* 16px by default */
  font-size: 14px;  /* fixed */
}
```

## Display

`block` stacks, `inline` flows in a line, `inline-block` flows but accepts width/height, `none` hides.

```demo
<style>
  .pill { display: inline-block; background: #e0e7ff; padding: 4px 10px; border-radius: 999px; }
</style>
<span class="pill">One</span>
<span class="pill">Two</span>
<span class="pill">Three</span>
```

## Flexbox: basics

Set `display: flex` on a container to lay its children out in a row; `gap` adds space between them.

```demo
<style>
  .row { display: flex; gap: 8px; }
  .row > div { background: #2563eb; color: white; padding: 12px; }
</style>
<div class="row">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

## Flexbox: alignment

`justify-content` aligns along the row; `align-items` aligns across it. Together they center anything.

```demo
<style>
  .center { display: flex; justify-content: center; align-items: center; height: 90px; background: #eff6ff; }
</style>
<div class="center">
  <div>Perfectly centered</div>
</div>
```

## Flexbox: spacing and wrapping

`justify-content: space-between` pushes items apart; `flex-wrap: wrap` lets them flow to new lines.

```demo
<style>
  .bar { display: flex; justify-content: space-between; background: #1e293b; color: white; padding: 10px; }
</style>
<div class="bar">
  <span>Logo</span>
  <span>Menu</span>
</div>
```

## Flexbox: growing items

`flex: 1` makes an item expand to fill leftover space; give different values to share proportionally.

```demo
<style>
  .split { display: flex; gap: 8px; }
  .split .main { flex: 2; background: #2563eb; color: #fff; padding: 12px; }
  .split .side { flex: 1; background: #93c5fd; padding: 12px; }
</style>
<div class="split"><div class="main">main (flex 2)</div><div class="side">side (flex 1)</div></div>
```

## Grid

`display: grid` with `grid-template-columns` lays elements out in a 2D grid.

```demo
<style>
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .grid > div { background: #c7d2fe; padding: 12px; text-align: center; }
</style>
<div class="grid"><div>A</div><div>B</div><div>C</div></div>
```

## Position

`relative` nudges from the normal spot; `absolute` places relative to a positioned parent; `fixed`
sticks to the viewport.

```demo
<style>
  .wrap { position: relative; height: 70px; background: #eff6ff; }
  .badge { position: absolute; top: 8px; right: 8px; background: crimson; color: #fff; padding: 4px 8px; }
</style>
<div class="wrap"><span class="badge">New</span></div>
```

## Pseudo-classes

Style states like `:hover` (pointer over) and `:focus` (keyboard/click focus).

```demo
<style>
  .btn { padding: 8px 14px; background: #2563eb; color: #fff; border: 0; }
  .btn:hover { background: #1d4ed8; }
</style>
<button class="btn">Hover me</button>
```

## Custom properties (variables)

Define reusable values with `--name` and read them with `var()`.

```demo
<style>
  .theme { --brand: #7c3aed; color: var(--brand); border: 2px solid var(--brand); padding: 12px; }
</style>
<div class="theme">Styled with a variable</div>
```

## Media queries

Apply rules only at certain screen sizes to make layouts responsive.

```css
@media (max-width: 600px) {
  .row { flex-direction: column; }
}
```
