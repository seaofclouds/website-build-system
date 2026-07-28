# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A small, hackable static site build system written in TypeScript, run directly (no compile step, no bundler) by bun/deno/node. It is called **Theseus**, after the governing constraint below — the name lives in `Env.title` (`system/env.ts`), the README heading, and `package.json`. The git repo and `Env.repo` are still named `website-build-system`.

It grew up inside the [Ink & Switch](https://www.inkandswitch.com) website and then [automerge.org](https://automerge.org), written throughout by Ivy Reese; this repo is taken from the Automerge version. **It is being transformed into a starter build system** — the html5-boilerplate / normalize.css of website build systems — intended for adoption by seaofclouds-website, inkandswitch.com, and other sites. When you find Automerge-specific content, that is legacy to be generalized, not a pattern to follow.

### The governing constraint

From Ivy, the original author:

> i really don't want the build system to be a dependency
> it was designed and built around the idea of being part of the website that it's building. it should be a ship of theseus.

You adopt this system by **copying it into your repo and editing it**. The `system/` folder is yours the moment you clone it. Adopters are expected to delete what they don't need and rewrite what they do. Every design decision defers to this.

### The dependency test

Before adding anything to `system/`, check it does not create a package boundary:

- No `bin` entry in `package.json`, no npm publish config, no version number in `system/`.
- **No `site.config.js`.** Configuration lives as plain editable constants in `system/env.ts`. A config file that `system/` reads defines a schema contract, and a schema contract is step one toward being a dependency. Adopters edit `env.ts` directly.
- No plugin/hook API. Site-specific behaviour is added by editing `macros.ts` directly.

The seams an adopter is expected to edit: the config block in `system/env.ts`, the site-specific macro section in `system/macros.ts`, everything in `template/`, and the `site` shell script at the repo root.

## Commands

```sh
./site              # = ./site dev — build, watch, and serve with live reload at localhost:3000
./site build        # build once to public/; drafts EXCLUDED by default (--draft to include)
./site watch        # rebuild on change, no server
./site serve        # serve the last build without rebuilding
./site help         # list all commands
```

Flags: `--draft` / `--no-draft`, `--no-fonts` (skip font subsetting), `--verbose`.

Note the inverted draft default: `build` excludes drafts unless `--draft`; every other command includes them unless `--no-draft`.

`site` is a shell script that runs `system/app.ts` with bun, else deno, else node. It must be run from the repo root — `isSafeInvocation()` in `io.ts` enforces this, because all path handling is relative.

There is no test suite and no linter. Prettier config exists but is not run automatically. `npx tsc --noEmit` typechecks (`tsconfig.json` sets `noEmit`), and CI runs it as `npm run check` before the build — it is the one check that can actually fail the pipeline.

## Verifying your work

**`./site build` exits 0 even when the build is broken.** Nearly every problem — broken links, missing frontmatter, unknown templates, missing includes, macro failures — is reported through `log()` in the terminal and does not affect the exit code. Some failures also inject a red `{{macro}}` into the rendered HTML rather than failing the build.

So: **run `./site build` and read the terminal output.** A clean build means zero warnings printed, not exit 0. Because `validation.ts` checks every internal link, anchor and asset path against the generated `public/` tree, a genuinely silent build is strong evidence the content graph is correct.

Don't run `./site build` while `./site` (dev) is watching — both wipe and rewrite `public/`, and the race surfaces as `EEXIST: file already exists, open 'public/index.xml'`. Stop the dev server, or read its output instead of starting a second build.

## Architecture

The pipeline is a single synchronous pass, orchestrated top-to-bottom in `system/compile-everything.ts` — read that file first; it is the map to everything else.

```
content/*.{md,html} ──┐
template/*.html ──────┼──► compile-everything.ts ──► public/
Redirects.txt ────────┘
```

1. **Wipe** `public/`. Every build is from scratch.
2. **Load templates** from `template/*.html` — each may have its own frontmatter (e.g. `header_anchors: true`).
3. **Load pages** from `content/**/*.{md,html}`. HTML files with *no* frontmatter are copied through untouched — no clean-URL rewrite, no macros. This is the deliberate "content/ feels like an FTP server" escape hatch.
4. **Redirects** — `redirects.ts` parses `Redirects.txt` and synthesizes redirect pages (or hardlinks static assets, since there is no server to issue a 301).
5. **Per page**: extract + validate frontmatter, compute `dest` (`content/`→`public/`, `.md`→`.html`, and the clean-URL rewrite `name.html`→`name/index.html` unless `clean: false`), build a `URL`, resolve the template.
6. **Filter** by `publish` (`true` | `draft` | `false`).
7. **`buildTree()`** assigns each page a `parent`/`children` purely from URL path nesting. This powers `{{index:…}}`, blog next/prev, and docs navigation.
8. **`compilePage()`** (`compile-page.ts`) — markdown → cleanup → header anchors → macro expansion for the body; then the body is injected into the template and macros expand again over the whole page.
9. **Generate** RSS, llms.txt, sitemap, robots.
10. **Write** pages, subset fonts, hardlink all non-page assets, then run validity checks.

### Macros

`system/macros.ts` is the main extension point. `{{ name }}` syntax, expanded in a loop (max 100 passes) so macros can produce macros. Resolution order is a `switch` with fallthrough to frontmatter: an unrecognized macro `{{foo}}` returns `frontmatter.foo`; `{{foo?}}` returns it or empty string; an unmatched required macro logs an error and injects red text into the page.

Braces are matched by **counting**, in `findMacroEnd`, not by regex. Macros nest — a figure caption can hold an aside, a comment can quote a macro while explaining it — and a lazy `/{{(.+?)}}/` ends the outer match at the inner macro's closing braces, silently swallowing half of one and leaking the other half into the page. Counting means the outermost macro resolves first, and the inner one expands on the next pass of the loop. Don't reintroduce a regex here.

`{{content}}` marks template insertion. `{{include:name}}` inlines `template/includes/name.md` if it exists, else `name.html` — name it without the extension, because the build appends one. `{{index:name}}` renders each child page through an include — note the trick it uses: it recursively calls `expandMacros` with the *child* page as context.

Macros like `blog-sidebar`, `prev-in-docs`, `next-in-docs`, `newer-in-blog`, `older-in-blog`, `figure`, `aside`, `info`, and `caution` are **site-specific examples**, not framework features. Keep them in a clearly marked section; adopters adapt or delete them.

### Stylesheets

Four files in `content/static/`, loaded in this order by `template/includes/head-stuff.html`; later files win ties.

- `variables.css` — every custom property on the site, declared in one place and nowhere else. This is not tidiness: an undefined custom property fails *silently* (the declaration is dropped at computed-value time), so a single declared list is the only thing you can diff "what exists" against "what's used". Adding a `--token` anywhere else defeats the point.
- `base.css` — the reset and element defaults. Nothing here may know about layout or about the figure vocabulary. If a rule would stop making sense on a page with no `<main>`, it belongs elsewhere.
- `layout.css` — the page shell, plus every page shape as a `layout-*` class on `<body>`: `layout-plain`, `layout-wide`, `layout-nav`, `layout-margin`. Add a shape by adding a class, not a stylesheet.
- `content.css` — everything inside the content area: prose, marginalia, figures, arrangements, callouts, code.

Two imported vocabularies live in `content.css` and **must not be merged**: the Ink & Switch reading layout (measure + gutter, `wide`/`tile-N`/`float-*`) and the seaofclouds arrangements (twelve-column compositions). They disagree on bare `figure` and `figcaption`, so those carry only the shared baseline and every arrangement rule is scoped to `.arrangement` / `.gallery` / `.masonry`. Naming rule: **modes are words, numeric modifiers are bare integers** — `wide` and `staggered`, but `tile-3` and `pos-2`.

Three constraints worth knowing before editing:

- **Bare `<aside>` is marginalia**, not the nav sidebar (that's `nav.site-nav`). These collided when both used the element, and the collision is silent.
- **`46rem` is a literal in every media query that needs it** — currently sixteen of them; recount with `grep -h '@media.*46rem' content/static/*.css | wc -l` rather than trusting this number. It has to be a literal, because a media query can't read a custom property. It *can* assign one, which is how `--content-gutter` collapses without duplicating the geometry.
- **The two gutter layouts collapse at different widths, and it's deliberate.** `layout-margin` spends four columns on the right and none on the left, so it holds until 46rem. `layout-nav` spends three on each side — half the grid — and only fits while all 72rem of the grid does, so it closes below `72em`. Each width appears twice: once in `layout.css` where the gutter closes, once in `content.css` where marginalia stops being lifted into it. Change one without the other and asides get absolutely positioned into a band that isn't there, on top of the body text. Below 800px the nav stacks and `--measure` becomes `100%` — all twelve columns are body.
- **Everything sits on one twelve-column grid**, declared in `variables.css`: page 72rem = 2×1rem padding + 70rem of grid; 70rem = 12 columns × 4rem + 11 gaps × 2rem. `--band` is 3 columns (16rem), and it's one token on purpose — the nav and the marginalia are the same three columns, and naming them separately would let them drift. The essay is `body 1-8 · space 9 · marginalia 10-12`, so `--measure` is 8 columns (46rem). Docs/blog is **not** the mirror of that: it's `nav 1-3 · body 4-9 · marginalia 10-12` with no space column, because four regions don't fit twelve columns with a gap between each, so `.layout-nav main` overrides `--measure` down to 6 columns (34rem) and spends the spare column on the body. Three columns each side, not four. `--rail` (column 1) is declared but unused: the body absorbs it until something needs section marks.
- **`layout-nav` and `layout-margin` don't compose** — one spends columns 1-3, the other 10-12, and a page with both leaves nowhere for the body. Left undefined rather than shipped broken.

`content/docs/styleguide.md` exercises the whole vocabulary and is the regression test — check it after any change to `content.css`. Every section that covers classes ends with a table of them, so a new class needs a row there as well as a demo. (Grid and Text have no table because they describe no classes.) `./site --fluid` / `--fixed` paint the column guides.

### Where the system knows about this site's shape

These paths are coupled to particular content. All of them degrade — a missing piece logs or returns empty rather than throwing — so deleting a section is safe, and the build tells you what it couldn't find:

- `macros.ts` `most-recent-blog-post` logs and returns `#` when nothing lives under `/blog/`. It's keyed on the section rather than on `template: blog`, so a post keeps counting as a post when it moves onto another template. `template/includes/nav.html` calls it on every page, so that log is what you'll see if you delete the blog.
- `macros.ts` `blog-sidebar` reads `page.parent?.children ?? []`, so a post with no `/blog/` index above it renders an empty sidebar.
- `llms.ts` returns early unless `Env.docsIndex` names an include, which is the switch for turning `llms.txt` off.
- `redirects.ts` returns early unless `Redirects.txt` exists (a comments-only file is also fine).
- `compile-everything.ts` names `content/CNAME`, `content/_redirects` and `content/_headers` in its asset glob, because extensionless files can't be matched by extension. Add yours there if your host wants one.

Check this list against the code before relying on it — an earlier version of this file described all five as throwing, long after they'd been made to degrade.

### Fonts

`system/font.ts` implements automatic subsetting: it collects every unique character across the whole built site, and if that set changed since last build, regenerates `content/static/fonts/` from the `.ttf`/`.otf` sources in `/fonts` using `hb-subset` + `woff2_compress` (`brew install harfbuzz woff2`).

Two consequences: the generated `content/static/fonts/` folder is build output and is gitignored — never hand-edit it, and if your host can't install the binaries, the fix is to commit it and drop the `.gitignore` line, as `deployment.md` describes; and to force regeneration you delete `content/static/fonts/chars.txt`. If the binaries are missing the build logs one warning and carries on with stale fonts.

### Style conventions

The code is written to be read and edited by the person who owns the website. Match it: heavy explanatory comments, a file-header comment saying what each file is for, small pure helpers in `util.ts` (which must know nothing about any particular website), and all I/O funnelled through `io.ts` so dependencies stay replaceable. Prettier is configured with no semicolons, double quotes, 150 columns.

CSS, HTML, and Markdown are in `.prettierignore` — they are formatted by hand and must stay that way. Every stylesheet in `content/static/` opens by saying so explicitly. Respect that.

## Licensing and attribution

`LICENSE` is MIT, `Copyright (c) 2019-2025 the Automerge contributors`. This repo is a derivative, so MIT **requires** that notice be retained — preserve the Automerge copyright line and add new ones alongside it rather than replacing it. Credit **Ivy Reese** as the original author — always by that name, and never by any other name. Link to `https://ivy.boo` or `https://github.com/ivyreese`; those are the only handles to use, in prose or inside a URL. The live-reload server in `system/server.ts` similarly credits its origin (`github.com/ivyreese/please-reload`); follow that precedent.
