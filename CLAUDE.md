# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A small, hackable static site build system written in TypeScript, run directly (no compile step, no bundler) by bun/deno/node.

It began as the build system for [automerge.org](https://automerge.org), originally written by Ivy (`ivanreese`). **It is being transformed into a starter build system** — the html5-boilerplate / normalize.css of website build systems — intended for adoption by seaofclouds-website, inkandswitch.com, and other sites. When you find Automerge-specific content, that is legacy to be generalized, not a pattern to follow.

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

There is no test suite, no linter, and no typecheck in CI. Prettier config exists but is not run automatically. `npx tsc --noEmit` typechecks (`tsconfig.json` sets `noEmit`).

## Verifying your work

**`./site build` exits 0 even when the build is broken.** Nearly every problem — broken links, missing frontmatter, unknown templates, missing includes, macro failures — is reported through `log()` in the terminal and does not affect the exit code. Some failures also inject a red `{{macro}}` into the rendered HTML rather than failing the build.

So: **run `./site build` and read the terminal output.** A clean build means zero warnings printed, not exit 0. Because `validation.ts` checks every internal link and anchor against the generated `public/` tree, a genuinely silent build is strong evidence the content graph is correct.

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

`{{content}}` marks template insertion. `{{include:name}}` inlines `template/includes/name.{html,md}`. `{{index:name}}` renders each child page through an include — note the trick it uses: it recursively calls `expandMacros` with the *child* page as context.

Macros like `blog-sidebar`, `prev-in-docs`, `next-in-docs`, `newer-in-blog`, `older-in-blog`, `figure`, `info`, and `caution` are **site-specific examples**, not framework features. Keep them in a clearly marked section; adopters adapt or delete them.

### Fragile spots when changing content

Several code paths assume the Automerge site's shape and will **throw or ENOENT**, not warn, if that content is removed:

- `macros.ts` `most-recent-blog-post` throws when no page has `template: blog` — and `template/includes/nav.html` calls it, so deleting the blog breaks every page.
- `macros.ts` `blog-sidebar` dereferences `page.parent!` — deleting `content/blog/index.md` breaks blog pages.
- `llms.ts` unconditionally reads `template/includes/docs.md` and `api.md`.
- `redirects.ts` unconditionally reads `Redirects.txt` (a comments-only file is fine).
- `compile-everything.ts` hardcodes `content/CNAME` in its asset glob.

### Fonts

`system/font.ts` implements automatic subsetting: it collects every unique character across the whole built site, and if that set changed since last build, regenerates `content/static/fonts/` from the `.ttf`/`.otf` sources in `/fonts` using `hb-subset` + `woff2_compress` (`brew install harfbuzz woff2`).

Two consequences: the generated `content/static/fonts/` folder is committed and is build output — never hand-edit it; and to force regeneration you delete `content/static/fonts/chars.txt`. If the binaries are missing the build logs one warning and carries on with stale fonts.

### Style conventions

The code is written to be read and edited by the person who owns the website. Match it: heavy explanatory comments, a file-header comment saying what each file is for, small pure helpers in `util.ts` (which must know nothing about any particular website), and all I/O funnelled through `io.ts` so dependencies stay replaceable. Prettier is configured with no semicolons, double quotes, 150 columns.

CSS, HTML, and Markdown are in `.prettierignore` — they are formatted by hand and must stay that way. `content/static/base.css` opens by saying so explicitly. Respect that.

## Licensing and attribution

`LICENSE` is MIT, `Copyright (c) 2019-2025 the Automerge contributors`. This repo is a derivative, so MIT **requires** that notice be retained — preserve the Automerge copyright line and add new ones alongside it rather than replacing it. Credit Ivy (`ivanreese`) as the original author. The live-reload server in `system/server.ts` similarly credits its origin (`github.com/ivanreese/please-reload`); follow that precedent.
