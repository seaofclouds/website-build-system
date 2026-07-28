---
title: The stylesheet architecture
description: One base.css became four files, and picked up the Ink & Switch reading layout and the seaofclouds gallery arrangements on the way.
date: 2026-07-27
template: blog
---

`base.css` was one 640-line file holding the reset, the masthead, the sidebar, the code
blocks and the blog bits, with `docs.css` and `landing.css` bolted on beside it. It's now
four files with a rule for what goes in each:

```
variables.css   every custom property, declared in one place
base.css        the reset and the element defaults
layout.css      where the masthead, nav, content and footer sit
content.css     prose, marginalia, figures, arrangements, callouts, code
```

`docs.css` is gone — it was layout, and layout now lives in one file. `landing.css`
keeps only the home page's display type.

`variables.css` earns its separation from how CSS handles a typo. An undefined custom
property fails *silently* — the declaration is dropped at computed-value time, no
warning. One declared list is the only thing you can check the rest against. The
seaofclouds sources this borrows from had six phantoms in them.

## Two vocabularies

Imported at the same time: the Ink & Switch reading layout — a measure with a gutter
beside it, and figures that break out of it in named ways — and the seaofclouds gallery
arrangements, which are twelve-column compositions.

{{ figure caption-below border ![](measure-and-gutter.svg)
The reading layout. Nothing flows into the gutter; asides and captions are lifted out of
the flow and positioned into it, level with the paragraph they annotate.
}}

{{ aside Blog posts use the `docs` layout, which has a left sidebar and no gutter — so
this aside is in normal flow rather than out to the right. The same markup, a different
shape around it. }}

Because they're positioned rather than laid out in a grid column, an aside can sit beside
an arbitrary *line* of text instead of starting its own row. That's the part a
two-column layout can't do, and it's why the mechanism is worth the awkwardness.

They are different design languages, not two themes of one. They overlap almost nowhere
except that both style `<figure>`, and they *disagree* about it — `position: relative`
against `display: flex`, an absolutely-positioned caption in a grey box against a centred
flex row. Concatenated, whichever loaded last would win for every figure on the site.

So bare `figure` and `figcaption` carry only the shared baseline, and every arrangement
rule is scoped to its container. A figure inside `.arrangement` behaves one way; the same
figure in a paragraph behaves the other. There's a [styleguide](/docs/styleguide/) now that
demonstrates both.

## Things that had to be resolved

**`aside` meant two different things.** Here it was the fixed left navigation sidebar; at
Ink & Switch it's right-gutter marginalia, and every aside rule in their stylesheet
assumes that. The nav moved to `<nav class="site-nav">` and the bare element is now
marginalia only. Doing that first saved debugging phantom positioning later.

**`.move-up` was defined twice** with different values — one with a `-13px` baseline
correction, one without — in two files loaded in an order where the correction never
applied. Kept without it: it's the version that has actually been rendering.

**The two spacing scales don't share a grid.** One counts 24px body lines, the other 8pt
steps. But 24 is divisible by 8, so one ramp holds both: 4, 8, 16, **24**, 32, 48, 64, 96.

**A hardcoded `#f2f2f2`** for gutter captions would have been a bright slab in dark mode.
It's a themed token now, and the box only appears when the caption is actually in the
gutter — below an image it's just quiet text and doesn't need an edge.

## Layouts are a class, not a file

A page picks its shape with a class on `<body>`: `layout-plain`, `layout-wide`,
`layout-nav`, `layout-margin`. That's what lets one stylesheet set dress a documentation
site, an essay site and a gallery.

`layout-nav` and `layout-margin` deliberately don't compose: the nav is columns 1–3 and
the marginalia is 10–12, and a page with both leaves nowhere for the body to go that
doesn't collide with one of them.

## A macro bug fell out of it

The nested `{{aside}}` inside a figure caption that the styleguide demonstrates didn't
work, and the reason turned out to be general: macro matching used a lazy
`/{{(.+?)}}/`, so an outer macro's match ended at the *inner* macro's closing braces. Half
of one got swallowed and the other half leaked into the page — which was also happening,
silently, to a comment that quoted a macro while explaining it.

Braces are counted now rather than matched by regex, so the outermost macro resolves
first and nesting works in both directions.

## Also

`./site --fluid` and `./site --fixed` paint the twelve-column guides over every page.

The grid is the one from the Aria notebook: 1 rail, 7 body, 1 space, 3 marginalia. The
page is 72rem — 2 × 1rem of padding plus 70rem of grid — and 70rem is twelve 4rem
columns with eleven 2rem gaps. Every number after that is round: the body is 46rem, the
marginalia band 16rem, and the docs navigation is the same 16rem band mirrored to the
left, so both layouts use all twelve columns and the body is the same width on each.

The rail is the one part not in use. It's the narrow column Aria puts section marks in,
and since nothing here has section marks the body absorbs it and starts at column 1.
`--rail` stays declared anyway — the affordance is the point, and switching it on is two
lines rather than a re-derivation.
