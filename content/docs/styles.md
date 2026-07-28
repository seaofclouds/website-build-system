---
title: Stylesheets
description: Four CSS files, what belongs in each, and how to change the look.
template: docs
---

Four stylesheets in `content/static/`, loaded in this order by
`template/includes/head-stuff.html`. Later files win ties.

| File | Use case |
| --- | --- |
| `variables.css` | Every custom property on the site. Go here to change a colour, a font, a spacing step or the width of the grid — most of what you want to adjust is a value in this file and nothing else. |
| `base.css` | The reset and the element defaults: what a plain HTML document should look like before any class touches it. Add a rule here only if it would still make sense on a page with no `<main>`. |
| `layout.css` | The shape of the page around the content — masthead, navigation, footer, and the `layout-*` classes. Go here when you're moving a region, not when you're styling what's inside one. |
| `content.css` | Everything inside the content area: prose, marginalia, figures, arrangements, callouts, code. The largest file, and the one the [styleguide](/docs/styleguide/) exercises. |

Keep the styleguide open while you're changing the last two — if a class stops working,
it shows up there first.

## Why variables are separate

Because of how CSS handles a typo. An undefined custom property fails *silently* —
`color: var(--colour-text)` doesn't warn and doesn't fall back, the whole declaration is
just dropped. One declared list is the only thing you can check the rest of the site
against:

```bash
grep -oh 'var(--[a-z0-9-]*' content/static/*.css | sort -u
```

Anything that prints and isn't declared in `variables.css` is a typo.

The other three split by scope rather than by kind. There's deliberately no `prose.css`
and no `gallery.css`: an essay may contain a gallery and a gallery page may contain
paragraphs, so splitting that way would mean deciding which one a page is. What varies
isn't the content, it's the shape around it — and that's what `layout.css` handles.

## The tokens

The ones worth knowing by name. The rest are colours and type, and they're readable in
the file itself.

| Token | Use case |
| --- | --- |
| `--page-width` | The whole grid plus its padding, `72rem`. Change this and every region follows, because they're all derived from it. |
| `--page-padding` | The page's edge margin, `1rem`. Read by `<main>` on every layout *and* by the masthead, which is what keeps the wordmark lined up with the content beneath it. It steps to `2rem` below 800px, where the navigation has stacked and `<main>` runs edge to edge, and back to `1rem` below 500px. Widen it here rather than in one layout's padding, or the two stop agreeing. |
| `--grid-col`, `--grid-gap` | One column and one gutter, `4rem` and `2rem`. Use them when a width has to land on the grid — a table's first column, a figure that spans a known number of columns. |
| `--grid-step` | A column plus its gap, `6rem`. This is the unit of *offset*: a region three steps in starts on column 4. |
| `--measure` | How wide text is allowed to get. Eight columns on an essay, six on a docs page, and `100%` on any page narrow enough to have stacked its navigation. A layout class sets it; nothing else should. |
| `--band` | The three columns that hold the marginalia — and, mirrored, the navigation. One token on purpose, so the two can't drift apart. |
| `--content-gutter` | The space `<main>` reserves for the band. Reclaim it with `margin-right: calc(-1 * var(--content-gutter))` to make something span the full width. It collapses to `0` once the layout can no longer afford the band, which is how the whole vocabulary goes responsive without a second set of rules — and it's why that `margin-right` is a no-op rather than a bug at narrow widths. |
| `--baseline` | One body line, `24px`. For anything that has to land on the text rhythm — an aside's `move-up`, the spacing utilities. |
| `--space-xs` … `--space-3xl` | The general spacing ramp, for everything that doesn't. |
| `--accent` | The only hue on the site. Change this first. |

Both layouts give the band up at `72em`, and they have to do it together. The grid is
`72rem` of fixed units, so below that neither can keep what it reserved without the body
absorbing every lost pixel — four fixed columns starve a narrowing page as effectively as
six. On the essay that width is also where the change is invisible: inside the gutter the
body is exactly the measure, so closing it leaves the text at the same width and the same
left edge, and only the asides move. Below `800px` a docs or blog page additionally stacks
its navigation above the content, and the body takes all twelve columns.

{{caution: The width appears twice — once where the gutter closes in `layout.css`, once
where marginalia stops being positioned into it in `content.css` — and the two are written
to be strictly complementary, `width < 72em` against `min-width: 72em`. Let them overlap by
a single pixel and asides get absolutely positioned into a band that isn't there, landing
on top of the body text. That has happened once per layout so far.}}

{{info: These widths are literals — thirteen media queries still use `46rem` for other
things — because a media query can't read a custom property. It *can* assign one, which is
how `--content-gutter` collapses at the breakpoint without the geometry being duplicated.}}

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
they come from.

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

### Why one spacing ramp

The two vocabularies in `content.css` arrived counting differently. The reading layout
counts in body lines — 24px, the line-height of body text — so an aside pulled up by N
lines lands exactly on a line of the paragraph beside it. The gallery layouts count in
8pt steps.

24 is divisible by 8, so one ramp holds both: 4, 8, 16, **24**, 32, 48, 64, 96. That's
why there's a `--baseline` sitting outside the `--space-*` ramp rather than a step within
it.

## Naming

One rule governs the class vocabulary: **modes are words, numeric modifiers are bare
integers.** So `wide`, `staggered` and `float-left`, but `tile-3`, `pos-2` and
`space-top-4`.

It's worth keeping when you add a class of your own. It means you can tell at a glance
whether a name describes a kind of thing or a quantity of one.

## Changing the look

Colours are achromatic on purpose — a starter shouldn't pick your brand colour. For type,
`--font-sans` and `--font-mono` change every font at once, and there's a commented
`--font-serif` for when you want a serif body; see [Fonts](/docs/fonts/) for how to get
the files in.

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
