---
title: Macros
description: The one extension point — how to read what a macro does, and how to add your own.
template: docs
---

Macros look like `{{ this }}`, and they work in both pages and templates. They're the
main way to make the build system do something, and `system/macros.ts` is where every
one of them is defined.

If you meet a macro you don't recognise, open that file. It's a single `switch`
statement, and reading it end to end takes a couple of minutes.

## The fallback rule

The thing that makes macros feel light is what happens when nothing matches: the macro
is looked up in the page's frontmatter.

So if a page has `band: Zs` in its frontmatter and the template says
`{{band}} are so damn good`, the page reads *Zs are so damn good*. You never declared a
`band` macro. You didn't need to.

There are three shapes for this:

```
{{band}}     required — logs an error and shows red text on the page if missing
{{band?}}    optional — expands to nothing if missing
{{content}}  built-in — a real case in the switch, checked first
```

Use `{{title?}}` in a template when some pages have a title and some don't. Use
`{{title}}` when a missing one is a mistake you want to hear about.

## What ships

| Macro | Use case |
| --- | --- |
| `{{content}}` | Marks where a page goes inside its template. Every template needs exactly one. |
| `{{include: name}}` | Pulls in a snippet from `template/includes/`. For anything that appears on more than one page — a header, a byline, a footer. See [Templates](/docs/templates/). |
| `{{index: name}}` | Lists the current page's children, rendering each through an include. Reach for it when a section wants a landing page that lists what's in it. Add `reverse` for newest first. |
| `{{figure …}}` | Builds a `<figure>` around an image or a video. The everyday way to put a picture on a page — see the [styleguide](/docs/styleguide/#the-figure-classes) for the classes it takes. |
| `{{aside …}}` | A note in the marginalia band, level with the paragraph after it. For what a reader can skip without losing the thread. |
| `{{info: …}}`, `{{caution: …}}` | A callout in the flow of the text. For what a reader *can't* skip — that's the whole difference from an aside. |
| `{{# …}}` | A comment. Disappears at build time, so use it to explain a template to whoever edits it next. |
| `{{site-title}}`, `{{domain}}`, `{{href}}`, `{{head-title}}`, `{{og-description}}`, `{{og-image-tag}}`, `{{og-type}}`, `{{og-url}}`, `{{month-year}}` | Values you'd otherwise repeat by hand. Mostly used once each, in `head-stuff.html`. |

### Ordering, for `{{index:}}`

`{{index: card}}` renders `template/includes/card.html` once per child, each in the
context of that child. Children are ordered by their `date` frontmatter. Pages sharing a
date keep their relative file order, which is alphabetical by path — so a set of same-day
posts sorts by filename, and `reverse` flips that too. Worth knowing before you publish
several things on one day and wonder why they came out backwards.

This site doesn't use `{{index:}}` anywhere — its blog is navigated by the sidebar rather
than a listing page — but it's there when you want a section to have one.

### Figures and asides

A figure pointed at an `.mp4`, `.webm`, or `.mov` gives you a `<video>` instead of an
`<img>`. Words before the image become CSS classes, and `autoplay` additionally makes the
video loop and mute.

An aside takes an optional leading integer, which pulls it up that many body lines so it
lands beside the line you actually meant:

```
{{aside A note beside the next paragraph.}}
{{aside 2 The same, two body lines higher.}}
```

Colons are optional, so `{{aside: …}}` and `{{aside 2: …}}` both work. The gutter exists
on the `essay`, `docs` and `blog` templates; on `default` and `landing` there's no band to
put an aside in, so it stays in normal flow with an indent. That's a reasonable fallback
rather than a bug.

## The site-specific half

Further down `macros.ts` there's a banner comment, and below it: `{{blog-sidebar}}`,
`{{most-recent-blog-post}}`, `{{prev-in-docs}}`, `{{next-in-docs}}`, `{{newer-in-blog}}`,
`{{older-in-blog}}`.

Those exist to serve one particular site shape — a blog whose posts are children of
`/blog/`, and a docs section whose running order comes from the sidebar include. They're
examples of the kind of thing this system is for, not features of it.

{{info: If your site has no blog, delete the blog macros. If your docs aren't ordered
by a sidebar file, delete the docs ones. They're separated by that banner so you can see
at a glance what's safe to remove.}}

## Writing your own

Add a `case` to the switch. That's the whole API.

```ts
case "reading-time": {
  const words = page.compiledBody.split(/\s+/).length
  return `${Math.ceil(words / 200)} min read`
}
```

Now `{{reading-time}}` works everywhere. You have the current `page`, every other
`page`, and the frontmatter in scope.

There's no plugin system and no registration step, on purpose. A plugin API would mean
this build system had a public interface to keep stable — and the moment it has one of
those, it's a dependency rather than part of your site.

## How expansion actually runs

Worth knowing, because it explains the sharp edges:

Macros expand **after** Markdown conversion, in a loop that runs until a pass changes
nothing (capped at 100 passes, so a macro that produces itself gets caught and
reported). Output from one macro is therefore scanned for more macros — that's how
`{{index:…}}` renders an include per child page.

Because expansion happens after Markdown, a macro's arguments arrive already converted.
`{{figure ![](a.png)}}` is holding an `<img>` tag by the time the macro sees it, which
is why that macro looks for a tag rather than Markdown.

Expansion skips code. Anything inside `<pre>` or `<code>` — a fenced block or a span of
inline code — is left exactly as written, which is why this page can show you macro
syntax without triggering it.

The test is where a macro *opens*, not whether it touches code anywhere. So a macro
written inside a code sample stays literal, while one that opens in ordinary prose still
works even if its arguments contain code:

{{info: This callout is written as a macro whose text includes an inline `code` span,
and it expanded normally. Had the rule been "skip anything overlapping code", it
wouldn't have.}}
