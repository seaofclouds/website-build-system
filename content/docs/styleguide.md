---
title: Styleguide
template: docs
date: 2026-07-27
description: Every layout class the stylesheets support — asides, figures, tiles, grids, arrangements, spacing.
---

This page demonstrates every layout pattern the stylesheets support. Use it as a visual reference while writing a page, and as a test surface when changing them — if a class stops working, it shows up here first.

{{ aside Every class below goes on a `<figure>` (via the figure macro) unless noted otherwise. Widths, floats, tile counts and aspect ratios all compose — most layouts are a combination of two or three classes. }}

It's a `docs` page, so it carries the sidebar — and it still has marginalia down the right, because the docs and blog layouts reserve that band too. The `essay` template gives the same vocabulary a wider body and no navigation. Everything below works the same on any of them.

Each section ends with a table of the classes it covers. One rule runs through all of them: **modes are words, numeric modifiers are bare integers** — `wide` and `staggered`, but `tile-3` and `pos-2`. Where a table row reads `num`, substitute the number.

## Grid

Every region on every page of this site is a whole number of columns on the same grid, so the masthead, the navigation, the body text and the marginalia all hang off one set of vertical lines.

```
essay   1 . . . . . . . . 8        9         10 . 11 . 12
        body                    │  space  │  marginalia

docs    1 . 2 . 3   4 . . . . . . . 9      10 . 11 . 12
        navigation  body                   marginalia
```

The numbers come out round: the page is 72rem, which is 2 × 1rem of padding plus 70rem of grid, and 70rem is twelve 4rem columns with eleven 2rem gaps. The **band** is three columns, 16rem, and it holds the marginalia on both layouts — and the navigation on this one, mirrored to the left. One `--band` token, so the two can't drift.

The **measure** is what differs: eight columns (46rem) on an essay, six (34rem) here, because a docs page spends three columns on navigation. Four regions don't fit twelve columns with a gap between each, so this layout drops the space column between the nav and the body rather than taking it out of the measure — the nav is a fixed sidebar with its own separation, and 34rem reads far better than 28rem would. The cost is that marginalia sits 2rem from the text here against 8rem on an essay.

Nothing flows into the space column or the band. Asides and figure captions are lifted out of the flow and positioned into the band, level with the paragraph they annotate.

The split this comes from is 1 rail, 7 body, 1 space, 3 marginalia — the rail being a narrow column for section marks and running heads. Nothing here uses one yet, so the body absorbs it and starts at column 1. `--rail` stays declared, because turning it on should be two lines rather than a re-derivation: drop `--measure` to seven columns and add a `--grid-step` to the essay layout's left padding.

Run `./site --fluid` to paint the columns over the page and check.

That's the whole trick. Because they're positioned rather than laid out in a column, an aside can sit beside an arbitrary *line* of text instead of starting its own row.

Every layout mode below works by releasing the caption from the gutter back into normal flow. `wide` additionally reclaims the gutter, so the figure spans measure plus gutter.

## Asides

The byline at the top of this page is an `aside.meta`, emitted by the template. Inline asides like the one above sit in the gutter next to whatever paragraph they follow.

{{ aside 1 Pulled up one body line, so it sits beside the *first* line of the paragraph to its left rather than the second. }}

The `{{ aside N }}` macro takes an optional body-line count that nudges the aside upward, so it lands beside the line you actually meant. One body line is 24px. Colons are optional — `{{aside: …}}` and `{{aside 2: …}}` both work.

Use `highlight` on a span to mark the phrase an aside is <span class="highlight">talking about</span>, if the connection isn't obvious from position alone.

```
{{ aside 3 Pulled up three body lines, to sit beside the sentence it annotates. }}

Some body text, with a <span class="highlight">highlighted phrase</span> in it.
```

| Class | Use case |
| --- | --- |
| `move-up` | Positions an aside against the text it belongs to. You don't usually write it — `{{ aside num }}` emits it and puts the count in `--move-up`. Reach for a larger number when the aside has drifted below the sentence it annotates, or when two asides would otherwise overlap. |
| `highlight` | On a `<span>` in the body, to mark the exact phrase an aside is about. Worth it when position alone doesn't make the link. Use it sparingly — on every aside it stops reading as emphasis. |
| `meta` | On the byline aside a template emits at the top of a page. Removes the indent an aside otherwise carries, so the byline starts on the same line as the marginalia below it. |

