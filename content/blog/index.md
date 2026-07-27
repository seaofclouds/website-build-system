---
# There's no blog index page. The sidebar on each post is the index, the same way
# the docs work, so landing on /blog/ sends you to the newest post.
#
# This page still has to exist, though. The parent/child tree is built from URL
# nesting, so with nothing at /blog/ the posts would attach themselves to the home
# page and the sidebar macro would list the whole site.
template: redirect
redirect_url: {{most-recent-blog-post}}
---
