// Markdown Here, we initialize and configure the markdown renderer.

import MarkdownIt from "markdown-it"
import MarkdownItFootnote from "markdown-it-footnote"
import Prism from "prismjs"
import { log, yellow } from "./logging.ts"
import { splitOnce, trimAll } from "./util.ts"

// If you need to add more languages, import them here:
import "prismjs/components/prism-bash.js"
import "prismjs/components/prism-css.js"
import "prismjs/components/prism-json.js"
import "prismjs/components/prism-json5.js" // for jsonc — plain json has no comment token
import "prismjs/components/prism-jsx.js" // We don't use jsx, but need to import it for tsx to work
import "prismjs/components/prism-markup.js" // html, xml, svg
import "prismjs/components/prism-toml.js"
import "prismjs/components/prism-tsx.js"
import "prismjs/components/prism-typescript.js"
import "prismjs/components/prism-yaml.js" // also registers the "yml" alias

export const Markdown = MarkdownIt({ html: true, typographer: true }).use(MarkdownItFootnote)

// Override the default markdown renderer to provide our own footnote style.
Markdown.renderer.rules.footnote_caption = (tokens, idx) => {
  let n = tokens[idx].meta.id + 1 // calculate the footnote number
  if (tokens[idx].meta.subId > 0) n += ":" + tokens[idx].meta.subId // incorporate subIds
  return `${n}` // our footnote style is just the number
}

// Override the default footnote block renderer
Markdown.renderer.rules.footnote_block_open = () => '<section class="footnotes" role="doc-endnotes"><hr><ol>\n'

// Override the default fence block renderer to add title, line highlight & wide support
Markdown.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]

  // `wide` is a layout modifier rather than a language, and it has to come out of the info string before the language does. A block that needs the room is usually a diagram or a table of output, which has no language at all — and ``` wide would otherwise read "wide" as the language and log the "add an import" warning that a genuinely unimported language is supposed to log. It composes: ``` wide, ```ts wide, ```ts wide title="server.ts".
  //
  // Only the words before the first `=` are modifiers, because everything after it is a quoted value that may say anything: ```js title="a wide table" is a title, not a mode.
  let info = token.info.trim()
  const isWide = /(^|\s)wide(\s|$)/.test(splitOnce(info, "=")[0])
  if (isWide) info = info.replace(/(^|\s)wide(?=\s|$)/, "").trim()

  let [langName, meta] = splitOnce(info, " ")

  // Process line highlight markers
  let lines = token.content.trim().split("\n")
  const highlightedLines = new Set<number>()
  const highlightedRedLines = new Set<number>()
  let insideBlock = false
  let insideRedBlock = false
  let highlightNext = false
  let out: string[] = []
  lines.forEach((line, i) => {
    if (/highlight-next-line/.test(line)) {
      highlightNext = true
    } else if (/highlight-red-start/.test(line)) {
      insideRedBlock = true
    } else if (/highlight-red-end/.test(line)) {
      insideRedBlock = false
    } else if (/highlight-start/.test(line)) {
      insideBlock = true
    } else if (/highlight-end/.test(line)) {
      insideBlock = false
    } else if (insideRedBlock) {
      highlightedRedLines.add(out.length)
      out.push(line)
    } else if (insideBlock || highlightNext) {
      highlightNext = false
      highlightedLines.add(out.length)
      out.push(line)
    } else {
      out.push(line)
    }
  })
  let code = out.join("\n")

  // Run Prism
  let highlightedBlock: string
  if (langName) {
    if (Prism.languages[langName]) highlightedBlock = Prism.highlight(code, Prism.languages[langName], langName)
    else log(`To use syntax highlighting for ${langName}, add an import to ${yellow("/system/markdown.ts")}`)
  }
  highlightedBlock ??= MarkdownIt().utils.escapeHtml(code)

  // Wrap lines
  lines = highlightedBlock.split("\n").map((line, i) => {
    const classes = ["code-line"]
    if (highlightedLines.has(i)) classes.push("highlighted-line")
    if (highlightedRedLines.has(i)) classes.push("highlighted-red-line")
    return `<div class="${classes.join(" ")}">${line}</div>`
  })
  lines = [`<pre${isWide ? ` class="wide"` : ""}><code class="language-${langName}">`, ...lines, "</code></pre>"]

  // Add title above the code block, if any. The title bar is a sibling of the <pre>, not a wrapper, so it's held to the measure by its own rule and has to be widened alongside it — otherwise a wide block with a title comes out with the bar covering half its top edge.
  const titleMatch = meta?.match(/title="([^"]+)"/)
  if (titleMatch) lines.unshift(`<div class="code-title${isWide ? " wide" : ""}">${Markdown.utils.escapeHtml(titleMatch[1])}</div>`)

  return trimAll(lines).join("")
}
