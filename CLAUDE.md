# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

The umbrella repo for things Jake and Tanner build together during their 1:1 sessions. Each project lives self-contained under `projects/<project-name>/`. The repo is mostly a holder; the real work happens inside the projects.

## How to navigate

- **User wants to use a specific project** (set up, run, debug): `cd projects/<name>/` and rely on that project's own README, CLAUDE.md, and any project-scoped skills.
- **User asks "how does X work" / "teach me" / "explain"** at the umbrella level: load `.claude/skills/tutor-mode/SKILL.md`. Tutor mode is general — covers Claude Code basics, dev patterns, the case study of how the projects here were built.
- **User asks operational questions about the audio project** specifically: load `.claude/skills/interview-audio/SKILL.md`. This skill knows to expect commands run from `projects/interview-audio/`.
- **User asks to add or process a new session** from raw transcripts, Claude Code/Cursor context, screenshots, or notes: load `.agents/skills/tanner-session-processor/SKILL.md`, then follow the "New session processing workflow" below.

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
- **Treat raw session transcripts and raw Claude Code/Cursor logs as source material, not public copy.** Summarize them into session pages instead of dumping them into the Pages site.

## When in doubt about which project

If the user's request doesn't make clear which project they mean, ask. Don't guess. Each project has its own conventions; cross-project assumptions cause subtle bugs.

## Pages site

`index.html` at root is the GitHub Pages landing page (live at https://jakeat11labs.github.io/tannerproject/). It's a **session directory** — a chronological list of session cards, newest first. Each session is its own page under `sessions/<YYYY-MM-DD>.html`.

When a new session happens:
1. Create `sessions/<YYYY-MM-DD>.html` for the build output (or notes/feedback page). Asset paths from inside `sessions/` are `../assets/`, `../projects/...`.
2. Add a new `<article class="session-card">` block to `index.html` — copy the existing pattern. Bump `data-num` and place newest first. Move the previous `--latest` modifier to the new top card.
3. If multiple pages belong to one session (e.g., build + feedback), add each as a separate tag link inside that card's `.session-inside` block.

`.nojekyll` is present so Pages serves files as-is, without Jekyll processing.

## New session processing workflow

Use this when Jake provides raw session material and wants the project page updated with another session. The detailed workflow lives in `.agents/skills/tanner-session-processor/SKILL.md`; load it before editing session pages.

### Inputs

Expected inputs can include:

- **Raw human session transcript** — the conversation between Jake and Tanner.
- **Raw Claude Code or Cursor session context** — chat transcript, tool output, command history, screenshots, browser comments, or working notes.
- **Generated artifacts** — HTML pages, code, images, diagrams, PDFs, audio, or links made during the session.

Treat these as source material. The output should be a synthesized learning record, not a transcript dump.

### Source material handling

- Do not commit raw transcripts or raw Claude Code context by default. Work from local files, pasted context, or untracked staging files.
- If Jake explicitly wants source material preserved in the repo, sanitize it first and make clear that committed files are visible in GitHub and may be served by Pages if linked or discoverable.
- If source material is intentionally preserved, place it under `sessions/<YYYY-MM-DD>/` with readable subfolders:
  - `raw-transcript/` for the human session transcript.
  - `claude-code-transcript/` for Claude Code, Cursor, or agent session exports.
  - `visuals/` for screenshots, diagrams, and visual references.
- Raw-source folders are gitignored by default. If sanitized source material should be published, force-add it only after Jake confirms it is safe.
- Public session pages should contain summaries, artifacts, lessons, decisions, and next steps.

### Synthesis steps

1. Confirm the session date and choose `sessions/<YYYY-MM-DD>.html`. If the material and current date disagree, use the date the session happened.
2. Read the raw sources and produce a compact session brief:
   - what was built or changed,
   - what Tanner learned,
   - what Jake should reinforce later,
   - decisions made,
   - open questions,
   - next-session candidates.
3. Create or update `sessions/<YYYY-MM-DD>.html` using the existing visual style. From inside `sessions/`, shared asset paths start with `../assets/` and project paths start with `../projects/...`.
4. Update `index.html`:
   - add a new `<article class="session-card">` newest first,
   - bump `data-num`,
   - move the `--latest` modifier to the new top card,
   - add links for each page or artifact in that session's `.session-inside` block.
5. Update the top learning tracker, upcoming topics, resources, or infographic links if the session changes priorities.
6. Keep raw/private content out of headings, meta descriptions, alt text, commit messages, and public summaries.
7. Verify the resulting static page: parse the HTML, check local links and image paths, open or screenshot the page when practical, and run `git status` before staging so raw source files do not get committed by accident.

## File-tree summary

```
tannerproject/
├── README.md                   ← umbrella README (project list, tools)
├── AGENTS.md                   ← Codex/agent guidance; keep aligned with CLAUDE.md
├── CLAUDE.md                   ← this file
├── index.html                  ← Pages directory (session list)
├── sessions/                   ← one HTML page per session, dated
│   ├── 2026-05-05.html         ← session 01 · two-voice interview generator
│   ├── 2026-05-10.html         ← session 02 · interview training clips
│   ├── 2026-05-11.html         ← session 02 · build notes & feedback
│   ├── 2026-05-20.html         ← session 03 · referral agent (paused at plan-mode)
│   └── 2026-05-20/             ← optional sanitized source materials (transcripts, visuals)
├── .nojekyll
├── LICENSE
├── assets/                     ← shared brand
├── .agents/skills/             ← project-local agent skills
│   └── tanner-session-processor/ ← session ingestion and page update workflow
├── .claude/skills/             ← skills, loaded on demand
│   ├── interview-audio/        ← audio project walkthrough
│   └── tutor-mode/             ← Claude Code learning mode + case study
└── projects/
    └── interview-audio/        ← self-contained: own README, CLAUDE.md, deps, samples, docs
```
