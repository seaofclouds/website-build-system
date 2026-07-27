---
title: A Build System You're Meant to Modify
description: Why this one lives in your repo instead of your node_modules.
date: 2026-07-27
template: blog
---

Most build tooling is designed to be depended on. You install it, configure it, and hope
the parts you need are exposed through the options it offers. When they aren't, you write
a plugin, or a wrapper, or you wait.

This one is designed to be *absorbed*. From the original author:

> I really don't want the build system to be a dependency. It was designed and built
> around the idea of being part of the website that it's building. It should be a ship
> of Theseus.

## What that changes

**There's no config file.** Configuration is a block of variables at the top of
`system/env.ts` that you edit directly. A config file would define a schema, a schema is
an interface, and an interface is a promise to keep it stable — which is the first step
toward being a dependency.

**There's no plugin API.** To add a macro you add a `case` to a `switch`. To change how
Markdown renders you edit the renderer. The extension mechanism is that you have the
code.

**There's no version number.** Your copy diverges from everyone else's, immediately and
by design. That's the ship of Theseus: replace a plank at a time until none of the
original remains, and it's still your site's build system throughout.

## The honest tradeoff

You don't get upstream fixes for free. When someone improves the original, you read the
diff and decide whether you want it.

For a large framework that would be a terrible deal. For about 1,800 lines of commented
TypeScript with six dev dependencies, it's a good one — because the thing you're
maintaining is small enough to actually read, and because you'll never hit the wall where
the tool won't let you do the thing you need.

## The part people don't expect

The pleasant surprise is how much this changes debugging. When a page renders wrong, the
stack trace points into your own repo, at a file with comments written for you. You read
it, you see why, you fix it. There's no layer of indirection between what you wrote and
what ran.

That's worth more than it sounds, and it's the reason to start from something small
enough to own rather than something powerful enough to fight.
