---
title: Templates
description: The page shells your content is poured into, and the snippets you reuse across them.
template: docs
---

A template is an HTML file in `template/` that gives a page its structure. Pages choose
one with the `template` frontmatter; leave it out and you get `default`.

Here's the whole of `template/default.html`:

```html
<!doctype html>
<html lang="en">
<head>{{include:head-stuff}}</head>
<body>
  <main>
    <h1>{{title?}}</h1>
    {{content}}
  </main>
</body>
</html>
```

`{{content}}` is where the page goes. Everything else is ordinary HTML.

The starter ships five templates plus one for redirects:

| Template | Shape |
| --- | --- |
| `default` | bare — content held to the measure, nothing else |
| `landing` | wide, no sidebar. The home page and the 404 |
| `docs` | a sidebar with a table of contents |
| `blog` | a sidebar listing posts by date |
| `essay` | a gutter down the right, for asides and figure captions |

They're a starting point, not a set — add and remove freely.

Each one sets a `layout-*` class on `<body>`, which is what actually decides the page's
shape. See [Stylesheets](/docs/styles/) for what the classes do and how to add one.

## Templates have frontmatter too

A template can carry its own frontmatter, which applies to every page using it:

```html
---
header_anchors: true
styles: /static/landing.css
---
```

`header_anchors: true` turns every `h2`–`h4` in the body into a linkable anchor, with
the id derived from the heading text. `styles` and `scripts` work exactly as they do on
a page — and both sets are combined, so a page can add a stylesheet without losing the
template's.

Any other key is just data, readable from a macro.

## Includes

`template/includes/` holds snippets — HTML or Markdown — that you pull in with
`{{include:name}}`.

```html
{{include: footer}}
```

That looks for `template/includes/footer.html`, falling back to `footer.md`. Markdown
includes are rendered as blocks by default; add the `inline` flag to render them
without a wrapping paragraph:

```html
{{include: byline.md inline}}
```

Includes can contain macros, and those macros expand in the context of whatever page
pulled the include in. The site logo is an include. So is everything in `<head>`.

## Current page highlighting

After a page is assembled, every `<a>` whose `href` matches the page's own URL gets an
`is-current` attribute added to it. No macro, no configuration — write your nav as plain
links and style `a[is-current]` however you like.

## The redirect template

`template/redirect.html` is a special case: it's how `Redirects.txt` becomes real files.
It has no `{{content}}`, just a meta refresh and a canonical link. See
[Links & Redirects](/docs/links/).
