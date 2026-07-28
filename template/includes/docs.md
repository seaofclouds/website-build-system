{{# This file is the docs sidebar, and it doubles as the running order for the
    previous/next page links and for the generated llms.txt. Hrefs need trailing
    slashes, so that they match each page's URL exactly.

    The order is architectural rather than alphabetical: templates and macros are
    the machinery, and pages are what you build out of them, so they sit together
    in that order. Style is its own group because you reach for it at a different
    time — you write a page once and adjust how it looks a hundred times.

    The styleguide is listed last, with its own headings beneath it. Those are
    anchors rather than pages, so {{prev-in-docs}} and {{next-in-docs}} can't
    match them — which is why they go at the end, where the only thing that
    breaks is the "next page" link on the final page, and there isn't one. }}

- [Getting Started](/docs/)

Guide

- [Templates](/docs/templates/)
- [Macros](/docs/macros/)
- [Content](/docs/content/)
- [Links & Redirects](/docs/links/)
- [Deployment](/docs/deployment/)

Style

- [Stylesheets](/docs/styles/)
- [Fonts](/docs/fonts/)

[Styleguide](/docs/styleguide/)

- [Grid](/docs/styleguide/#grid)
- [Asides](/docs/styleguide/#asides)
- [Figures](/docs/styleguide/#figures)
- [Spacing](/docs/styleguide/#spacing)
- [Arrangements](/docs/styleguide/#arrangements)
- [Gallery and masonry](/docs/styleguide/#gallery-and-masonry)
- [Callouts](/docs/styleguide/#callouts)
- [Responsive behaviour](/docs/styleguide/#responsive-behaviour)
