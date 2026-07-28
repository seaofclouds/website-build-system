# Fonts

This folder is empty on purpose. The starter uses the system font stack, so it ships
no webfonts and costs your visitors no font downloads.

When you want your own typeface, drop the source files in here.

## How it works

Put a `.ttf` or `.otf` file in this folder and the next build will:

1. Scan every page of the built site and collect every character you actually use.
2. Subset the font down to just those glyphs.
3. Compress the result to `woff2` and write it to `content/static/fonts/`.

Then point your CSS at the result — write an `@font-face` in `content/static/base.css`,
in the TYPOGRAPHIC HIERARCHY section where the comment says so, and set `--font-sans` or
`--font-mono` to the new family in `content/static/variables.css`.

Static fonts, variable fonts, TrueType outlines and CFF outlines all work. Variable
fonts keep their axes, so one file covers every weight — use
`format("woff2-variations")` and a `font-weight` range in your `@font-face`.

## Requirements

Subsetting needs two binaries that don't come from npm:

    brew install harfbuzz woff2

If they're missing the build still runs — it logs one warning, skips regeneration, and
your text falls back to the next font in the stack. Nothing breaks.

## Things worth knowing

**Regeneration is cached against the character set.** The build only re-subsets when the
set of characters on your site changes. To force it, delete
`content/static/fonts/chars.txt`.

**`content/static/fonts/` is build output.** It's regenerated from whatever is in here,
and it's gitignored. Never edit it by hand.

**Check the licence before committing a font.** Plenty of typefaces don't permit
redistribution in a public repo. If yours ships a licence file, put it in this folder —
non-font files are copied through to the output folder alongside the subsets.

**Feature retention is tunable.** `LAYOUT_FEATURES` in `system/font.ts` controls which
OpenType features survive subsetting. The default (hb-subset's own) keeps ligatures,
contextual alternates, kerning and localised forms. The comments there record what the
alternatives cost in bytes.
