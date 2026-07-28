# Plan: the docs pass

Scratch note, untracked.

All four items landed in `7549eeb` and `f28f0df`. What's below is what's left over.

---

## Done

1. **Grid deduped out of Stylesheets.** `/docs/styles/` keeps the architecture — which
   file holds what, and the "it isn't `display: grid`" warning — and links across to
   `/docs/styleguide/#grid` for the numbers.
2. **Assets split.** Placement and image-committing advice folded into Content, right
   after Clean URLs. Font subsetting became `/docs/fonts/`. `/docs/assets/` is gone; the
   two references in CSS comments were repointed by hand, since `validation.ts` can't
   see those.
3. **Page types**, one paragraph in Content: there's one kind of page, and an album is a
   template plus some classes.
4. **Class tables**, one per section of the styleguide. The flat list at the end is gone;
   the sidebar row that pointed at it now points at a new "Responsive behaviour" section.

## Still open

- **`validation.ts` checks `href` but not `src`.** A broken image path builds clean. This
  bit once already and is the one real gap in "a silent build means the content graph is
  correct". Small fix — the same walk, one more attribute.
- **A stale example in `macros.ts`.** The figure macro's comment block shows
  `{{figure wide frame ![](src.ext)}}`, but there is no `frame` class anywhere in
  `content.css`. Either name a real class or drop the word.
- **Eyeball the new tables in a real browser.** They sit at the measure — 34rem on a docs
  page — which auto table layout should handle, but the arrangement table has the longest
  left column (`primary-left, primary-right, primary-top`) and is the one to check.

## Not doing, decided

- No redirects for renamed docs URLs. This is v0; nobody has the old links.
- No per-section measure changes (the 3·1·4·1·3 idea). A measure that changes inside one
  page reads as a rendering bug; ARIA avoids it by reserving the marginalia column on
  *every* section whether or not a note occupies it.
- `pre` stays at the measure, and so do the new tables. Making them reclaim the
  marginalia band would put them underneath any aside at the same height — absolute
  positioning overlaps, it doesn't push.

## Verification

- **`./site build` exits 0 even when broken.** Clean means zero warnings printed.
- Token audit — anything printed here that isn't declared in `variables.css` is a typo:
  `grep -ohr 'var[(]--[a-z0-9-]*' content/static | sed 's/var(//' | sort -u`
- Don't review layout in a Playwright-driven browser. Its viewport is emulated and doesn't
  track the window, which shows up as a page that won't scroll to the bottom or a dead
  strip beneath it — and screenshots render the emulated viewport, so it looks fine from
  this side. Open `localhost:3000` in a real browser.
