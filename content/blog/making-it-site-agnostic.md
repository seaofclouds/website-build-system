---
title: Removing One Website From a Build System
description: What it takes to generalise something that was never meant to be general, without turning it into a framework.
date: 2026-07-27
template: blog
---

The tricky part of turning a bespoke build system into a starting point isn't finding the
hardcoded strings. It's deciding how far to go — because every step toward "general"
is also a step toward the framework this deliberately isn't.

## The line we drew

Configuration goes in `system/env.ts`, as plain variables you edit:

```ts
domain: "example.com",
title: "Your Site",
description: "…",
```

Not in `site.config.js`. That looks like a trivial distinction and isn't.

A config file is a file the build system *reads*. To read it, it needs to know what keys
to expect. That's a schema, and a schema is an interface, and an interface is a promise
to keep it stable across versions — at which point you have a dependency with a public
API, and the thing this is supposed to be has quietly stopped existing.

Editing a variable in a file you own carries no such promise. If you want to rename
`title`, rename it; the compiler will show you the four places to update.

The same reasoning killed a plugin API. To add a macro you add a `case` to a `switch`:

```ts
case "reading-time": {
  const words = page.compiledBody.split(/\s+/).length
  return `${Math.ceil(words / 200)} min read`
}
```

There's no registration step and nothing to import, because the extension mechanism is
that you have the code.

## Failing softly is a feature

The more valuable work was the four places that crashed when example content was
removed. Three threw, one hit a missing file. Every one of them fired on exactly the
action a new adopter takes first.

The fix in each case was to degrade rather than die. `{{most-recent-blog-post}}` now logs
which page called it and returns `#` when no blog exists. `{{blog-sidebar}}` treats a
missing parent as an empty list. `llms.txt` generation skips itself if there's no docs
sidebar to read, which also means blanking one config value turns the feature off
cleanly. `Redirects.txt` is optional.

The principle: **a build system for a site that doesn't exist yet should never fail
because part of the site doesn't exist yet.**

## Marking what's opinionated

Roughly half of `macros.ts` serves one particular site shape — a blog whose posts live
under `/blog/`, a docs section ordered by a sidebar file. Deleting that half would have
made the starter less useful, since those macros are the best worked examples of what the
system is *for*.

So they stayed, under a banner:

```
─── SITE-SPECIFIC MACROS ───────────────────────────
Everything below this line exists to serve one
particular website's structure. They are examples of
the kind of thing this system is for, not features
of it. Adapt them, or delete them and write your own.
```

Not a technical boundary — nothing enforces it. Just an honest label, which is mostly
what a starter template can offer.

## What didn't change

Worth saying: the compile pipeline is untouched. Frontmatter parsing, the clean-URL
rewrite, template resolution, the parent/child tree, macro expansion, link validation,
RSS, sitemap — all of it works exactly as Ivy wrote it.

That's the actual argument for starting here rather than from scratch. The interesting
part was already done; the work was removing one website's fingerprints from it.
