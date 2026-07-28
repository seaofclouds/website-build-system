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

There's only one kind of page. An album, an essay and a gallery aren't things the build
system knows about — each is a [template](/docs/templates/) plus a few classes from the
[styleguide](/docs/styleguide/). A page says which template wraps it with `template:` in
its frontmatter, and that is the entire content model. This is a build system, not a CMS:
if you want a new kind of page, you write a template, not a schema.

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

## Assets

Anything in `content/` that isn't a page is copied to the built site at the same path.
An image at `content/about/portrait.jpg` is served at `/about/portrait.jpg`. They're
hardlinked rather than copied, which is why builds stay fast even when the repo is full
of images.

So an asset can sit next to the page that uses it, instead of in one big pile — which is
the other reason to prefer the folder form of a clean URL:

```
content/about/
  index.md
  portrait.jpg
  about.css
```

Then reference them relatively from the page, or add `styles: /about/about.css` to its
frontmatter.

### Committing images

Git is fine at versioning text and bad at versioning binaries — they bloat clones and
never diff usefully. Before committing an image:

**Resize it.** An image displayed at 600px wide needs to be about 1200px, not 4000px. A
little extra detail is enough to read as crisp on a retina screen.

**Pick the right format.** Line art and screenshots: PNG or WebP. Photographs: WebP or
JPG. Anything that could be vector: SVG.

**Compress it.** [ImageOptim](https://imageoptim.com) or [Squoosh](https://squoosh.app)
will typically halve a file with no visible loss. Aim for 100–300 kB for large photos,
10–100 kB for screenshots.

Fonts are the exception — they get [subsetted](/docs/fonts/) rather than copied.

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

| Property | Use case |
| --- | --- |
| `template` | Which file in `template/` wraps this page, and so which layout it gets. Defaults to `default`. This is how a page says what kind of thing it is. |
| `publish` | `draft` shows the page locally but keeps it out of `./site build`; `false` excludes it everywhere. Defaults to `true`. Linking to a draft from a published page gets you a warning. |
| `title` | Used for `<title>` and RSS. Required on anything with a `date`. |
| `description` | Meta tags and RSS. May contain inline Markdown. Worth writing even where it isn't required — it's what shows up in search results and link previews. |
| `date` | `YYYY-MM-DD`. Adding one puts the page in the RSS feed and orders it in `{{index:}}`, so leave it off pages that aren't posts. |
| `styles`, `scripts` | Comma-separated paths, injected at the end of `<head>`. For the one page that needs something the rest of the site doesn't. Both accepted in the singular. |
| `image` | The preview image for shared links, overriding the site default. |
| `index: false` | Keeps a page out of RSS, the sitemap, and the parent/child tree. For utility pages — a 404, a thank-you page — that shouldn't show up as a child of anything. |
| `clean: false` | Skips the `name.html` → `name/index.html` rewrite, for when you need the literal filename in the URL. |

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
