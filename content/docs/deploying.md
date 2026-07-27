---
title: Deploying
description: The build output is a folder of files, which makes hosting it easy anywhere.
template: docs
---

`./site build` writes a folder of static files to `public/`. There's no server, no
runtime, and no database — so any static host will serve it.

```bash
./site build
```

Note that this command excludes drafts by default, which is the opposite of every other
command. Pass `--draft` if you want them.

## GitHub Pages

The starter ships a workflow at `.github/workflows/main.yml` that builds and deploys on
every push to `main`. To use it, enable Pages for the repo and set the source to
"GitHub Actions".

For a custom domain, put a file called `CNAME` in `content/` containing just the domain.
It'll be copied to the root of the built site. Point your DNS at GitHub Pages and you're
done.

## Anywhere else

Netlify, Cloudflare Pages, Vercel, S3, or a plain web server all work the same way:

- **Build command:** `npm ci && npx --yes tsx system/app.ts build`, or just
  `node --disable-warning=ExperimentalWarning system/app.ts build` on Node 24+
- **Output directory:** `public`

If you're on a host that lets you configure redirects and headers properly, consider
replacing the client-side redirect pages with real 301s. Nothing in the build system
depends on them.

## Clean URLs on your own server

The build writes `about/index.html` rather than `about.html`, so `/about/` works out of
the box on any server that serves directory indexes — which is nearly all of them.

If yours doesn't, either configure it to, or set `clean: false` on your pages and link
to the `.html` paths directly.

## Fonts in CI

If you use the [font subsetting](/docs/assets/), the build machine needs two binaries on
its PATH — `hb-subset` and `woff2_compress`. Without them the build skips regeneration
and your pages fall back to system fonts.

The package names vary by distro. On Debian and Ubuntu, which is what the shipped
workflow targets:

```yml
- run: sudo apt-get install -y libharfbuzz-bin woff2
```

{{info: Worth confirming the first time you enable this — check the CI log for
`Regenerating Fonts` rather than the warning about missing binary deps. Package naming is
the sort of thing that quietly changes between releases.}}

The alternative is to commit `content/static/fonts/` and remove it from `.gitignore`, so
the subsets are built once locally and used everywhere. That's a reasonable choice if you
change fonts rarely and would rather not depend on CI having the right binaries.

## A note on what you're deploying

The build system is in the repo you just deployed. That's the point — there's no version
of it pinned somewhere else that could drift, and no upstream that could change under
you. What built the site today will build it identically in five years, because it's
sitting right there.

The flip side: you won't get upstream fixes automatically. If you want an improvement
someone else made, you go and read their diff and apply what you want. For a few
thousand lines of code you own, that's a fair trade.