## Figures

The default: the figure sits in the measure, and its caption floats out into the gutter.

{{ figure ![](/static/placeholder-3x2.svg)
A default figure. The caption sits out in the marginalia band.
}}

### Caption below

`caption-below` pulls the caption out of the gutter and puts it under the image, keeping the figure at its normal column width. Use it when the caption would look stranded out there, or when it's long enough to want the full width.

{{ figure caption-below ![](/static/placeholder-3x2.svg)
A caption that sits below the image instead of in the gutter.
}}

### Wide

`wide` breaks out of the measure and takes the reserved gutter as well, spanning columns 2–12 — 64rem. The caption flows below. On a layout with no gutter it still releases the measure cap and fills whatever the content box gives it.

{{ figure wide ![](/static/placeholder-16x9.svg)
A wide figure. Its caption sits below the image, because there's no gutter left to put it in.
}}

### Tiled rows

`tile-2`, `tile-3`, `tile-4` — each figure is its own macro, and each keeps its own caption. Put the same `tile-N` on each and they lay out side by side within the measure.

{{ figure tile-3 ![](/static/placeholder-a.svg) One.}}
{{ figure tile-3 ![](/static/placeholder-b.svg) Two.}}
{{ figure tile-3 ![](/static/placeholder-c.svg) Three.}}

### Tiled rows with a shared frame

Mix `tile-N` with a `ratio-` class to force every tile to the same shape. The source images keep their own dimensions; `object-fit: cover` crops to fit.

{{ figure tile-3 ratio-1x1 ![](/static/placeholder-16x9.svg) Wide source, cropped square.}}
{{ figure tile-3 ratio-1x1 ![](/static/placeholder-1x1.svg) Already square.}}
{{ figure tile-3 ratio-1x1 ![](/static/placeholder-2x3.svg) Tall source, cropped square.}}

### Floated figures

`float-left` / `float-right`, paired with a width fraction — `half`, `third` or `quarter`. Text wraps around them.

{{ figure float-left third ![](/static/placeholder-a.svg)
A third-width float.
}}

The fractions share denominators with `tile-2`, `tile-3` and `tile-4`, so a floated image and a tile of the same fraction come out at the same visual size. Below 46rem the float collapses to natural block flow, like everything else here. Keep the wrapping text long enough to clear the image's height, or add a `<br style="clear: both">` if you need to break out early — otherwise the next heading rides up alongside it, which looks like a bug and isn't.

### Aspect ratios

Force a figure's media to a frame, cropping the overflow. Composes with any layout class.

{{ figure tile-4 ratio-1x1  ![](/static/placeholder-16x9.svg) 1x1}}
{{ figure tile-4 ratio-3x2  ![](/static/placeholder-16x9.svg) 3x2}}
{{ figure tile-4 ratio-4x3  ![](/static/placeholder-16x9.svg) 4x3}}
{{ figure tile-4 ratio-16x9 ![](/static/placeholder-16x9.svg) 16x9}}

Available: `ratio-1x1`, `ratio-3x2`, `ratio-4x3`, `ratio-16x9`, `ratio-2x3`.

### Border

`border` adds a hairline edge, for images that would otherwise dissolve into the page — diagrams and screenshots on white backgrounds, mostly.

{{ figure border float-right half ![](/static/placeholder-pale.svg)
A near-white image, with a border.
}}

Without it, a pale figure like this one has no edge at all and reads as floating text. With it you get a crisp boundary that still stays quiet. It's a real `border` rather than an inset shadow, so with `box-sizing: border-box` the line sits inside the declared dimensions — no layout shift — and it follows the rounded corners.

<br style="clear: both">

### The figure classes

Classes go between the macro name and the image, separated by spaces, and they compose — most figures on a real page carry two or three:

```
{{ figure wide ratio-16x9 ![A stack of index cards](/cards.webp)
The caption, which can contain **Markdown**.
}}
```

which emits:

