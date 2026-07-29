// Validation This file contains various validity checks we run compiled pages through.

import { exists, read } from "./io.ts"
import { green, log, yellow } from "./logging.ts"
import type { Page } from "./types.ts"
import { getValuesOfAttributes, withTrailingSlash } from "./util.ts"

export function runValidityChecks(pages: Page[]) {
  checkForBrokenLinks(pages)
  checkForBrokenAssets(pages)
  checkForInvalidHtml(pages)
}

const checkForInvalidHtml = (pages: Page[]) => {
  for (const page of pages) {
    if (page.html.match(/<video\b[^>]*?\/>/g))
      log(`Invalid html ${yellow("<video … />")} — use ${yellow("<video …></video>")} (in ${green(page.path)})`)
  }
}

const checkForBrokenLinks = (pages: Page[]) => {
  for (const page of pages) {
    for (const href of getValuesOfAttributes(page.html, "href")) {
      checkLink(pages, page, href)
    }
  }
}

// Images, videos and scripts. Separate from the href walk above because an asset is found at exactly the path it names, while a page link gets index.html appended — see checkAsset.
//
// Note this reads src="…" out of the raw HTML with a regex, so in principle it could match something inside a code sample. In practice it can't: Markdown escapes quotes to &quot; inside a fenced block, so a documented <img src="…"> never looks like an attribute here. The styleguide contains exactly that, pointing at a file that doesn't exist, and stays quiet — worth knowing before anyone "fixes" the escaping.
const checkForBrokenAssets = (pages: Page[]) => {
  for (const page of pages) {
    for (const src of getValuesOfAttributes(page.html, "src")) {
      checkAsset(page, src)
    }
  }
}

const checkLink = (pages: Page[], page: Page, link: string) => {
  // Check links that target an anchor on the same page
  if (link.startsWith("#")) {
    const targetAnchor = link.slice(1)
    if (!targetAnchor) return // ignore href="#"
    if (!hasTargetAnchor(page.html, targetAnchor)) log(`Broken anchor link in ${green(page.path)}: ${yellow(link)}`)
    return
  }

  // A link containing a dot names a file rather than a clean URL — a stylesheet, a plain .html page with no frontmatter, or an off-site address. All three are checked the same way an image is, so hand them to checkAsset rather than appending index.html below.
  if (link.includes(".")) return checkAsset(page, link)

  // Initialize a URL object for this link, using the current page's absolute URL as a base for relative links.
  let linkUrl = new URL(link, page.url)
  // Also, note, this ^ might throw. If it does, that's unexpected, so we let it bubble up.

  // Links are inconsistent about trailing slashes, so we normalize
  let pathname = withTrailingSlash(linkUrl.pathname)

  // Check that the target exists
  const targetFile = "public" + pathname + "index.html"
  if (!exists(targetFile)) return log(`Broken link in ${green(page.path)}: ${yellow(link)}`)

  // If the target is a compiled page (not a static html file), we can do some extra checks
  const targetPage = pages.find((p) => p.url.pathname === pathname)

  // Warn if the target is a draft page
  if (targetPage?.frontmatter.publish == "draft") return log(`Warning: linking to a draft in ${green(page.path)}: ${yellow(link)}`)

  // If the link targets an anchor, make sure the anchor exists in the targetHtml
  if (linkUrl.hash) {
    const targetAnchor = linkUrl.hash.slice(1) // Drop the #
    let targetHtml = targetPage?.html || read(targetFile)
    const exists = hasTargetAnchor(targetHtml, targetAnchor)
    if (!exists) log(`Broken cross-page anchor in ${green(page.path)}: ${yellow(link)}`)
    return
  }
}

// An asset sits in the output at exactly the path it names — no clean-URL rewrite, no index.html appended. That one difference is why it can't go through checkLink.
//
// This is the check that used to be missing entirely, and its absence was invisible: a mistyped image path produced a build with zero warnings and a broken picture on the page.
const checkAsset = (page: Page, link: string) => {
  // An inline data: URI carries its own payload. Nothing to look for.
  if (link.startsWith("data:")) return

  // Anything unparseable is not something we can reason about, so leave it alone rather than guessing. (checkLink lets a throw here bubble up, because by that point the link is known to be site-relative. Here it might be anything at all.)
  let url: URL
  try {
    url = new URL(link, page.url)
  } catch {
    return
  }

  // Off-site, or a scheme like mailto: and tel: whose origin can never match ours. Either way there's no file of ours to go looking for.
  if (url.origin !== page.url.origin) return

  // pathname stays percent-encoded, so a file whose name contains a space or a non-ASCII character would be reported as missing. Decode it back before touching the disk.
  const targetFile = "public" + decodeURIComponent(url.pathname)
  if (!exists(targetFile)) log(`Broken asset in ${green(page.path)}: ${yellow(link)}`)
}

const hasTargetAnchor = (html: string, id: string) => new RegExp(`\\b(id|name)=["']${id}["']`).test(html)
