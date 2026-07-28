---
title: Assets & Fonts
description: Where images and stylesheets live, and how automatic font subsetting works.
template: docs
---

Anything in `content/` that isn't a page is copied to the built site at the same path.
An image at `content/about/portrait.jpg` is served at `/about/portrait.jpg`.

They're hardlinked rather than copied, which is why builds stay fast even when the repo
is full of images.

This means assets can sit next to the page that uses them, instead of in one big pile:

```
content/about/
  index.md
  portrait.jpg
  about.css
```

Then reference them relatively from the page, or add `styles: /about/about.css` to its
frontmatter.

## Committing images

Git is fine at versioning text and bad at versioning binaries — they bloat clones and
never diff usefully. Before committing an image:

**Resize it.** An image displayed at 600px wide needs to be about 1200px, not 4000px. A
little extra detail is enough to read as crisp on a retina screen.

**Pick the right format.** Line art and screenshots: PNG or WebP. Photographs: WebP or
JPG. Anything that could be vector: SVG.

**Compress it.** [ImageOptim](https://imageoptim.com) or [Squoosh](https://squoosh.app)
will typically halve a file with no visible loss. Aim for 100–300 kB for large photos,
10–100 kB for screenshots.

## Fonts

The starter ships no webfonts. It uses the system font stack, which costs your visitors
nothing and looks native on every platform.

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

### What's supported

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

### Requirements

Subsetting needs two binaries that don't come from npm:

```bash
brew install harfbuzz woff2
```

{{info: If they're missing, the build still runs. It logs one warning, skips
regeneration, and your text falls back to the next font in the stack.}}

### Things that will catch you out

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