```html
<figure class="wide ratio-16x9">
  <img src="/cards.webp" alt="A stack of index cards">
  <figcaption>
    <p>The caption, which can contain <strong>Markdown</strong>.</p>
  </figcaption>
</figure>
```

Writing that HTML by hand does the same thing — the macro is a convenience, not a requirement.

| Class | Use case |
| --- | --- |
| `wide` | Gives the figure the marginalia band as well as the measure. For images whose detail is the point — diagrams, dense screenshots, anything a reader will lean in at. The caption drops below, which makes this the escape hatch when a caption is too long to sit in the gutter. |
| `caption-below` | Keeps the figure at its normal width but moves the caption underneath. Use when the caption is doing real work — a sentence or two of argument — rather than labelling. A stranded three-line caption in the gutter is the usual reason to reach for it. |
| `tile-num` | Puts figures side by side within the measure, `num` being 2, 3 or 4. Every figure in the row needs the same class. For images meant to be compared with each other rather than read one at a time. |
| `float-left`, `float-right` | Text wraps around the figure. Good for a small supporting image that shouldn't interrupt the paragraph. Needs a width fraction alongside it, and enough following text to clear the image's height — otherwise the next heading rides up beside it. |
| `half`, `third`, `quarter` | The width of a float. Shares denominators with `tile-num`, so a floated image and a tile of the same fraction come out the same visual size. |
| `ratio-WxH` | Crops the media to a fixed frame — `ratio-1x1`, `ratio-3x2`, `ratio-4x3`, `ratio-16x9`, `ratio-2x3`. Mostly used with `tile-num`, to stop a row of mismatched sources reading as a mistake. Crops from the centre, so check that nothing important is at an edge. |
| `border` | A hairline edge, for images that would otherwise dissolve into the page — pale diagrams and screenshots with white backgrounds. Not needed on photographs. |
| `autoplay` | On a figure whose source is a `.mp4`, `.mov` or `.webm`, adds `autoplay loop muted`. For short silent loops that work as moving illustrations. Don't use it on anything with sound or a running time. |

### Grid — several images, one caption

Multiple images in one `<figure>` sharing one `<figcaption>`. The figure macro emits a single `<img>`, so this pattern needs raw HTML:

<figure class="wide">
  <div class="grid grid-columns-3">
    <img src="/static/placeholder-a.svg" alt="">
    <img src="/static/placeholder-b.svg" alt="">
    <img src="/static/placeholder-c.svg" alt="">
  </div>
  <figcaption>Three images, one caption. Composes with <code>wide</code> for a full-width row.</figcaption>
</figure>

| Class | Use case |
| --- | --- |
| `grid` | On a `<div>` wrapping the images inside a `<figure>`. Use it when the images are one thing — three views of the same object, a before and after — and one caption covers all of them. If each image needs its own caption, use `tile-num` instead. |
| `grid-columns-num` | How many per row, `num` being 2, 3 or 4. All collapse to a single column below 46rem. |

### A nested aside in a caption

Put an `{{ aside }}` macro inside a figure's caption and the caption splits into two stacked boxes in the gutter — the caption text, then the aside beneath it.

{{ figure ![](/static/placeholder-c.svg)
The caption comes first, in its own box.
{{ aside And the aside sits below it, in a second box with matching padding, so the two text edges line up. }}
}}

## Spacing

Vertical breathing room in body-line increments, so extra space still lands on the baseline grid. Two forms — `space-top-N` and `space-bottom-N` — for N in 1, 2, 3, 4, 6 and 8. They work on any element, not just figures.

{{ figure space-top-4 ![](/static/placeholder-d.svg)
`space-top-4` — four body lines, 96px, of extra room above.
}}

| Class | Use case |
| --- | --- |
| `space-top-num`, `space-bottom-num` | Extra room above or below any element, `num` being 1, 2, 3, 4, 6 or 8 body lines. For the occasional place where the default rhythm reads as cramped — around a full-width figure, or before a section that starts a new argument. If you find yourself putting the same one on every figure, change the default in `content.css` instead. |

## Arrangements

Where the figure modes above are about one image's relationship to a column of text, arrangements are about several images' relationship to each other. They're twelve-column compositions, deliberately a little irregular.

