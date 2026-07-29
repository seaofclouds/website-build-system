// Env This file holds global variables, some of which are constants, some of which can be changed based on CLI commands/options, some of which are runtime state.

export const Env = {
  // ─── YOUR SITE ──────────────────────────────────────────────────────────── This is the entire configuration surface of the build system.
  //
  // There's no config file, and there shouldn't be. This build system is meant to be *part of* your website rather than a dependency you configure from the outside — so the config is just a handful of variables you edit in place.

  // Used to build absolute URLs for RSS, the sitemap, and Open Graph tags. No protocol, no trailing slash.
  domain: "theseus.seaofclouds.workers.dev",

  // The name of your site. Used for the RSS channel title, and as the fallback <title> for any page that doesn't set one in its frontmatter.
  title: "Theseus",

  // Used for the RSS channel description, and as the fallback meta description for any page that doesn't set one.
  description: "A small, hackable static site build system that lives in the repo it builds.",

  // The preview image used when someone shares a link to a page that doesn't specify its own `image` frontmatter. Leave blank to omit the tag entirely.
  ogImage: "",

  // The name of the include (in template/includes/) that holds your docs sidebar. It's read to generate llms.txt. Leave blank to skip those files.
  docsIndex: "docs",

  // Where this repo lives, for links from the site back to the source. Kept here rather than written into a page, so that moving the repo to a different owner is a one-line change. No trailing slash.
  repo: "https://github.com/seaofclouds/website-build-system",

  // ─── CONFIGURABLE CONSTANTS ───────────────────────────────────────────────

  // When these folders change, the watcher triggers a build.
  watchedPaths: ["content", "template"], // const

  // ─── CLI FLAGS ────────────────────────────────────────────────────────────

  // Include draft pages in the build, and emit a robots.txt disallowing everything. True by default for most commands.
  draft: true, // set explicitly with --draft or --no-draft

  // Skip the font subsetting step.
  subsetFonts: true, // disable with --no-fonts

  // Increase the amount of logging
  verbose: false, // enable with --verbose

  // Paint the grid guides over every page. Set to "fluid outline" or "fixed outline" by the --fluid / --fixed flags, and written onto <html> where variables.css picks it up.
  gridDebug: "", // enable with --fluid or --fixed
}
