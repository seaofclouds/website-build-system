---
title: What Font Subsetting Actually Costs
description: A flag that looked like an optimisation was silently deleting ligatures. Here are the numbers.
date: 2026-07-27
template: blog
---

The font subsetting is the least ordinary thing this build system does. It scans every
page of the finished site, collects every character you actually use, and emits a `woff2`
containing only those glyphs. On an English-language site that routinely removes 80–90%
of a typeface.

The Automerge site shipped [Overpass](https://overpassfont.org) through it. Pulling that
out for the starter meant looking closely at the pipeline, and one flag didn't survive
the inspection.

## The flag

```
hb-subset font.ttf --text-file=chars.txt --layout-features=kern -o out.ttf
```

`--layout-features` looks like it adds kerning. It doesn't — it **replaces** hb-subset's
default set of retained OpenType features with the list you give it. Passing `kern` alone
therefore discards ligatures, contextual alternates, fractions, tabular and oldstyle
figures, small caps, localised forms, and every stylistic set.

Invisible with Overpass at body size. Very visible the first time you set a typeface with
a `ss01` alternate you chose it for, or need `tnum` numerals to line up in a table. And
close to impossible to diagnose from the rendered page, because the font loads correctly
and simply lacks the features.

## The numbers

Measured on Overpass, subset to the ~120 characters this site uses:

| `--layout-features` | woff2 | vs. default |
| --- | --- | --- |
| *omitted (hb-subset defaults)* | 41.5 kB | — |
| `kern` | 35.2 kB | −15% |
| `*` (everything) | 53.2 kB | +28% |

I had assumed keeping everything would be free at this glyph count, and wrote a comment
saying so before measuring. It isn't: `*` retains features whose substitution rules point
at glyphs the character set never references, so those glyphs get pulled in too. That's
where the extra 12 kB comes from.

An explicitly curated list — `kern,liga,calt,ccmp,locl,frac,tnum` — landed at 41.8 kB,
within rounding of the default. Which is a good sign that hb-subset's default is the
considered choice it appears to be.

So the flag is now simply omitted, and the trade-offs are recorded as constants at the
top of `system/font.ts` rather than buried in a command string.

{{caution: If you tighten `LAYOUT_FEATURES` to save bytes, check the glyphs you tightened
away. A missing ligature doesn't error — it just quietly renders as two letters, forever.}}

## Variable fonts already worked

Worth stating plainly, since it's a reasonable thing to doubt: variable fonts survive
subsetting with their axes intact, and always did.

Both Overpass files carry `fvar`, `gvar` and `STAT` tables, and the site loaded the
subsetted output with `format("woff2-variations")` and `font-weight: 100 900`. So a
single subsetted file was already covering the full weight range. hb-subset preserves
variation axes unless you explicitly pin an instance.

OTF works too — the extension check has always accepted `.otf`, and CFF and CFF2 outlines
subset and compress fine.

Pinning is now a one-line change if you want a fixed weight and a smaller file:

```ts
const INSTANCE = "wght=400"
```

Remember to match your `@font-face` if you do — a pinned font shouldn't advertise a
weight range.

## Why the starter ships no fonts

The system font stack, and an empty `/fonts` folder.

A webfont is a real cost — bytes, a request, and a decision about swap behaviour — and a
starter shouldn't spend it on a typeface you're going to replace. It also shouldn't pick
your brand's typeface for you.

So the pipeline is present and inert. `font.ts` returns quietly when it finds no font
sources rather than warning about it, `base.css` uses `--font-sans` and `--font-mono`
pointing at system stacks, and the `@font-face` block sits directly above them, commented
out, next to instructions.

Turning it on is: drop a file in `/fonts`, uncomment four lines, change one variable.

{{info: Two binaries do the work, and neither comes from npm — `brew install harfbuzz
woff2`. Without them the build logs a single warning, skips regeneration, and falls back
to the next font in the stack. Nothing breaks, which is exactly why it's worth checking
your CI log for `Regenerating Fonts` the first time.}}
