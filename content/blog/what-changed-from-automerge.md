---
title: What Changed, Coming From the Automerge Website
description: The full account of turning one website's build system into a starting point for other websites.
date: 2026-07-27
template: blog
---

This build system was written by [Ivy Reese](https://github.com/ivanreese) for
[automerge.org](https://automerge.org). It was never meant to be reusable — quite the
opposite, as the [next post](/blog/ship-of-theseus/) explains. But it turned out to be a
good size and shape to *start* from, so it's been pulled out into a template.

This post is the changelog for that extraction, and the rest of the posts here go deeper
on the parts that were interesting. If you're evaluating whether to adopt this, the short
version is: the build pipeline is essentially unchanged, and almost all the work went
into removing assumptions about one particular website.

## What came out

The Automerge website itself — its docs, blog, home page demo, and the assets behind
them. That was around 15 MB, mostly WebM videos, a WebAssembly bundle, and screenshots.

Also removed: the `demo/` folder containing the interactive home page demo, the Overpass
typeface, and an unused `@types/highlightjs` dependency that had outlived the switch to
Prism.

In their place is the site you're reading, which documents the build system and is built
by it. That's deliberate — it means every feature has something exercising it, and a
change that breaks templating or macros or link checking shows up as a visibly broken
page rather than passing quietly.

## What moved into config

Site identity was scattered across seven files. The domain and description lived in
`env.ts`, but the RSS channel title was hardcoded in `rss.ts`, the fallback page title in
`macros.ts`, the `llms.txt` preamble in `llms.ts`, and the `site repo` command opened a
URL baked into `app.ts`.

All of it now lives in one block at the top of `system/env.ts`: domain, title,
description, share image, docs index, repo URL. That block is the entire configuration
surface, and there is deliberately no config file — see the [next
post](/blog/ship-of-theseus/) for why that distinction matters.

`site repo` now reads your git remote instead, so it survives forks and renames.

## What was actively hostile

The most interesting finding. Several code paths *threw* or failed on a missing file
rather than warning, and all of them triggered on the same action: deleting the example
content. Which is the first thing anyone does with a starter.

- `{{most-recent-blog-post}}` threw outright when no page used `template: blog`. It was
  called from the main nav, so deleting the blog broke every page on the site.
- `{{blog-sidebar}}` dereferenced `page.parent` unconditionally, so removing the blog
  index broke every post under it.
- `llms.txt` generation read two Automerge-specific includes directly, and failed if
  either was absent.
- `Redirects.txt` was read whether or not it existed.

All four now degrade instead of exploding. This is the class of bug that only appears
when you try to use something as a starting point rather than as a finished site, so it
had no reason to surface before.

## What got separated

The macros that encode one site's structure — blog sidebars, docs previous/next links —
are now grouped under a banner comment marking them as examples rather than features.
They're still there, still working, but it's obvious at a glance which half of
`macros.ts` is safe to delete.

That's the general pattern of this whole exercise: not removing the opinionated parts,
just making it clear which parts are opinions.

## Bugs found along the way

Building the docs surfaced three genuine bugs, none of them introduced by the extraction:

The `info` macro emitted `class="info"` while the stylesheet only defined `.note`, so
info callouts had always rendered as unstyled text. Easy to miss, because the `caution`
variant was styled correctly.

`landing.css` constrained `<section>`, which HTML pages provide and Markdown pages don't
— so the blog index ran edge to edge. The constraint moved to `<main>`.

Font subsetting was passing `--layout-features=kern` to hb-subset, which *replaces* its
defaults rather than extending them, silently discarding ligatures and stylistic sets.
That one got [measured properly](/blog/fonts-what-subsetting-costs/).

## Housekeeping

The licence retains the original Automerge copyright notice, as MIT requires, with a new
one alongside rather than replacing it. Credits go in the README too.

CI gained a typecheck step and the font subsetting binaries, so the first typeface you add
actually gets subsetted rather than silently falling back.

Git history was squashed to a single commit. The Automerge site's assets had been deleted
from the tree but were still in history, so a fresh clone pulled 6.18 MB to get a 520 KB
working tree. It's now 76.5 KiB.

{{info: That distinction catches people out regularly. `git rm` removes a file from the
current tree, not from history — every clone still downloads every version of every
binary ever committed. Worth checking with `git count-objects -vH` before you publish
anything you expect people to clone.}}
