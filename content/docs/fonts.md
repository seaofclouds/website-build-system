---
title: Fonts
description: How automatic font subsetting works, and what to know before shipping a typeface.
template: docs
---

Out of the box the site uses the system font stack: your visitors download nothing, and
the text looks native on whatever they're reading it on.

When you want your own typeface, drop a `.ttf` or `.otf` into `/fonts` and the next
build will:

1. Scan every page of the built site and collect every character you actually use.
2. Subset the font down to just those glyphs.
3. Compress the result to `woff2` in `content/static/fonts/`.

Then declare it with `@font-face` in `content/static/base.css`, and point `--font-sans`
or `--font-mono` at the new family in `content/static/variables.css` — there's a
commented `--font-serif` there for exactly this. See [Stylesheets](/docs/styles/) for
what else lives where.

This matters more than it sounds. A typical webfont carries thousands of glyphs for
alphabets and symbols your site never uses. Subsetting an English-language site
routinely cuts a font by 80–90%.

## What's supported

Static and variable fonts both work, as do TrueType and CFF outlines. Variable fonts
keep their axes, so a single file still covers every weight — declare it with
`format("woff2-variations")` and a `font-weight` range:

```css
@font-face {
  font-family: "Your Font";
  src: url("/static/fonts/yourfont.woff2") format("woff2-variations");
  font-weight: 100 900;
}
```

To ship a fixed weight instead, set `INSTANCE` in `system/font.ts` to something like
`wght=400` and drop the range.

## Requirements

Subsetting needs two binaries that don't come from npm:

```bash
brew install harfbuzz woff2
```

{{info: If they're missing, the build still runs. It logs one warning, skips
regeneration, and your text falls back to the next font in the stack.}}

## Things that will catch you out

**Regeneration is cached against the character set,** not the font file. The build only
re-subsets when the set of characters on your site changes — so if you swap in a new
font file without changing any text, nothing happens. Delete
`content/static/fonts/chars.txt` to force it.

**`content/static/fonts/` is build output.** It's gitignored and regenerated. Don't edit
it, and don't put source fonts there.

**Check the licence before committing a font.** Many typefaces don't permit
redistribution in a public repository. If yours ships a licence file, put it in `/fonts`
alongside the font — non-font files there are copied through to the output.

**Which OpenType features survive is tunable,** via `LAYOUT_FEATURES` in
`system/font.ts`. The default keeps ligatures, contextual alternates, kerning and
localised forms. Restricting it further saves bytes but silently drops those features,
which is a horrible bug to chase — the comments in that file record what each setting
costs.
