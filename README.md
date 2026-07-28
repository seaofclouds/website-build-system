# Website Build System

A small, hackable static site build system. Markdown and HTML in, a finished website out.

About 1,800 lines of commented TypeScript. Six packages do the work — `markdown-it`,
`markdown-it-footnote`, `prismjs`, `chokidar`, `glob`, `ws` — and everything else in
`devDependencies` is TypeScript and its type definitions. No compile step, no bundler,
nothing shipped to your visitors.

It's a starting point, in the spirit of HTML5 Boilerplate — you copy it into your project
and then make it yours.

<br>

## Not a dependency

This is the part that matters, and it comes from Ivy Reese, who wrote the original:

> I really don't want the build system to be a dependency. It was designed and built
> around the idea of being part of the website that it's building. It should be a ship
> of Theseus.

So there's no config file, no plugin API, and no version number. Configuration is a block
of variables at the top of `system/env.ts` that you edit directly. You add a macro by
adding a `case` to a `switch`. The extension mechanism is that you have the code.

The trade is real and worth stating plainly: **you don't get upstream fixes for free.**
When someone improves the original, you read the diff and take what you want. For a
framework that would be a bad deal. For a few thousand lines you can actually read, it
buys you a build system that will never be the reason you can't do something.

<br>

## Getting started

```bash
npm install
./site
```

That builds the site, watches for changes, and serves it at `localhost:3000` with live
reload — and on your local network too, so you can pull it up on your phone.

```bash
./site build     # build once into public/
./site watch     # rebuild on change, no server
./site serve     # serve the last build
./site help      # every command
```

`site` is a short shell script that runs `system/app.ts` under bun, deno, or node —
whichever it finds first. Node 24 or newer if that's your runtime.

Then:

1. Set your domain, title, and description in `system/env.ts`.
2. Replace `content/` with your own pages.
3. Edit the templates and CSS.
4. Delete the parts of `system/` you don't want.

Step 4 is the intended use, not a dare.

<br>

## What's in the box

| | |
| --- | --- |
| `content` | Your pages and their assets. The file path becomes the URL. |
| `template` | Page shells, plus reusable snippets in `template/includes`. |
| `system` | The build system. Yours to edit. |
| `fonts` | Empty. Drop a `.ttf` or `.otf` in to turn on subsetting. |
| `public` | The built site. Deleted and rebuilt every time. |

Markdown or HTML pages, with optional frontmatter — an HTML file with none is copied
through completely untouched. Clean URLs, templates and includes, a macro system,
drafts, RSS, sitemaps, `llms.txt`, client-side redirects, dark mode, live reload, and
automatic font subsetting that cuts a typeface down to just the characters you use.

Plus a layout vocabulary: four small stylesheets, four page shapes, marginalia in a
right-hand gutter, and figures that tile, float, crop and arrange. The
[styleguide](http://localhost:3000/docs/styleguide/) page demonstrates all of it and doubles
as the regression test.

Build-time checking of every internal link and every anchor, which is the feature you'll
end up appreciating most.

<br>

## One thing to know

**`./site build` exits 0 even when the build is broken.** Broken links, missing
frontmatter, unknown templates, failed macros — nearly everything is reported by printing
to the terminal, not by failing.

A clean build means no warnings printed, not a zero exit code. Read the output.

<br>

## Documentation

The full docs are the site itself — run `./site` and open
[localhost:3000/docs](http://localhost:3000/docs/). They live in `content/docs/`, and
they're built by the thing they describe.

<br>

## Requirements

Node 24+, or bun, or deno.

Font subsetting additionally needs two binaries that don't come from npm:

```bash
brew install harfbuzz woff2
```

Without them the build still runs — it logs one warning, skips font regeneration, and
falls back to the next font in the stack. The starter ships no fonts, so you won't need
these until you add one.

<br>

## Credits

The build system was written by [Ivy Reese](https://github.com/ivanreese) for the
[Automerge website](https://github.com/automerge/website). This repository generalises it
into a starting point for other sites; the design, and the philosophy above, are Ivy's.

The live-reload server is adapted from
[please-reload](https://github.com/ivanreese/please-reload).

MIT licensed. See [LICENSE](LICENSE) — note that it retains the original Automerge
copyright notice, as MIT requires, and you should keep it when you copy this.