A container class picks the composition and each child takes a numbered slot:

```html
<div class="arrangement staggered">
  <figure class="pos-1">…</figure>
  <figure class="pos-2">…</figure>
  <figure class="pos-3">…</figure>
</div>
```

Slots a composition doesn't name fall into the grid's normal flow, so adding an unlabelled figure won't break the layout. Every arrangement collapses to a single column, in source order, below 46rem.

### Staggered

Three images stepping left, right, left, overlapping vertically.

<div class="arrangement staggered">
{{ figure pos-1 ![](/static/placeholder-a.svg) One.}}
{{ figure pos-2 ![](/static/placeholder-b.svg) Two.}}
{{ figure pos-3 ![](/static/placeholder-c.svg) Three.}}
</div>

### Diagonal

Two images stepping down and across.

<div class="arrangement diagonal">
{{ figure pos-1 ![](/static/placeholder-a.svg) One.}}
{{ figure pos-2 ![](/static/placeholder-d.svg) Two.}}
</div>

### Primary left, right and top

One dominant image with a companion. Three variants — `primary-left`, `primary-right`, `primary-top`.

<div class="arrangement primary-left">
{{ figure pos-1 ![](/static/placeholder-16x9.svg) The primary image.}}
{{ figure pos-2 ![](/static/placeholder-tall.svg) Its companion.}}
</div>

<div class="arrangement primary-right">
{{ figure pos-1 ![](/static/placeholder-16x9.svg) The primary image, on the right.}}
{{ figure pos-2 ![](/static/placeholder-tall.svg) Its companion.}}
</div>

### Organic

Four images in a loose scatter. Two variants, `organic-a` and `organic-b`, plus `mixed-organic`, which runs A then B for a longer sequence of eight.

<div class="arrangement organic-a">
{{ figure pos-1 ![](/static/placeholder-a.svg) One.}}
{{ figure pos-2 ![](/static/placeholder-tall.svg) Two.}}
{{ figure pos-3 ![](/static/placeholder-c.svg) Three.}}
{{ figure pos-4 ![](/static/placeholder-d.svg) Four.}}
</div>

### Narrative

An image beside a block of text, rather than beside another image. `narrative-left` puts the image on the left, `narrative-right` on the right.

<div class="arrangement narrative-right">
<div class="pos-1">

Narrative arrangements are for the point in a page where the argument needs a picture next to it rather than under it. The text block is an ordinary `<div class="pos-1">` — anything can take a slot, not just a figure.

Keep the text short enough that the image doesn't end up marooned above a wall of prose. If it's getting long, you probably want a floated figure instead.

</div>
{{ figure pos-2 ![](/static/placeholder-tall.svg) The accompanying image.}}
</div>

### Orientation

`vertical`, `square` and `horizontal` cap an image's width by its shape, so a tall photograph doesn't tower over a wide one placed beside it. Different job from the `ratio-` classes: those crop, these restrain. They work in any of the three containers.

The portrait image below carries `vertical`, so it sits at two-thirds of its slot and centres, instead of filling the column and dwarfing its neighbour.

<div class="arrangement diagonal">
{{ figure pos-1 vertical ![](/static/placeholder-tall.svg) `vertical` — capped at 66%.}}
{{ figure pos-2 horizontal ![](/static/placeholder-b.svg) `horizontal` — fills its slot.}}
</div>

| Class | Use case |
| --- | --- |
| `arrangement` | On the container. Reclaims the marginalia band, so don't put an aside next to one. |
| `staggered`, `diagonal` | Compositions for three and two images. For a sequence where the order matters and you want the eye to travel — a process, a series of states. |
| `primary-left`, `primary-right`, `primary-top` | One dominant image with a companion. Reach for these when one image is the point and the other is supporting evidence. |
| `organic-a`, `organic-b`, `mixed-organic` | A loose scatter of four, or eight for `mixed-organic`. For a set with no argument in it — process shots, a mood board. Deliberately irregular, so don't use it where a reader is meant to compare. |
| `narrative-left`, `narrative-right` | An image beside a block of text rather than beside another image. Keep the text short; if it's growing past a couple of paragraphs you want a floated figure instead. |
| `pos-num` | Which slot a child takes, 1 to 8. Anything can take a slot, not just a figure. Slots a composition doesn't name fall into normal flow, so an extra unlabelled child won't break the layout. |
| `vertical`, `square`, `horizontal` | Caps a figure's width by its shape, so a portrait photograph doesn't tower over a landscape one beside it. Different job from `ratio-WxH`: those crop, these restrain. |
| `primary`, `secondary`, `tertiary` | Stacking order, for the compositions whose slots overlap. Only needed when one image is being clipped by its neighbour and you want the other one on top. |

