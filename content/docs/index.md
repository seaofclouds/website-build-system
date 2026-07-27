---
title: Getting Started
description: A small, hackable static site build system that lives inside the website it builds.
template: docs
---

This is a static site build system of about 1,800 lines of TypeScript. It turns Markdown
and HTML in `content/` into a finished website in `public/`.

It is not a framework and it is not a dependency. You copy it into your project, and from
that moment it's yours — you're expected to read it, change it, and delete the parts you
don't want. The original author put it this way:

> I really don't want the build system to be a dependency. It was designed and built
> around the idea of being part of the website that it's building. It should be a ship
> of Theseus.

That's the whole idea. Everything below follows from it.

## Install

Clone the repo, then:

```bash
npm install
```

Six packages do the work, all of them dev-only: `markdown-it` and `markdown-it-footnote`
for Markdown, `prismjs` for syntax highlighting, `chokidar` and `glob` for watching and
matching files, and `ws` for live reload. Nothing ships to your visitors.

The rest of `devDependencies` is TypeScript itself and the `@types/*` packages for the
six above — needed to typecheck, never imported at build time.

## Run

```bash
./site
```

That builds the site, watches for changes, and serves it at
[localhost:3000](http://localhost:3000) with live reload. It also serves on your local
network, so you can open the site on your phone.

```bash
./site build     # build once into public/
./site watch     # rebuild on change, no server
./site serve     # serve the last build
./site help      # every command
```

`site` is a three-line shell script that runs `system/app.ts` with whichever of bun,
deno, or node it finds first. There's no compile step and no bundler — the TypeScript
runs directly.

{{info: Run it from the repo root. Every path in the system is relative, and the CLI
refuses to run anywhere else rather than write files somewhere surprising.}}

## The folders

| Folder | What's in it |
| --- | --- |
| `content` | Your pages, and the assets that belong to them. The file path becomes the URL. |
| `template` | The page shells your content gets poured into, plus reusable snippets in `template/includes`. |
| `system` | The build system. Yours to edit. |
| `fonts` | Drop a `.ttf` or `.otf` here to turn on automatic subsetting. Empty by default. |
| `public` | The built site. Deleted and rebuilt every time. Never edit it. |

## Reading the output

One thing to know before you start, because it will save you an afternoon:

{{caution: `./site build` exits 0 even when the build is broken. Missing frontmatter,
broken links, unknown templates, failed macros — nearly everything is reported by
printing to the terminal, not by failing. A clean build means **no warnings printed**,
not a zero exit code.}}

The upside is that a build which prints nothing is a strong signal. The system checks
every internal link and anchor against the pages it just generated, so silence means the
whole content graph actually resolves.

## Making it yours

1. Open `system/env.ts` and set your domain, title, and description. That's the entire
   configuration surface — there's no config file, deliberately.
2. Replace the contents of `content/` with your own pages.
3. Edit the templates and CSS until the site looks like yours.
4. Delete the parts of `system/` you don't need. The blog macros, the docs navigation,
   `llms.txt` generation — all optional, all removable.

Step 4 is not a joke or a stretch goal. It's the intended use.
