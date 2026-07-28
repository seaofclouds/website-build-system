---
title: The reading layout
description: A measure to read at, a gutter beside it, and notes that line up with the sentence they annotate.
date: 2026-07-27
template: essay
---

The oldest part of Theseus is the shape of a page you read. It comes from the
[Ink & Switch](https://www.inkandswitch.com) essays, and it's built on one idea: the text
column is held to a comfortable measure, and the space beside it is reserved rather than
filled.

{{ figure caption-below border ![](measure-and-gutter.svg)
Nothing flows into the gutter. Asides and captions are lifted out of the flow and
positioned into it, level with the paragraph they annotate.
}}

{{ aside Positioned rather than laid out in a column, which is what lets this note sit
beside an arbitrary *line* of the paragraph. Narrow the window and it drops below the
text instead — same markup, different shape around it. }}

That reservation is what makes marginalia possible. Because an aside is positioned into
the gutter instead of occupying a grid cell, it can sit level with any *line* of a
paragraph rather than starting its own row — which is the difference between a note beside
the sentence it's about and a note somewhere further down the page. `{{ aside 2 … }}`
nudges it up by two body lines when you want a particular one.

## Everything lands on the same twelve columns

The page is 72rem: two 1rem margins and 70rem of grid, which is twelve 4rem columns with
eleven 2rem gaps. Every region is a whole number of those columns, so the masthead, the
navigation, the body and the marginalia all hang off one set of vertical lines.

The band that holds the marginalia is three columns. Mirror it to the left and it's the
documentation sidebar — one `--band` token for both, so the two can't drift apart. This
page is body 1–8, a space column, then marginalia in 10–12. A docs page keeps the band in
the same place and spends three more columns on the sidebar, which leaves no room for a
space column, so its body is six columns rather than eight. `./site --fluid` paints the
guides over any page if you want to check what lines up.

## Figures break out by name

Inside the measure a figure behaves; outside it, you name how far it goes. `wide` takes
the gutter as well. `tile-2` through `tile-4` set images in a row. `float-left` and
`float-right` let text run alongside. The [styleguide](/docs/styleguide/) demonstrates
each one, and it's the page to keep open when you're adding to the vocabulary.

Alongside these live the seaofclouds arrangements — twelve-column compositions like
`staggered` and `organic`, for pages that are mostly images. Two design languages on one
stylesheet: bare `figure` and `figcaption` carry only what both agree on, and every
arrangement rule is scoped to its own container, so each stays intact and neither reaches
the other's elements.

## It collapses on purpose

The vocabulary has one responsive behaviour, and it's the same for every class in it: when
a layout can no longer afford the band, it gives it up. Asides and captions return to
normal flow beneath the thing they annotate, taking an indent and a rule so they still
read as asides. Tiles, floats and arrangements fall back to full-width block flow, in
source order. On a phone, all twelve columns are body.

One vocabulary, one set of rules, and nothing that needs a separate mobile class.