## Gallery and masonry

Two containers for sets with no particular composition. `gallery` is an even grid that reflows by available width — use it when the images are peers and only the order matters.

<div class="gallery">
{{ figure ![](/static/placeholder-a.svg) One.}}
{{ figure ![](/static/placeholder-b.svg) Two.}}
{{ figure ![](/static/placeholder-c.svg) Three.}}
{{ figure ![](/static/placeholder-d.svg) Four.}}
</div>

`masonry` uses CSS columns instead, for sets of mixed heights that shouldn't be cropped to match each other.

<div class="masonry">
{{ figure ![](/static/placeholder-tall.svg) A tall one.}}
{{ figure ![](/static/placeholder-a.svg) A wide one.}}
{{ figure ![](/static/placeholder-1x1.svg) A square one.}}
{{ figure ![](/static/placeholder-b.svg) Another wide one.}}
{{ figure ![](/static/placeholder-2x3.svg) Another tall one.}}
{{ figure ![](/static/placeholder-c.svg) One more.}}
</div>

### Emphasis

`primary`, `secondary` and `tertiary` mark which figure dominates. What that means depends on the container, because the two place their children differently.

In an arrangement the slots are explicit, so `pos-1` is already the dominant one — what these classes add there is stacking order, for compositions whose grid areas overlap. In a gallery there are no slots, so `primary` is what makes one item take the room of two:

<div class="gallery">
{{ figure primary ![](/static/placeholder-a.svg) `primary` — spans two columns.}}
{{ figure ![](/static/placeholder-b.svg) An ordinary item.}}
{{ figure ![](/static/placeholder-c.svg) Another.}}
</div>

| Class | Use case |
| --- | --- |
| `gallery` | An even grid that reflows by available width. Use it when the images are peers and only their order matters — the case an arrangement would over-design. |
| `masonry` | Columns rather than a grid, so items of different heights pack without being cropped. Use it when the shapes vary and cropping them to match would lose something. Note that it fills column by column, so reading order goes down, not across. |
| `primary` | On one item in a gallery, to give it the room of two. For the one image that carries the set — a cover shot. In an arrangement this class means stacking order instead, because the slots are already explicit there. |

## Callouts

Two, from the `{{ info: }}` and `{{ caution: }}` macros.

{{ info: Frontmatter is optional. An HTML file without any is copied through untouched — no template, no macros, not even the clean-URL rewrite. }}

{{ caution: `./site build` exits 0 even when the build is broken. A clean build means zero warnings printed, not a zero exit code. }}

| Class | Use case |
| --- | --- |
| `info` | Something worth knowing but not worth interrupting the sentence for. Emitted by `{{ info: … }}`. |
| `caution` | Something that will bite you — a step that fails silently, an option that's hard to undo. Emitted by `{{ caution: … }}`. Use it sparingly, or it stops meaning anything. |

Unlike an aside, a callout sits in the flow of the text rather than in the gutter, so it interrupts. That's the whole difference, and it's how you choose between them: an aside is for what a reader can skip, a callout is for what they can't.

## Responsive behaviour

Below 46rem there is no gutter to work with, so the vocabulary collapses rather than shrinking:

- Asides and figure captions return to normal flow beneath the thing they annotate, and `move-up` stops applying.
- Tiles, floats and `wide` all fall back to full-width block flow.
- Arrangements and galleries become a single column, in source order — which is why `pos-num` should follow the order you'd want them read.

Nothing here needs a separate mobile class. If a layout looks wrong narrow, check it against this list before adding one.
