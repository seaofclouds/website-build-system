// I/O This file wraps Chokidar, Glob, and Node, giving use nicer default behaviour and more ability to remove or replace these dependencies without breaking anything.

import Chokidar from "chokidar"
import { globSync } from "glob"
import ChildProcess from "node:child_process"
import FS from "node:fs"
import * as Path from "node:path"
import { fileURLToPath } from "node:url"
import { Env } from "./env.ts"
import { green, log, logError, magenta, red } from "./logging.ts"
import type { Stats } from "./types.ts"
import { debounce, toSorted, unique } from "./util.ts"

const dotfiles = /(^|[\/\\])\../

// After anything inside the given paths changes, wait for things to calm down, then run the given actions.
export function runWatcher(paths: string[], actions: () => any, debounceTime = 100) {
  const runActionsSoon = debounce(debounceTime, actions)

  Chokidar.watch(paths, { ignored: dotfiles, ignoreInitial: true })
    .on("error", () => log(red(`Watching ${JSON.stringify(paths)} failed`)))
    .on("all", (event, path) => {
      // There's a weird issue where empty files trigger a change event when used as the source of a hardlink. This leads to infinite recompile loops. To mitigate, we ignore them.
      if (event == "change") {
        const stats = FS.statSync(path)
        if (stats.size == 0 && stats.nlink > 1) {
          if (Env.verbose) log(magenta(event) + " " + green(path) + " " + magenta("(ignoring)"))
          return
        }
      }

      if (Env.verbose) log(magenta(event) + " " + green(path))
      runActionsSoon()
    })
}

// Extend glob to support arrays of patterns TODO: Can we use node's new built-in FS.globSync instead of the npm package?
export const glob = (...patterns: string[]) => toSorted(unique(patterns.flatMap((p) => globSync(p))))

// Common file path ops
export const basename = (path: string) => Path.parse(path).name
export const extname = (path: string) => Path.extname(path).slice(1) // strip leading dot
export const parentDir = (path: string) => Path.dirname(path)

// Ensure that the parent dir exists (ie: before writing a file inside it)
export const ensureDir = (path: string) => {
  mkdir(parentDir(path) || ".")
  return path
}

// Caching these reads only made a ~4ms improvement on M1, so it was deemed not worth the complexity
export const read = (path: string) => FS.readFileSync(path).toString()

export const mkdir = (path: string) => FS.mkdirSync(path, { recursive: true })
export const exists = (path: string) => FS.existsSync(path)
export const rm = (pattern: string) => glob(pattern).forEach((path) => FS.rmSync(path, { recursive: true }))
export const copy = (path: string, dest: string) => FS.copyFileSync(path, ensureDir(dest), FS.constants.COPYFILE_EXCL)
export const write = (dest: string, text: string) => FS.writeFileSync(ensureDir(dest), text, { flag: "wx" }) // open for writing, fail if file exists
export const link = (path: string, dest: string) => FS.linkSync(path, ensureDir(dest))
export const stats = (path: string): Stats => {
  let s = FS.statSync(path)
  return { modified: s.mtime }
}

// Saner default for execSync
export const exec = (cmd: string) => ChildProcess.execSync(cmd, { stdio: "inherit" })

// Like exec, but captures the output instead of printing it, and returns null if the command fails.
export const execCapture = (cmd: string) => {
  try {
    return ChildProcess.execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return null
  }
}

// The browsable URL of this repo's git remote, if it has one. We read this rather than hardcoding a URL, so it survives forks and renames.
export const gitRemoteUrl = () => {
  const remote = execCapture("git remote get-url origin")
  if (!remote) return null
  // Normalize the ssh form (git@host:user/repo.git) into a browsable https URL
  return remote.replace(/^git@([^:]+):/, "https://$1/").replace(/\.git$/, "")
}

// Make sure the script is being run from the right dir
export const isSafeInvocation = () => Path.resolve(process.cwd()) === Path.dirname(Path.dirname(fileURLToPath(import.meta.url)))

// FILE WRITING WITH NICE ERRORS //////////////////////////////////////////////////////////////////

export const writePage = (dest: string, html: string) => {
  try {
    write(dest, html)
  } catch (err: any) {
    if (err.code === "EEXIST") log(red(`Multiple pages want to be ${green(dest.replace("public/", "/"))}`))
    else logError("Unexpected error while writing page " + green(dest), err)
  }
}

export const copyPage = (path: string, dest: string) => {
  try {
    copy(path, dest)
  } catch (err: any) {
    if (err.code === "EEXIST") log(red(`Multiple pages want to be ${green(dest.replace("public/", "/"))}`))
    else logError("Unexpected error while copying page " + green(path), err)
  }
}

export const linkFile = (path: string, dest: string) => {
  try {
    link(path, dest)
  } catch (err: any) {
    logError("Unexpected error while linking file " + green(dest), err)
  }
}
