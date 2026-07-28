---
title: hb-subset replaces its defaults, it doesn't extend them
description: Passing --layout-features=kern silently dropped ligatures, small caps and every stylistic set.
date: 2026-07-27
template: blog
---

The subsetting call used to be:

```
hb-subset font.ttf --text-file=chars.txt --layout-features=kern -o out.ttf
```

`--layout-features` **replaces** hb-subset's default set of retained features rather than
adding to it. So naming `kern` kept kerning and discarded everything else: ligatures,
contextual alternates, fractions, tabular and oldstyle figures, small caps, localised
forms, every stylistic set.

Measured on Overpass, subset to the ~120 characters this site uses:

| `--layout-features` | woff2 |
| --- | --- |
| *omitted (hb-subset defaults)* | 41.5 kB |
| `kern` | 35.2 kB |
| `*` | 53.2 kB |

`*` isn't free — it retains features whose substitution rules reference glyphs the
character set doesn't, which pulls those glyphs in. A curated
`kern,liga,calt,ccmp,locl,frac,tnum` came to 41.8 kB, within rounding of the default.

The flag is omitted now, and both knobs are named constants at the top of
`system/font.ts` with these numbers beside them.

The lesson generalises past the one flag: a subsetter's defaults are a considered set, and
narrowing them buys bytes at a price that fails silently. The text still renders. It just
renders without the ligatures you picked the typeface for.
