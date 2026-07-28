---
title: Links & Redirects
description: Automatic broken-link checking, and how to move a page without breaking bookmarks.
template: docs
---

Every build checks every internal link on every page, and tells you about the broken
ones:

```
Broken link in content/blog/hello.md: /docs/getting-startd/
```

It checks anchors too — both `#on-this-page` and `/other/page/#section` — by looking for
the id in the HTML it just generated. So renaming a heading that something links to is
caught immediately, which is the kind of breakage that otherwise survives for years.

It also warns when a published page links to a draft.

Assets are checked the same way, so a mistyped image path is caught rather than showing
up as a broken picture later:

```
Broken asset in content/blog/hello.md: /photos/portriat.jpg
```

That covers anything with a `src` — images, video, `<source>`, `<script>` — and any link
naming a file rather than a clean URL, which is how stylesheets and plain `.html` pages
get checked.

{{info: This is the reason a silent build is meaningful. The checks run against the
finished `public/` folder, so if nothing is printed, the whole content graph genuinely
resolves — every page, every anchor, every file it points at.}}

What isn't checked is anything off-site. A link to another domain, a `mailto:`, an inline
`data:` URI — none of those are ours to verify, so they're skipped rather than guessed at.

{{caution: A path is checked as text, so it's the *spelling* that's verified, not the
file's usefulness. A 0-byte image passes. So does one committed at 4000px wide.}}

## Redirects

Cool URIs don't change. When you move or rename a page someone might have bookmarked,
add a line to `Redirects.txt`:

```
/source          /destination
/old/busted      /new/hotness
/secret          https://example.com/elsewhere
```

One rule per line, source first, whitespace-separated. The source must start with a
slash; the destination can be any path or URL. Any line not starting with a slash is a
comment.

For pages, the build generates a small HTML file at the old path containing a canonical
link and a meta refresh. It's a client-side redirect rather than a 301 because this
system doesn't assume anything about your web server — the output is a folder of files,
and that's all it needs to be.

You can redirect assets too, and it works differently: give both paths a file extension
and the build hardlinks the new file to the old path, so both URLs serve the real file.

```
/old/report.pdf  /new/report.pdf
```

Redirects are excluded from the sitemap and from RSS.

{{caution: Use redirects to keep old URLs working, not to invent new ones. A page with
five URLs is a page nobody can link to confidently.}}

## Generated files

Alongside your pages, each build writes:

`sitemap.xml` — every page not marked `index: false`, with its last-modified date.

`index.xml` — an RSS feed of every page that has a title, a description, and a date.
Full content included.

`robots.txt` — **only when drafts are included**, and it disallows everything. This is
deliberate: draft builds shouldn't be indexed. A production `./site build` excludes
drafts and writes no robots.txt, so nothing is blocked.

`llms.txt` and `llms-full.txt` — your documentation as clean Markdown, following the
[llmstxt.org](https://llmstxt.org) convention, in the order set by the docs sidebar.
Blank `docsIndex` in `system/env.ts` to skip them.
