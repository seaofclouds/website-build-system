# Plan: the docs pass

Scratch note, untracked. Delete once the work lands.

The grid work landed in `1833649` — four stylesheets, twelve columns, the figure and
arrangement vocabulary, `/docs/styleguide/`. What's left is documentation shape, not CSS.

---

## 1. Dedupe the grid out of Stylesheets

The grid is explained in full in both `/docs/styles/` and `/docs/styleguide/#grid`. That's
the actual redundancy. Delete it from Stylesheets and link across.

The two pages otherwise answer different questions and should stay apart:

- **Stylesheets** — the architecture. Which file holds what, the token list, how to change
  the look. Tighten to roughly that.
- **Styleguide** — the vocabulary. What classes exist, demonstrated.

Also drop the "why four files" argument down to a sentence. It's a build-system page; it
should state the four files and what each is for.

## 2. Split Assets

`/docs/assets/` is two pages wearing one hat:

- *where non-page files live and get copied* → fold into **Content**
- *font subsetting* → its own **Fonts** page under STYLE

Which gives the STYLE group: Stylesheets · Fonts · Styleguide. Assets stops being a page.

## 3. Page types, in one paragraph

In **Content**, not as a section anywhere. The honest statement:

> This system has one content type — a file with frontmatter. An album, an essay, a
> gallery are a template plus some classes, not kinds of thing the build system knows
> about.

Then point at Templates. This is what keeps it a build system rather than a CMS, and it's
also the answer to the layout/page-type overlap below.

## 4. Improve the class vocabulary — the main piece

`/docs/styleguide/` currently ends with a flat bullet list of every class. Replace it with
per-section tables, in the shape Ink & Switch use:
<https://www.inkandswitch.com/article-style-guide/>

The pattern is a code example, then a two-column table:

| CSS Class | Use Case |
| --- | --- |
| `.move-up-num` | Apply this class to an `<aside>` to position it visually. Typically used to align an aside to its related text. Occasionally used to avoid overlapping asides. `num` is the number of lines to move. |

What makes it work, and what to copy:

- **A real code sample above the table**, showing the markup as you'd actually write it.
  Ours should show the macro form *and* the HTML it emits, since both are authorable.
- **The right column is a use case, not a definition.** "Typically used to…", "Use this
  sparingly" — when to reach for it and when not to. Ours currently say what the class
  does mechanically, which the demo already shows.
- **Placeholder tokens in the class name** (`num`), so one row covers a family instead of
  listing `tile-2`, `tile-3`, `tile-4` separately.
- One table per section — asides, figures, spacing, arrangements — rather than one big one
  at the end. The table belongs next to the thing it describes.

Keep our naming rule while doing it: modes are words, numeric modifiers are bare integers.

---

## Carried-over question

**Page types and layouts overlap, and that's by design.** An album is `layout-wide` plus
gallery classes; an essay is `layout-margin`. There's no content model, so the only thing
distinguishing kinds of page is which template wraps them and which classes they use.

Suggested split, which item 3 above assumes:

- **Content** — a file becomes a URL; `template:` is where a page declares what it is
- **Templates** — what each shipped template is, including the layout class it sets
- **Stylesheets** — what a layout class does to the grid

## Not doing, decided

- No redirects for renamed docs URLs. This is v0; nobody has the old links.
- No per-section measure changes (the 3·1·4·1·3 idea). A measure that changes inside one
  page reads as a rendering bug; ARIA avoids it by reserving the marginalia column on
  *every* section whether or not a note occupies it.
- `pre` stays at the measure. Making code blocks reclaim the marginalia band would put
  them underneath any aside at the same height — absolute positioning overlaps, it doesn't
  push.

## Verification

- **`./site build` exits 0 even when broken.** Clean means zero warnings printed.
- Token audit — anything printed here that isn't declared in `variables.css` is a typo:
  `grep -ohr 'var[(]--[a-z0-9-]*' content/static | sed 's/var(//' | sort -u`
- `validation.ts` checks `href` but **not** `src`, so a broken image path builds clean.
  Bitten by this once already. Worth fixing at some point.
- Don't review layout in a Playwright-driven browser. Its viewport is emulated and doesn't
  track the window, which shows up as a page that won't scroll to the bottom or a dead
  strip beneath it — and screenshots render the emulated viewport, so it looks fine from
  this side. Open `localhost:3000` in a real browser.
