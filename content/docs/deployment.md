---
title: Deployment
description: What you need to build the site, and how to host it on Cloudflare, Netlify, or anywhere that serves files.
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
[font subsetting](/docs/fonts/). Without them the build logs a warning and falls back to
system fonts.

The build command is the same everywhere:

```bash
npm ci && node --disable-warning=ExperimentalWarning system/app.ts build
```

and the output directory is always `public`.

{{info: That's `system/app.ts` rather than `./site` — the shell script picks a runtime
for you, which is handy locally and unnecessary on a build server where you've already
pinned one.}}

## Cloudflare Workers

This is what the starter ships configured for. `wrangler.jsonc` at the repo root says what
to deploy and under what name:

```json5
{
  "name": "theseus",
  "compatibility_date": "2026-07-27",
  "workers_dev": true,
  "assets": {
    "directory": "./public",
    "not_found_handling": "404-page"
  }
}
```

There's no `main` field, so no Worker script runs — this is an assets-only Worker, and
requests are served straight from the uploaded files.

**Push it yourself.** Two commands, no dashboard:

```bash
./site build
wrangler deploy
```

That serves the site at `<name>.<your-subdomain>.workers.dev`, at the root of the domain.

**Or let CI do it.** `.github/workflows/main.yml` runs the same build and deploy on every
push to `main`. It needs two repository secrets, under
**Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A token from the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID, which `wrangler whoami` prints |

{{caution: `not_found_handling` is the line to keep. Cloudflare Pages used to detect a
`404.html` and wire it up for you; Workers makes it explicit so a misconfiguration can't
pass silently. Leave it out and `content/404.html` still uploads — it just never gets
served, and a missing page returns an empty 404 instead.}}

{{info: Set `domain` in `system/env.ts` to the domain you end up on. It's only used where
a URL has to be absolute — the sitemap, the RSS feed, the Open Graph tags — so getting it
wrong doesn't break the site, it just publishes a feed pointing somewhere else.}}

### Coming from Pages

Cloudflare's own guidance now points new static projects at Workers rather than Pages, and
there's an official [migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/).
For a site like this one it's a small move: `wrangler deploy` instead of
`wrangler pages deploy`, and `assets.directory` in `wrangler.jsonc` instead of
`pages_build_output_dir`. The two behaviour differences worth knowing are the
`not_found_handling` above, and that you get a `workers.dev` subdomain rather than a
`pages.dev` one.

## GitHub Pages

Works, with one thing to know first: a **project** site is served from
`<user>.github.io/<repo>/`, and this build emits root-relative paths with no notion of a
base path. Every stylesheet and every internal link would 404 under that subdirectory.

So it needs a root: either a user site (a repo named `<user>.github.io`) or a custom
domain. For the custom domain, put a file called `CNAME` in `content/` containing just the
domain and point your DNS at GitHub Pages.

Then swap the deploy step in `.github/workflows/main.yml` for `actions/upload-pages-artifact`
and `actions/deploy-pages`, give the job `pages: write` and `id-token: write` permissions,
and set the Pages source to **GitHub Actions** in the repo settings.

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

Cloudflare Workers and Netlify both read a `_redirects` file from the root of the published
folder, which gets you real 301s instead. Put it at `content/_redirects` and it'll be
copied through:

```
/old/busted   /new/hotness   301
```

The same goes for `_headers` on both hosts. Both filenames are extensionless, so they're
named explicitly in the asset glob in `compile-everything.ts` — if your host wants a
different extensionless file, add it there.

## Fonts in CI

If you use [font subsetting](/docs/fonts/), the build machine needs `hb-subset` and
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

## Reproducible by construction

The build system is in the repo you just deployed, so a build is pinned by the commit it
runs from. Check out last year's tag and you get last year's site, byte for byte, without
a lockfile for the build system itself — it's sitting right there in `system/`.

Worth knowing when you're setting up CI: `npm ci` against the committed lockfile is the
only fetch the build makes. Cache `node_modules` on that key and there's nothing else to
warm.
