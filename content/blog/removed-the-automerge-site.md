---
title: Removed the Automerge website
description: Stripped the site-specific content and the assumptions that came with it.
date: 2026-07-27
template: blog
---

Deleted the docs, blog, home page demo, and assets — about 15 MB, mostly WebM, a
WebAssembly bundle, and screenshots. Also the Overpass typeface and an unused
`@types/highlightjs`.

Replaced with a small starter site that documents the build system, so every feature has
something exercising it.

Then the assumptions:

- **Site identity was in seven files.** RSS channel title in `rss.ts`, fallback page
  title in `macros.ts`, `llms.txt` preamble in `llms.ts`, repo URL in `app.ts`. All now
  in one block in `system/env.ts`. No config file — that would be a schema, and a schema
  is an interface to keep stable.
- **Four paths crashed when example content was removed.** `{{most-recent-blog-post}}`
  threw with no blog and was called from the nav, so deleting the blog broke every page.
  `{{blog-sidebar}}` dereferenced a missing parent. `llms.txt` read two Automerge
  includes directly. `Redirects.txt` was read unconditionally. All four now degrade.
- **Macros expanded inside code blocks,** so docs couldn't show macro syntax. Now they
  don't, tested on where the macro opens rather than whether it touches code.
- **`{{info:}}` emitted `class="info"` but only `.note` was styled.** Callouts had always
  rendered unstyled.
- **`landing.css` constrained `<section>`,** which Markdown pages don't emit, so the blog
  index ran edge to edge. Moved to `<main>`.

Macros serving one site's shape — blog sidebars, docs prev/next — kept under a banner
marking them as examples rather than features.

Squashed history: a clone was pulling 6.18 MB for a 520 KB tree, since `git rm` leaves
blobs in history. Now 76.5 KiB.
