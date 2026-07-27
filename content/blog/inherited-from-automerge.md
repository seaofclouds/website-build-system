---
title: Inherited from automerge.org
description: What the build system does, before any of it was changed.
date: 2026-07-27
template: blog
---

Written by [Ivy Reese](https://github.com/ivanreese) for
[automerge.org](https://automerge.org). Not built to be reused — it was built to be part
of that one website.

About 1,800 lines of TypeScript, no compile step and no bundler — `system/app.ts` runs
directly under bun, deno, or node. Six packages do the work: `markdown-it`,
`markdown-it-footnote`, `prismjs`, `chokidar`, `glob`, `ws`.

The pipeline, in `compile-everything.ts`:

- Markdown and HTML in `content/` become pages in `public/`; the file path becomes the URL
- HTML with no frontmatter is copied through untouched
- `name.html` is rewritten to `name/index.html` for clean URLs
- Pages get a parent and children from URL nesting alone
- Templates in `template/`, snippets in `template/includes/`, `{{macros}}` in both
- Every internal link and anchor is checked against the pages just generated
- RSS, sitemap, `llms.txt`, and redirect pages are generated
- Fonts in `/fonts` are subset to the characters the site actually uses
- A live-reloading dev server, adapted from
  [please-reload](https://github.com/ivanreese/please-reload)

None of that changed in the extraction. See the [docs](/docs/) for how each part works.
