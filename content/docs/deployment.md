---
title: Deployment
description: What you need to build the site, and how to host it on GitHub Pages, Cloudflare, or Netlify.
template: docs
---

`./site build` writes a folder of static files to `public/`. No server, no runtime, no
database — so any static host will serve it.

Note that this command excludes drafts by default, which is the opposite of every other
command. Pass `--draft` if you want them.

## What you need

**To build:** Node 24 or newer, or bun, or deno. Node 24 is the baseline because the
build runs TypeScript directly, with no compile step — earlier versions need a flag for
that, or a transpiler.

**To host:** anything that serves files. There's nothing to run.

**Optional:** `hb-subset` and `woff2_compress` if you use
[font subsetting](/docs/assets/). Without them the build logs a warning and falls back to
system fonts.

The build command is the same everywhere:

```bash
npm ci && node --disable-warning=ExperimentalWarning system/app.ts build
```

and the output directory is always `public`.

{{info: That's `system/app.ts` rather than `./site` — the shell script picks a runtime
for you, which is handy locally and unnecessary on a build server where you've already
pinned one.}}

## GitHub Pages

The starter ships a workflow at `.github/workflows/main.yml` that builds and deploys on
every push to `main`. In the repo settings, enable Pages and set the source to
**GitHub Actions**.

For a custom domain, put a file called `CNAME` in `content/` containing just the domain,
and point your DNS at GitHub Pages.

## Cloudflare Pages

Connect the repo, then:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm ci && node --disable-warning=ExperimentalWarning system/app.ts build` |
| Build output directory | `public` |

Add an environment variable `NODE_VERSION` set to `24`, or the build will run on whatever
Cloudflare defaults to and the TypeScript won't execute.

## Netlify

Connect the repo, then:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && node --disable-warning=ExperimentalWarning system/app.ts build` |
| Publish directory | `public` |

Set `NODE_VERSION` to `24`, either as an environment variable or by committing a `.nvmrc`
containing `24`. Or commit a `netlify.toml`:

```toml
[build]
  command = "npm ci && node --disable-warning=ExperimentalWarning system/app.ts build"
  publish = "public"

[build.environment]
  NODE_VERSION = "24"
```

## Anywhere else

Vercel, S3, Render, a VPS running nginx — same two facts. Run the build command, serve
`public`.

The build writes `about/index.html` rather than `about.html`, so `/about/` works on any
server that serves directory indexes, which is nearly all of them. If yours doesn't,
either configure it to or set `clean: false` on your pages and link to the `.html` paths.

## Real redirects

[Redirects](/docs/links/) are client-side by default — a small HTML page with a meta
refresh — because that works on every host without configuration.

Netlify and Cloudflare Pages both read a `_redirects` file from the root of the published
folder, which gets you real 301s instead. Put it at `content/_redirects` and it'll be
copied through:

```
/old/busted   /new/hotness   301
```

The same goes for `_headers` on both hosts. Both filenames are extensionless, so they're
named explicitly in the asset glob in `compile-everything.ts` — if your host wants a
different extensionless file, add it there.

## Fonts in CI

If you use [font subsetting](/docs/assets/), the build machine needs `hb-subset` and
`woff2_compress` on its PATH. Without them, the build skips regeneration and pages fall
back to system fonts.

The package names vary by distro. On Debian and Ubuntu, which is what the shipped
GitHub Actions workflow targets:

```yml
- run: sudo apt-get install -y libharfbuzz-bin woff2
```

On a host where you can't install binaries, commit the generated
`content/static/fonts/` folder instead and remove it from `.gitignore`. The subsets are
then built once locally and used everywhere.

{{caution: Check the build log for `Regenerating Fonts` the first time. A missing binary
is a warning, not an error, so a font that never got subsetted looks exactly like a
successful deploy.}}

## A note on what you're deploying

The build system is in the repo you just deployed. There's no version of it pinned
elsewhere that could drift, and no upstream that could change under you. What builds the
site today builds it identically in five years, because it's sitting right there.

The flip side: you won't get upstream fixes automatically. If you want an improvement
someone else made, you read their diff and apply what you want. For a few thousand lines
of code you own, that's a fair trade.
