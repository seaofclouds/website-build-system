---
title: Teaching a Macro System Not to Expand Itself
description: Documentation about a templating language has to be able to print the templating language. That took two attempts.
date: 2026-07-27
template: blog
---

Writing docs for this build system surfaced a problem that had never come up while it
built one specific website: macro expansion is textual, so it happens everywhere,
including inside code samples.

Which means a page explaining that `{{content}}` marks where the page body goes would
have its own body substituted into the example. `{{content}}` returns the compiled body,
that body contains the code sample, and the sample contains `{{content}}` — so the
expansion loop runs until it hits its hundred-pass limit and gives up.

Not an exotic edge case. Any page quoting Handlebars, Jinja, GitHub Actions syntax, or a
shell `${VAR}` runs into the same thing.

## The obvious fix, and why it was wrong

Skip anything inside `<pre>` and `<code>`. Split the HTML on those regions, expand only
the segments between them, stitch it back together.

That worked for fenced blocks, and it broke callouts. This one, from the getting-started
page:

```
{{caution: `./site build` exits 0 even when the build is broken.}}
```

By the time macros run, Markdown has already turned the backticks into a `<code>`
element. So the macro *opens* in prose, and *closes* after a code region. Splitting the
string into segments meant no single segment held a complete match, and the macro
silently rendered as literal text.

I only caught it because I looked at the rendered page. The build printed nothing — this
system reports problems by logging, and a macro that never matches its pattern isn't a
problem it knows about. Exit code 0, clean terminal, broken page.

## The rule that actually holds

The test isn't whether a macro *touches* code. It's where it **opens**:

```ts
if (startsInsideCode(offset + spaces.length)) return match
return cb(macro.trim(), spaces)
```

A macro written inside a code sample opens inside that sample, so it stays literal. A
real macro opens in prose and may contain whatever it likes — including inline code — and
still expands.

Both behaviours are on this page right now. The examples above are inert; the callout
below is not, and its text contains a `<code>` span.

{{info: This callout is written as a macro whose argument includes inline `code`. Under
the first implementation it would have rendered as literal braces.}}

## A knock-on change

The expansion loop used to run `while (text.indexOf("{{") !== -1)` — keep going until no
braces remain. Once braces can legitimately survive a pass, that condition never clears
and every page with a code sample would spin to the limit.

It now stops when a pass changes nothing:

```ts
const before = text
text = expandAllMacros(text, …)
if (text === before) break
```

Which is a better condition regardless. It terminates on the real criterion — no more
work to do — rather than on a proxy for it.

Worth checking that the error path still behaved, since a macro that fails to match logs
a message *and* injects red text into the page. If that red text still contained braces,
it would re-trigger every pass and log a hundred times. It doesn't — the bail path emits
HTML entities rather than literal braces — but that was luck rather than design, so it
now has a test case in the form of a page that deliberately references two macros that
don't exist. Two log lines, one per macro, no repeats.

## The lesson

The build system was correct for years, because automerge.org never documented the tool
that built it. Turning something into a starter means its own docs become the first
serious adversarial test — and self-documentation is a genuinely harder case than the
site it was built for.
