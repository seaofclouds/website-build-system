// Macros
// The build system supports a special {{ macro }} syntax in Markdown and HTML.
// This file contains all the rewrite rules to apply when a macro is encountered.

import { Env } from "./env.ts"
import { exists, read } from "./io.ts"
import { green, log, logError, yellow } from "./logging.ts"
import { Markdown } from "./markdown.ts"
import type { Page } from "./types.ts"
import { compact, compare, flatJoin, getValuesOfAttributes, plainify, splitAfter, splitBefore, toFullUrl } from "./util.ts"; // prettier-ignore

// Expand all macros found in text, in the context of the given page
export function expandMacros(text: string, page: Page, pages: Page[]) {
  let { frontmatter, path } = page
  let limit = 100

  // We expand repeatedly, because a macro's output can itself contain macros — that's how
  // {{index:…}} renders an include for each child page. We stop when a pass changes nothing,
  // rather than when no braces remain, because braces can legitimately survive a pass inside
  // a code sample. The limit catches a macro that keeps producing itself.
  while (true) {
    if (limit-- <= 0) {
      log(`Detected an infinite loop of nested macros while compiling ${green(path)}`)
      break
    }
    try {
      const before = text
      text = expandAllMacros(text, (macro, spaces): string => {
        // If there's a problem expanding the macro, print a msg and inject a red `{{ macro }}` into the HTML
        let bail = (msg: string, str?: string) => {
          log(msg)
          return `<b style='color:red'>${str ?? `&#123;&#123;${macro}&#125;&#125;`}</b>`
        }

        switch (macro) {
          // {{content}} — marks where page content should be inserted into the template
          case "content":
            return page.compiledBody // Note: don't change indentation, because that messes up <pre> tags

          // {{include:FILENAME}} — replaced with the content of /template/includes/FILENAME.md,
          //   falling back to FILENAME.html. Name it *without* the extension — one is appended
          //   below, so {{include:footer.html}} goes looking for footer.html.md and reports it missing.
          // {{include:FILENAME inline}} — same, but a markdown include is rendered with
          //   Markdown.renderInline(), so it arrives without a wrapping <p>. No effect on an .html one.
          case macro.startsWith("include") && macro: {
            let [name, flag] = stripName(macro, "include").split(" ")

            let mdFile = `template/includes/${name}.md`
            let htmlFile = `template/includes/${name}.html`

            try {
              let isMd = exists(mdFile)
              let content = isMd ? read(mdFile) : read(htmlFile)
              if (isMd) content = flag == "inline" ? Markdown.renderInline(content) : Markdown.render(content)
              // We prepend spaces so that inline includes (eg: {{contact-info}}) don't slam into the text right before them.
              return spaces + content
            } catch (err: any) {
              if (err?.code == "ENOENT") log(`Missing include ${yellow(name)}, referenced in page ${green(path)}`)
              else logError(`Unexpected error loading include ${yellow(name)} in page ${green(path)}`, err)
              return ""
            }
          }

          // {{ index:FILENAME }} — generate an index of all child pages of the current page, using a FILENAME include to render each child
          // {{ index:FILENAME reverse }} — the default is chronological, so specify "reverse" for reverse-chronological
          case macro.startsWith("index:") && macro: {
            let [template, reverse] = stripName(macro, "index").split(" ")
            // In practice, it doesn't seem to matter whether the children are fully compiled or not when we do this.
            // But in theory it *might* matter, so we might want to somehow guarantee that children are compiled before parents.
            let children = page.children.toSorted((a, b) => compare(a.frontmatter.date, b.frontmatter.date))
            if (reverse) children = children.reverse()
            // Cool trick — we expand an include macro in the context of each child page to generate the html for each item in the index
            return children.map((child) => expandMacros(`{{include:${template}}}`, child, pages)).join("\n")
          }

          // {{aside SOME TEXT}} — a note in the right-hand gutter, level with the paragraph that follows it
          // {{aside 2 SOME TEXT}} — the same, pulled up 2 body lines so it lands beside the line you mean
          // Colons are optional and tolerated, so {{aside: …}} and {{aside 2: …}} both work.
          // The gutter exists on the layouts that reserve a band for it — .layout-margin (essay)
          // and .layout-nav (docs, blog); see content.css. On .layout-plain and .layout-wide, and
          // on any layout once the screen is too narrow to afford the band, the aside stays in
          // normal flow. That's a designed fallback rather than a bug, and the markup is the same.
          case macro.startsWith("aside") && macro: {
            let content = stripName(macro, "aside")

            // A leading integer is the move-up count; everything else is content. If the
            // aside genuinely starts with a number, write it as {{aside 0 42 is the answer}}.
            let moveUp = "0"
            const leadingInteger = content.match(/^(\d+)\s*:?\s+([\s\S]*)$/)
            if (leadingInteger) [, moveUp, content] = leadingInteger

            return `<aside class="move-up" style="--move-up: ${moveUp}">${stripColon(content)}</aside>`
          }

          // {{figure ![](src.ext)}} — A <figure> with some media (image or video)
          // {{figure wide border ![](src.ext) }} — with class="wide border"
          // {{figure autoplay ![](src.mp4) }} — the "autoplay" class is special, and adds "autoplay loop muted" to the <video>
          // {{figure ![Photograph of a brown dog on a grassy field](src.ext)}} — with alt text
          // {{figure ![](src.ext) *This* image is, as they say, "cute"}} — with caption, which can be multiline and contain md/html
          case macro.startsWith("figure") && macro: {
            macro = stripName(macro, "figure")

            // Macro expansion happens after markdown conversion, so at this point prop will look like:
            // `classes <img src="src.ext" alt="alt text"> caption <b>text</b> etc etc`
            // But, if the macro was nested inside some HTML, it'll still be raw markdown, so we must convert it:
            if (macro.includes("![")) macro = Markdown.renderInline(macro)

            // If the macro includes any words before the image, we use them as CSS classes
            let [classes, rest] = splitBefore(macro, "<")
            let cls = classes ? ` class="${classes.trim()}"` : ""
            macro = rest

            // Extract the image tag
            let [img, caption] = splitAfter(macro, ">")

            // Check if src is a video
            let src = getValuesOfAttributes(img, "src")[0]
            let ext = splitAfter(src, ".")[1]
            let isVideo = ["mov", "mp4", "webm"].includes(ext)
            if (isVideo) {
              let alt = getValuesOfAttributes(img, "alt")[0] ?? ""
              // We preload the whole video, not just the metadata, because otherwise browsers don't render the poster frame!
              // Our videos are all rather small, so this is fine — akin to loading a few images.
              let attrs = "controls playsinline preload"
              if (classes.includes("autoplay")) attrs += " autoplay loop muted"
              img = `<video ${attrs} src="${src}" alt="${alt}"></video>`
            }

            // Remove empty alt text attrs, which signal "this image doesn't need alt text".
            // TODO: I suspect we should almost always add alt text, and it definitely shouldn't be the same as the caption.
            img = img.replace(` alt=""`, "")

            // If there's a caption, add a <figcaption> element.
            //
            // A caption can hold a nested {{aside}}. Markdown would fold that into the
            // caption's own paragraph — and a <p> can't contain an <aside>, so the browser
            // closes the paragraph early and the caption comes apart. So lift any macro
            // sitting on its own line out of the caption before rendering, then append it
            // after, as a sibling of the caption text. That's the shape the gutter CSS
            // expects: figcaption > p, then figcaption > aside.
            let figcaption = null
            if (caption) {
              let lifted: string[] = []
              caption = caption.replace(/^[ \t]*({{[^{}]*}})[ \t]*$/gm, (_, inner) => (lifted.push(inner), ""))
              const parts = [Markdown.render(caption).trim(), ...lifted].filter(Boolean)
              figcaption = `<figcaption>\n${parts.join("\n")}\n</figcaption>`
            }

            return compact([`<figure${cls}>`, img, figcaption, "</figure>"]).join("\n")
          }

          case macro.startsWith("info:") && macro: {
            return flatJoin([`<div class="info">`, stripName(macro, "info"), "</div>"])
          }

          case macro.startsWith("caution:") && macro: {
            return flatJoin([`<div class="caution">`, stripName(macro, "caution"), "</div>"])
          }

          // {{# SOME COMMENT}} — a comment that's removed at compile time
          case macro.startsWith("#") && macro:
            return ""

          // 2026·07·27 — the site's one date format, used by the byline on a post and by each
          // row of the blog index. A date is a fact here rather than a sentence, so it's set as
          // a label and not written out. en-CA because it's the locale that formats year-first;
          // the middots are a separator you don't read aloud.
          //
          // toLocaleDateString rather than toISOString: an unparseable date gives back the
          // string "Invalid Date" here, and throws a RangeError there. A bad date in one
          // post's frontmatter should show up on the page, not stop the build.
          case "full-date":
            if (!frontmatter.date) return bail(`This page's template requires a date: ` + green(path))
            return new Date(frontmatter.date)
              .toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" })
              .replaceAll("-", "·")

          case "href":
            return page.url.pathname

          // The first segment of this page's URL — "docs" for /docs/pages/, blank for the
          // home page. Templates put it on <body> so CSS can mark which section you're in.
          // The built-in is-current attribute only matches an exact URL, which is right for
          // a table of contents and wrong for a nav link that should stay lit across a
          // whole section.
          case "section":
            return page.url.pathname.split("/")[1] ?? ""

          // {{toc}} — a table of contents for this page, built from its own <h2> headings.
          // For a long page someone might want to skim, or link into a section of.
          //
          // Put it in a *template*, not in a page. It reads page.compiledBody after the
          // header-anchor pass has run over it, which is true when the template is expanded
          // and not while the page's own body is still compiling — so {{toc}} written into
          // a page's markdown quietly returns nothing. It also needs `header_anchors: true`
          // on the template, since without ids there is nothing to link to.
          //
          // Fewer than two headings gets you nothing, because a contents list of one item
          // is a heading you have written out twice.
          // {{excerpt}} — the page's opening paragraph, for a listing.
          //
          // Reads page.body, the raw markdown, rather than page.compiledBody — and that isn't an
          // oversight. {{index:}} expands its include in the context of each child, and pages are
          // compiled in glob order, so /blog/ is built before the posts nested inside it. At that
          // moment a child's compiledBody is still just its source. The raw body is the one thing
          // that's there whoever asks and whenever, so this reads that and renders it itself.
          //
          // Skips anything that isn't prose — a leading figure, an aside, a heading, raw HTML — so
          // that a post opening with an image still gets a sentence into the listing.
          case "excerpt": {
            const blocks = page.body.split(/\n\s*\n/).map((block) => block.trim())
            const prose = blocks.find((b) => b && !b.startsWith("{{") && !b.startsWith("<") && !b.startsWith("#") && !b.startsWith("!["))
            return prose ? Markdown.renderInline(prose) : ""
          }

          case "toc": {
            const headings = Array.from(page.compiledBody.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g))
            if (headings.length < 2) return ""
            // class="plain" is base.css's un-underlined link, the same one the header anchors take.
            const items = headings.map(([, id, inner]) => `  <li><a class="plain" href="#${id}">${plainify(inner).trim()}</a></li>`)
            return flatJoin([`<nav class="toc">`, `<h6>Contents</h6>`, `<ul>`, items, `</ul>`, `</nav>`])
          }

          case "head-title": {
            let title = frontmatter.title || Env.title
            let subtitle = frontmatter.subtitle ? `: ${frontmatter.subtitle}` : ""
            return title + subtitle
          }

          // The whole <meta> tag, not just the URL — so that a site with no share
          // image emits nothing at all, rather than an empty content="".
          case "og-image-tag": {
            const image = frontmatter.image || Env.ogImage
            return image ? `<meta property="og:image" content="${toFullUrl(image)}">` : ""
          }

          case "og-description":
            return plainify(frontmatter.description || Env.description)

          // A page with a publish date is a post — the same signal the RSS feed reads to decide
          // what belongs in it. Keyed on the date rather than on a template name, so that a post
          // keeps its type when you move it onto a different template.
          case "og-type":
            return frontmatter.date ? "article" : "website"

          case "og-url":
            return page.url.toString()

          case "domain":
            return Env.domain

          case "site-title":
            return Env.title

          case "repo-url":
            return Env.repo

          // ─── SITE-SPECIFIC MACROS ───────────────────────────────────────────────────────
          //
          // Everything below this line exists to serve one particular website's structure —
          // a blog whose posts are children of /blog, and a docs section whose running order
          // is defined by the sidebar include. They are examples of the kind of thing this
          // system is for, not features of it.
          //
          // Adapt them, or delete them and write your own. That's the point.

          // Previous/next links that follow the running order of the docs sidebar include.
          case "prev-in-docs": {
            let html = expandMacros(`{{include:${Env.docsIndex}}}`, page, pages)
            let hrefs = getValuesOfAttributes(html, "href")
            let idx = hrefs.indexOf(page.url.pathname)
            if (idx < 1) return ""
            let href = hrefs[idx - 1]
            let nextPage = pages.find((p) => p.url.pathname == href)
            if (!nextPage) return ""
            return `<a class="prev-page" href="${href}"><span>Previous page</span> ${nextPage.frontmatter.title}</a>`
          }

          case "next-in-docs": {
            let html = expandMacros(`{{include:${Env.docsIndex}}}`, page, pages)
            let hrefs = getValuesOfAttributes(html, "href")
            let idx = hrefs.indexOf(page.url.pathname)
            if (idx < 0 || idx == hrefs.length - 1) return ""
            let href = hrefs[idx + 1]
            let nextPage = pages.find((p) => p.url.pathname == href)
            if (!nextPage) return ""
            return `<a class="right" href="${href}"><span>Next page</span> ${nextPage.frontmatter.title}</a>`
          }

          // Previous/next links that follow the publish dates of sibling blog posts. Older
          // sits on the left and newer on the right, the same way back and forward sit in
          // docs — time reads left to right, so the pair points the way the dates run.
          case "older-in-blog":
            if (page.parent) {
              let children = page.parent.children.toSorted((a, b) => compare(a.frontmatter.date, b.frontmatter.date))
              let prev = children[children.indexOf(page) - 1]
              if (prev) return `<a href="${prev.url.pathname}"><span>Older post</span> ${prev.frontmatter.title}</a>`
            }
            return ""

          case "newer-in-blog":
            if (page.parent) {
              let children = page.parent.children.toSorted((a, b) => compare(a.frontmatter.date, b.frontmatter.date))
              let next = children[children.indexOf(page) + 1]
              if (next) return `<a class="right" href="${next.url.pathname}"><span>Newer post</span> ${next.frontmatter.title}</a>`
            }
            return ""

          // ─── END OF SITE-SPECIFIC MACROS ────────────────────────────────────────────────

          // If the macro ends with a question mark, that's an optional frontmatter prop
          case macro.endsWith("?") && macro: {
            let value = frontmatter[macro.slice(0, -1)]
            return value ? spaces + value : ""
          }

          // If the macro matches a frontmatter key, indent and return that value
          case frontmatter[macro] && macro:
            return spaces + frontmatter[macro]

          // If all else fails, display an error in the terminal and the rendered page
          default:
            return bail(`The page ${green(path)} is missing required frontmatter: ${yellow(macro.split(":").at(-1) ?? macro)}`)
        }
      })

      // Nothing changed, so there's nothing left to expand.
      if (text === before) break
    } catch (err) {
      logError("An unhandled error occurred while expanding macros in " + green(page.path), err)
      break
    }
  }

  return text.trim()
}

