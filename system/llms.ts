// LLMs Generate llms.txt and llms-full.txt — a convention (see llmstxt.org) for offering a site's documentation to language models as clean markdown, rather than making them scrape the rendered HTML.
//
// The running order comes from your docs sidebar include, so the generated files follow the same sequence a human reader would.

import { Env } from "./env.ts"
import { exists, read, write } from "./io.ts"
import type { Page } from "./types.ts"
import { extractMdLinks, toFullUrl } from "./util.ts"

export const generateLLMsTxt = (pages: Page[]) => {
  // A site with no docs section doesn't need these files. Opt out by blanking `docsIndex` in env.ts, or simply by not having that include.
  if (!Env.docsIndex) return
  const sidebar = `template/includes/${Env.docsIndex}.md`
  if (!exists(sidebar)) return

  // Grab all the links from the docs sidebar
  const docLinks = extractMdLinks(read(sidebar))

  // Find pages that these links correspond to
  const linkedPages = new Map<string, Page | undefined>(docLinks.map(([_, href]) => [href, pages.find((p) => p.url.pathname == href)]))

  // Generate a markdown link in the format expected by llms.txt
  const makeLink = ([text, href, desc]: [string, string, string?]) => `- [${text}](${toFullUrl(href)})` + (desc ? ": " + desc : "")

  const prelude = `# ${Env.title}\n\n> ${Env.description}\n`

  write(
    `public/llms.txt`,
    [
      prelude,
      `This file contains links to documentation sections following the llmstxt.org standard.`,
      ``,
      `## Documentation`,
      ``,
      ...docLinks.map(([text, href]) => {
        let page = linkedPages.get(href)
        if (!page) return makeLink([text, href])
        return makeLink([page.frontmatter.title ?? text, href, page.frontmatter.description])
      }),
    ].join("\n")
  )

  write(
    `public/llms-full.txt`,
    [
      prelude,
      `This file contains all documentation content in a single document following the llmstxt.org standard.`,
      ...docLinks.map(([text, href]) => {
        let page = linkedPages.get(href)
        if (!page) return `\n# ` + makeLink([text, href])
        return `\n# [${page.frontmatter.title}](${toFullUrl(href)})\n\n` + page.body
      }),
    ].join("\n")
  )
}
