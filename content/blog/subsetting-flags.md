---
title: Font subsetting — dropped --layout-features=kern
description: The flag replaced hb-subset's defaults instead of extending them, silently removing ligatures.
date: 2026-07-27
template: blog
---

The subsetting call was:

```
hb-subset font.ttf --text-file=chars.txt --layout-features=kern -o out.ttf
```

`--layout-features` **replaces** hb-subset's default set of retained features rather than
adding to it. So `kern` alone was discarding ligatures, contextual alternates, fractions,
tabular and oldstyle figures, small caps, localised forms, and every stylistic set.

Measured on Overpass, subset to the ~120 characters this site uses:

| `--layout-features` | woff2 |
| --- | --- |
| *omitted (hb-subset defaults)* | 41.5 kB |
| `kern` | 35.2 kB |
| `*` | 53.2 kB |

`*` isn't free — it retains features whose substitution rules reference glyphs the
character set doesn't, pulling those glyphs in. A curated
`kern,liga,calt,ccmp,locl,frac,tnum` came to 41.8 kB, within rounding of the default.

The flag is now omitted. Both knobs are named constants at the top of `system/font.ts`
with the numbers in the comments.

Also confirmed while in there: variable fonts already worked and kept their axes — both
Overpass files carry `fvar`/`gvar`/`STAT`, and the output was already loading as
`woff2-variations` across `font-weight: 100 900`. OTF works too; CFF and CFF2 outlines
subset fine. Pinning a fixed instance is one line.

`/fonts` now ships empty and the site uses the system stack. `font.ts` returns quietly
when there are no fonts, so the feature costs nothing until you drop a file in.
