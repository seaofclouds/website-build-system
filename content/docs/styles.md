---
title: Stylesheets
description: Four CSS files, what belongs in each, and the layout and figure vocabulary they provide.
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

The other three split by scope, which is really a question of what survives when you
change something. `base.css` is what a plain HTML document should look like — headings,
links, lists, tables. `layout.css` is the shape of the page around the content.
`content.css` is everything inside it.

There's deliberately no `prose.css` and no `gallery.css`. An essay may contain a gallery
and a gallery page may contain paragraphs, so splitting them would mean deciding which
one a page is — and pages aren't like that. What *does* vary is the shape around the
content, and that's what `layout.css` handles.

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

`layout-nav` and `layout-margin` don't compose: the nav takes columns 1–3 and the
marginalia takes 10–12, but a page with both would need the body somewhere that doesn't
collide with either, and there isn't room at twelve columns.

## One grid, twelve columns

Every region on every page is a whole number of columns on the same grid, so the
masthead, the navigation, the body text and the marginalia all hang off one set of
vertical lines:

```
essay   1 . . . . . . . . 8        9         10 . 11 . 12
        body                    │  space  │  marginalia

docs    1 . 2 . 3        4        5 . . . . . . . . 12
        navigation    │  space  │  body
```

The numbers come out round, which is why the page padding is `1rem`:

```
--page-width 72rem  =  2 × 1rem padding  +  70rem of grid
70rem               =  12 columns × 4rem  +  11 gaps × 2rem
```

Everything else is derived from those two lines. The **measure** is eight columns,
`46rem`; the **band** is three, `16rem`. `--grid-step` is one column plus its gap,
`6rem`, which is how a region's offset is expressed — the nav layout's body starts four
steps in.

`--band` is deliberately one token rather than two. The essay's marginalia is the right
band and the docs navigation is the left band — the same three columns mirrored.

The split this derives from is the Aria notebook's 1 rail · 7 body · 1 space · 3
marginalia. The **rail** is a narrow column for section marks and running heads; nothing
here uses one yet, so the body absorbs it and starts at column 1. `--rail` stays
declared so that turning it on is two lines rather than a re-derivation: drop
`--measure` to seven columns, and add one `--grid-step` to `.layout-margin`'s
`padding-left`. Every region downstream still lands on the same lines.

Nothing flows into the gutter. `<main>` reserves it as padding, and then asides and
figure captions are lifted out of the flow and positioned into it, level with the
paragraph they annotate.

That's the mechanism. Because they're positioned rather than laid out in a grid column,
an aside can sit beside an arbitrary *line* of text instead of starting its own row —
which is what makes marginalia feel like marginalia rather than a second column.

Every figure mode works by releasing the caption from the gutter back into normal flow.
`wide` additionally reclaims the gutter, so the figure spans measure plus gutter.

{{info: The `46rem` breakpoint is written as a literal in eleven places, and has to be.
A media query can't read a custom property. You *can* assign one inside a media query,
though, which is how `--content-gutter` collapses at that breakpoint without the
geometry being duplicated.}}

### It isn't `display: grid`

Nothing sets one. Regions are sized and offset in whole columns using the tokens above,
which is what lets the marginalia stay absolutely positioned — and that matters, because
an aside has to sit level with an arbitrary *line* of a paragraph rather than starting
its own grid row. A real grid column would force every aside onto its own row and the
marginalia would stop being marginalia.

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

It's worth keeping. It means you can tell at a glance whether a class names a kind of
thing or a quantity of one.

## Changing the look

Most of what you want to change is a value in `variables.css`. Colours are achromatic on
purpose — a starter shouldn't pick your brand colour. Change `--accent` first; it's the
only hue on the site.

For type, `--font-sans` and `--font-mono` change every font at once. There's a commented
`--font-serif` for when you want a serif body — see [Assets & Fonts](/docs/assets/) for
how to get the font files in.

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
