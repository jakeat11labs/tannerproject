# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

The umbrella repo for things Jake and Tanner build together during their 1:1 sessions. Each project lives self-contained under `projects/<project-name>/`. The repo is mostly a holder; the real work happens inside the projects.

## How to navigate

- **User wants to use a specific project** (set up, run, debug): `cd projects/<name>/` and rely on that project's own README, CLAUDE.md, and any project-scoped skills.
- **User asks "how does X work" / "teach me" / "explain"** at the umbrella level: load `.claude/skills/tutor-mode/SKILL.md`. Tutor mode is general — covers Claude Code basics, dev patterns, the case study of how the projects here were built.
- **User asks operational questions about the audio project** specifically: load `.claude/skills/interview-audio/SKILL.md`. This skill knows to expect commands run from `projects/interview-audio/`.

## Current projects

| Path | Project | Skill |
| --- | --- | --- |
| `projects/interview-audio/` | Two-voice interview generator (ElevenLabs v4 + ffmpeg) | `interview-audio` |

When new projects are added, they go under `projects/` with their own README, CLAUDE.md, and dependency manifest. Add the corresponding row above.

## Universal rules (always in context)

- **Never commit secrets.** `.env`, `voices.config.json`, and similar live inside their project folder and are gitignored. Always `git status` before staging.
- **Never paste a project's working content** (e.g., interview transcripts, voice IDs, customer data) **into commit messages, MEMORY.md, or any persistent file**. Commit messages describe the change, not the content.
- **Don't echo `.env` or sensitive content into terminal output during a screen-share** — summarize counts and shapes, not contents.
- **The user (Jake and Tanner) are ElevenLabs employees with unlimited API credits.** Don't gate or prompt for confirmation on cost/length grounds — just run.

## When in doubt about which project

If the user's request doesn't make clear which project they mean, ask. Don't guess. Each project has its own conventions; cross-project assumptions cause subtle bugs.

## Pages site

`index.html` at root is the GitHub Pages landing page (live at https://jakeat11labs.github.io/tannerproject/). It showcases the projects under `projects/`. When a new project lands, add a card to `index.html` — there's a clearly-marked sample-card pattern used currently for the audio project that's easy to copy.

`.nojekyll` is present so Pages serves files as-is, without Jekyll processing.

## File-tree summary

```
tannerproject/
├── README.md                   ← umbrella README (project list, tools)
├── CLAUDE.md                   ← this file
├── index.html                  ← Pages landing
├── .nojekyll
├── LICENSE
├── assets/                     ← shared brand
├── .claude/skills/             ← skills, loaded on demand
│   ├── interview-audio/        ← audio project walkthrough
│   └── tutor-mode/             ← Claude Code learning mode + case study
└── projects/
    └── interview-audio/        ← self-contained: own README, CLAUDE.md, deps, samples, docs
```