// HELPERS ////////////////////////////////////////////////////////////////////////////////////////

type ReplaceHbarFn = (contents: string, spaces: string) => string

// Code samples are the one place where {{ braces }} usually mean themselves rather than a
// macro — most obviously in documentation about this build system, but equally in any page
// showing a template language, a shell variable, or Handlebars.
const CODE_REGIONS = /<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>/g

const MACRO_OPEN = /( *){{/g

// Find the }} that closes the {{ at `open`, counting nested pairs along the way.
// Returns the index just past the closing braces, or -1 if it never closes.
const findMacroEnd = (html: string, open: number) => {
  let depth = 0
  for (let i = open; i < html.length - 1; i++) {
    if (html[i] === "{" && html[i + 1] === "{") {
      depth++
      i++
    } else if (html[i] === "}" && html[i + 1] === "}") {
      i++
      if (--depth === 0) return i + 1
    }
  }
  return -1
}

/*
  Macros nest — a figure's caption can hold an aside, and a comment can quote a macro while
  explaining it — so we match braces by counting rather than with a regex. A lazy /{{(.+?)}}/
  ends the outer macro's match at the *inner* macro's closing braces, which silently
  swallows half of one and leaks the other half into the page.

  Counting means the outermost macro matches first. That's the right way round: a comment
  containing an example gets removed whole, and a figure receives its caption with the
  aside still written as a macro — which is fine, because expandMacros runs the whole thing
  again until nothing changes, and the aside expands on the next pass.
*/
const expandAllMacros = (html: string, cb: ReplaceHbarFn) => {
  // Work out where the code samples are, so we can tell whether a given {{ sits inside one.
  const codeSpans: [number, number][] = []
  for (const region of html.matchAll(CODE_REGIONS)) codeSpans.push([region.index, region.index + region[0].length])
  const startsInsideCode = (i: number) => codeSpans.some(([from, to]) => i >= from && i < to)

  let out = ""
  let cursor = 0
  MACRO_OPEN.lastIndex = 0

  for (let match = MACRO_OPEN.exec(html); match; match = MACRO_OPEN.exec(html)) {
    const spaces = match[1]
    const open = match.index + spaces.length

    // We test where the macro *opens*, not whether it overlaps a code sample at all. A macro
    // shown as an example opens inside the sample, and should stay exactly as written. But a
    // real macro can perfectly well have code in its arguments — {{caution: run `./site build`}}
    // opens in the prose and merely happens to contain a <code> — and that must still expand.
    if (startsInsideCode(open)) continue

    // Unbalanced braces are left exactly as written rather than guessed at.
    const end = findMacroEnd(html, open)
    if (end < 0) continue

    out += html.slice(cursor, match.index)
    out += cb(html.slice(open + 2, end - 2).trim(), spaces)
    cursor = end

    // Skip past the macro we just consumed, so its nested macros aren't matched again here.
    MACRO_OPEN.lastIndex = end
  }

  return out + html.slice(cursor)
}

const stripName = (macro: string, name: string) => stripColon(macro.replace(name, "").trim())
const stripColon = (macro: string) => (macro.trim().startsWith(":") ? macro.trim().replace(":", "").trim() : macro)
