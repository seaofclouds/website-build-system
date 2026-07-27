---
title: Hello World
description: The first example post, and a quick tour of what a post can contain.
date: 2026-01-15
template: blog
---

This is an example blog post. It exists so the blog template, the index on the
[blog page](/blog/), and the RSS feed all have something to work with.

A post is just a Markdown file with a `date` in its frontmatter. That date is what puts
it in the feed, orders it in the index, and drives the previous/next links at the bottom
of this page.

## What you get for free

Because this page has a `title`, a `description`, and a `date`, it's automatically
included in `/index.xml` with its full content. Nothing was configured to make that
happen — those three fields are the entire opt-in.

The heading above is a link. That's the `header_anchors: true` frontmatter on the blog
template, which turns every `h2` through `h4` into an anchor so people can link to a
specific part of a long post.

## Writing

Ordinary Markdown works as you'd expect, including footnotes[^1] and typographic
niceties — "curly quotes", em dashes, and ellipses are converted for you.

Code is highlighted:

```ts
const greet = (name: string) => `Hello, ${name}`
```

And you can call out a point when it's worth interrupting the reader for:

{{info: Callouts come from the `info` and `caution` macros. They're four lines each in
`system/macros.ts` — a decent example of how little it takes to add your own.}}

## Drafts

While you're working on a post, set `publish: draft` in its frontmatter. It'll show up
when you run `./site`, but `./site build` will leave it out — and if you link to a draft
from a published page, the build says so.

[^1]: Footnotes are on by default, via the `markdown-it-footnote` plugin.
