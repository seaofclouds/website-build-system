---
title: Stylesheets
description: Four CSS files, what belongs in each, and how to change the look.
template: docs
---

Four stylesheets, loaded in this order by `template/includes/head-stuff.html`. Later
files win ties.

```
content/static/
  variables.css   every custom property on the site, declared in one place
  base.css        the reset and the element defaults
  layout.css      where the masthead, nav, content and footer sit
  content.css     prose, marginalia, figures, arrangements, callouts, code
```

The [styleguide](/docs/styleguide/) demonstrates everything in the last two. Keep it open
while you're changing them — if a class stops working, it shows up there first.

## The four files

`variables.css` is separate because of how CSS handles a typo. An undefined custom
property fails *silently* — `color: var(--colour-text)` doesn't warn and doesn't fall
back, the whole declaration is just dropped. One declared list is the only thing you can
check the rest of the site against:

```bash
grep -oh 'var(--[a-z0-9-]*' content/static/*.css | sort -u
```

Anything that prints and isn't declared in `variables.css` is a typo.

The other three split by scope. `base.css` is what a plain HTML document should look like
— headings, links, lists, tables. `layout.css` is the shape of the page around the
content. `content.css` is everything inside it.

There's deliberately no `prose.css` and no `gallery.css`: an essay may contain a gallery
and a gallery page may contain paragraphs, so splitting that way would mean deciding
which one a page is. What varies isn't the content, it's the shape around it — and that's
what `layout.css` handles.

{{info: The `46rem` breakpoint is written as a literal in eleven places, and has to be.
A media query can't read a custom property. You *can* assign one inside a media query,
though, which is how `--content-gutter` collapses at that breakpoint without the
geometry being duplicated.}}

## Layouts

A page picks its shape with a class on `<body>`, set by its template:

| Class | Regions | Template |
| --- | --- | --- |
| `layout-plain` | content, held to the measure | `default` |
| `layout-wide` | content, full page width | `landing` |
| `layout-nav` | left navigation + content | `docs`, `blog` |
| `layout-margin` | content + a right gutter for marginalia | `essay` |

This is the layer that lets one stylesheet set dress more than one site. A documentation
site is `layout-nav`; a long-form essay site is `layout-margin`; a gallery is
`layout-wide`. Add a shape by adding a class, not by writing a new stylesheet.

Every region on every layout is a whole number of columns on the same twelve-column
grid, so the masthead, the navigation, the body and the marginalia all hang off one set
of vertical lines. The [styleguide](/docs/styleguide/#grid) has the numbers and where
they come from; the tokens are `--grid-col`, `--grid-gap`, `--grid-step`, `--measure`
and `--band`.

`layout-nav` and `layout-margin` don't compose: the nav takes columns 1–3 and the
marginalia takes 10–12, but a page with both would need the body somewhere that doesn't
collide with either, and there isn't room at twelve columns.

### It isn't `display: grid`

Nothing sets one. Regions are sized and offset in whole columns using the tokens above,
and `<main>` reserves the gutter as padding rather than as a column.

That's deliberate, and worth knowing before you refactor it. Asides and figure captions
are absolutely positioned into the reserved gutter, which is what lets an aside sit level
with an arbitrary *line* of a paragraph. A real grid column would force every aside to
start its own row, and the marginalia would stop being marginalia.

To check what actually lines up, run the build with the guides painted on:

```bash
./site --fluid
```

## Spacing

One ramp, reconciling two systems that arrived here separately. The reading layout counts
in body lines — 24px, the line-height of body text — so an aside pulled up by N lines
lands exactly on a line of the paragraph beside it. The gallery layouts count in 8pt
steps.

24 is divisible by 8, so one ramp holds both: 4, 8, 16, **24**, 32, 48, 64, 96. Use
`--baseline` for anything that has to land on the text rhythm, and `--space-xs` through
`--space-3xl` for everything else.

## Naming

One rule governs the class vocabulary: **modes are words, numeric modifiers are bare
integers.** So `wide`, `staggered` and `float-left`, but `tile-3`, `pos-2` and
`space-top-4`.

It's worth keeping when you add a class of your own. It means you can tell at a glance
whether a name describes a kind of thing or a quantity of one.

## Changing the look

Most of what you want to change is a value in `variables.css`. Colours are achromatic on
purpose — a starter shouldn't pick your brand colour. Change `--accent` first; it's the
only hue on the site.

For type, `--font-sans` and `--font-mono` change every font at once. There's a commented
`--font-serif` for when you want a serif body — see [Fonts](/docs/fonts/) for how to get
the font files in.

## Per-template stylesheets

A template or a page can add a stylesheet with `styles:` in its frontmatter, and the two
sets combine:

```
---
styles: /static/landing.css
---
```

`landing.css` is the only one the starter ships, and it holds the home page's display
type and the handful of sections that page is made of. If you're adapting this starter,
it's the first file to empty out — nothing in it is load-bearing for any other page.
