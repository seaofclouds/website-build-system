---
title: Where Theseus comes from
description: A build system that grew up inside two websites, and now ships as a starting point for a third.
date: 2026-07-26
template: blog
---

Theseus is a static site build system. Markdown and HTML go into `content/`, a finished
website comes out in `public/`, and the roughly 2,000 lines of TypeScript that do it sit
in `system/` where you can read them.

It got that way by being used. It began as the machinery behind the
[Ink & Switch](https://www.inkandswitch.com) website, where the demands were long-form:
essays with a measure to read at, notes in the margin that line up with the sentence they
annotate, figures that break out of the text column in named ways. Then it ran
[automerge.org](https://automerge.org), which asked for different things — a documentation
section with a running order, a blog, an RSS feed, redirects that outlive a
reorganisation.

Both of those are real websites with real archives, so every feature here earned its place
by being needed twice. [Ivy Reese](https://ivy.boo) wrote it.

## What it carries forward

The reading layout is the part with the longest history: a twelve-column grid, a measure
sized in whole columns, and a marginalia band that the same token mirrors into a
navigation sidebar. Four page shapes are built on it, each a class on `<body>`, which is
what lets one set of stylesheets dress a documentation site, an essay site and a gallery.

The rest is what two websites accumulate. Macros and includes to compose a page from
pieces. Frontmatter that opts a page into a template, a date, a draft state. Every internal
link, anchor and asset path checked against the pages just generated. RSS, a sitemap,
`llms.txt`, redirects, dark mode, and font subsetting that cuts a typeface down to the
characters your site actually uses.

## What changed on the way out

Being extracted meant becoming general. Site identity moved into one editable block in
`system/env.ts`. The macros that serve one particular site's shape — a blog whose posts
are children of `/blog/`, a docs section ordered by its sidebar — moved below a banner
comment marking them as examples to adapt or delete.

That's the whole intent of the thing: you copy it into your repo and it becomes yours,
plank by plank, until none of the original is left and it's still your site's build system.
