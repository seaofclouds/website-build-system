// Highlights the sidebar link for whichever section you're currently reading.
//
// The build marks the link to the current *page* with an is-current attribute, which it
// can do statically because it knows every URL. It can't know which heading you've
// scrolled to, so that part happens here. Pages whose sidebar has no anchor links — every
// page but the styleguide, right now — return immediately and cost nothing.

;(() => {
  const links = [...document.querySelectorAll('.site-nav a[href*="#"]')]
  if (!links.length) return

  // Pair each sidebar anchor with the heading it points at, in document order. Anchors
  // pointing at another page, or at an id that no longer exists, drop out here.
  const pairs = links
    .map((a) => [document.getElementById(decodeURIComponent(a.hash.slice(1))), a])
    .filter(([heading]) => heading)
  if (!pairs.length) return

  let active = null

  const update = () => {
    // The section you're reading is the last one whose heading has passed under the
    // masthead. Read the masthead height from CSS rather than hardcoding it, so the two
    // can't drift.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const masthead = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--masthead-height")) || 5
    const line = masthead * rem + 8

    let current = pairs[0][1]
    for (const [heading, link] of pairs) {
      if (heading.getBoundingClientRect().top <= line) current = link
    }

    if (current === active) return
    active?.removeAttribute("is-here")
    current.setAttribute("is-here", "")
    active = current
  }

  addEventListener("scroll", update, { passive: true })
  addEventListener("resize", update, { passive: true })
  update()
})()
