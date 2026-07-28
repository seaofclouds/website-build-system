---
title: Content
description: How files in the content folder become URLs, and what frontmatter controls.
template: docs
---

A page is an HTML or Markdown file in `content/`. The file path becomes the URL.

Put an HTML file at `content/pens/index.html` and it's served at `/pens/index.html`.
Write `content/rams/index.md` and it's converted to HTML and served at `/rams/`.

In short, `content/` should feel like an FTP server. You put things in, they show up on
the site. Everything clever is opt-in.

## Clean URLs

Most web servers let you drop `index.html` from a URL. To make the most of that, the
build system renames `name.html` to `name/index.html`, so the URL can just be `/name`.

Which means a page at `/eraser/head` comes from exactly one of these:

```
content/eraser/head.md
content/eraser/head.html
content/eraser/head/index.md
content/eraser/head/index.html
```

Use whichever you like, and mix them freely. For pages with their own images or
stylesheets, prefer one of the last two — the folder gives those assets somewhere
natural to live. If two files would produce the same URL, you'll get an error naming
both.

Opt out for a single page with `clean: false`.

## Frontmatter

Frontmatter sits at the top of a page, fenced by `---`, and controls how the page is
processed. It looks like YAML but is much simpler — one `key: value` per line, with `#`
for comments.

```yml
---
title: Sending Mail
description: How to send mail *without* a stamp.
date: 2026-03-14
styles: /static/extra.css
template: docs
---
```

The parser is about forty lines in `system/frontmatter.ts`. It splits each line on the
first colon, lowercases the key, and stores a string. That's it — no nesting, no lists,
no types. Wrap a value in double quotes if it needs to contain a `#`.

### The properties that matter

`template` picks which file in `template/` wraps this page. Defaults to `default`.

`publish` defaults to `true`. Set it to `draft` and the page appears in local builds but
not in `./site build`. Set it to `false` and it's excluded everywhere. Linking to a draft
from a non-draft page gets you a warning.

`title` is used for `<title>` and RSS. `description` is used for meta tags and RSS, and
may contain inline Markdown.

`date` must be `YYYY-MM-DD`. A page with a date is included in the RSS feed, and is
required to also have a title and description.

`styles` and `scripts` take comma-separated paths, and are injected at the end of
`<head>`. Both are also accepted in the singular.

`image` sets the preview image for shared links, overriding the site default.

`index: false` keeps a page out of RSS, the sitemap, and the parent/child tree.

`clean: false` skips the `name.html` → `name/index.html` rewrite.

### Frontmatter is optional

This is worth stating plainly, because it's the escape hatch that makes the rest safe:

{{info: An HTML file with **no frontmatter at all** is copied through completely
untouched. No template, no macros, not even the clean-URL rewrite. If you want total
control over a page, that's how you get it.}}

Markdown files are always processed, frontmatter or not — otherwise they'd be served
as raw Markdown.

## How pages find each other

After loading every page, the system works out a parent for each one purely from URL
nesting: `/blog/hello/` becomes a child of `/blog/`, which becomes a child of `/`.

Nothing configures this and nothing declares it. It's what makes `{{index:…}}` able to
list a section's children, and what the newer/older post links walk. Pages with
`index: false` are left out of the tree entirely.

## Markdown

Standard Markdown via [markdown-it](https://github.com/markdown-it/markdown-it), with
typographic substitutions and footnotes on, and raw HTML allowed.

Code fences are highlighted by Prism. To add a language, import it at the top of
`system/markdown.ts` — if you use one that hasn't been imported, the build tells you
which file to edit.

Fenced blocks accept a title and can highlight lines:

````
```js title="server.js"
const a = 1
// highlight-next-line
const b = 2
```
````

`highlight-next-line` marks one line. `highlight-start` and `highlight-end` mark a
range, and `highlight-red-start` / `highlight-red-end` mark one for removal. The marker
comments are stripped from the output.

You can also drop a `<md>` tag into an HTML page to get Markdown rendering for just that
fragment.
