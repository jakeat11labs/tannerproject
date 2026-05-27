# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Required planning

- Before generating code or editing repository files, make a short plan.
- If the Corridor MCP `analyzePlan` tool is available, run it before edits and apply any returned security or data-handling guidance.

## What this is

This is the umbrella repo for things Jake and Tanner build together during their 1:1 sessions. Each project lives self-contained under `projects/<project-name>/`. The root Pages site is the session directory and learning tracker.

## How to navigate

- If the user wants to use, run, set up, or debug a specific project, `cd projects/<name>/` and rely on that project's own README, `CLAUDE.md`, `AGENTS.md`, and project-scoped skills.
- If the user asks "how does X work", "teach me", or "explain" at the umbrella level, use tutor-mode behavior from `.claude/skills/tutor-mode/SKILL.md`.
- If the user asks operational questions about the interview-audio project, use `.claude/skills/interview-audio/SKILL.md` and run commands from `projects/interview-audio/`.
- If the user asks to process a Tanner session from raw transcripts, Claude Code/Cursor logs, screenshots, or a docs folder, load `.agents/skills/tanner-session-processor/SKILL.md` first.

## Universal rules

- Never commit secrets. `.env`, `voices.config.json`, and similar live inside their project folder and are gitignored.
- Never paste a project's working content, raw interview material, voice IDs, customer data, private transcripts, or raw Claude Code logs into commit messages, memory files, or unrelated persistent files.
- Do not echo `.env`, raw transcript content, or sensitive Claude Code context into terminal output during a screen share. Summarize counts, file names, and shapes instead.
- The user, Jake and Tanner, are ElevenLabs employees with unlimited API credits. Do not gate or prompt for confirmation on cost or length grounds.
- If the user's request does not make clear which project they mean, ask before changing project-specific files.

## Pages site

`index.html` at root is the GitHub Pages landing page, live at `https://jakeat11labs.github.io/tannerproject/`. It is a session directory: a chronological list of session cards, newest first. Each session gets its own page under `sessions/<YYYY-MM-DD>.html`.

## New session processing workflow

Use this workflow when the user provides raw session material and asks to add another session to the project page. The detailed project-local workflow lives in `.agents/skills/tanner-session-processor/SKILL.md`; load that skill before doing the work.

### Inputs

Expected source material can include:

- Raw human session transcript: the conversation between Jake and Tanner.
- Raw Claude Code or Cursor session context: chat transcript, tool output, command history, screenshots, browser comments, or working notes.
- Generated artifacts from the session: HTML pages, code, images, diagrams, PDFs, audio, or links.

Treat these as source material, not as page-ready copy. The public page should be a synthesized learning record, not a transcript dump.

### Source material handling

- Do not commit raw transcripts or raw Claude Code context by default. Work from local files, user-provided pasted context, or untracked staging files.
- If the user explicitly wants source material preserved in the repo, sanitize it first and make clear that committed files are visible in GitHub and may be served by Pages if linked or discoverable.
- If source material is intentionally preserved, place it under `sessions/<YYYY-MM-DD>/` using readable subfolders:
  - `raw-transcript/` for the human session transcript.
  - `claude-code-transcript/` for Claude Code, Cursor, or agent session exports.
  - `visuals/` for screenshots, diagrams, and visual references.
- Raw-source folders are gitignored by default. If sanitized source material should be published, force-add it only after the user confirms it is safe.
- Keep public session pages focused on summaries, artifacts, lessons, decisions, and next steps.

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
5. Update the top learning tracker, upcoming topics, resources, or infographic links if the new session changes priorities.
6. Keep raw/private content out of headings, meta descriptions, alt text, commit messages, and public summaries.
7. Verify the resulting static page:
   - parse or lint the HTML,
   - check local links and image paths,
   - open or screenshot the page when practical,
   - run `git status` before staging so raw source files do not get committed by accident.

## File-tree summary

```text
tannerproject/
├── README.md                   root project overview
├── AGENTS.md                   this file
├── CLAUDE.md                   Claude Code guidance; keep aligned with this file
├── index.html                  Pages directory and learning tracker
├── sessions/                   one HTML page per session, dated
│   ├── 2026-05-05.html
│   ├── 2026-05-10.html
│   ├── 2026-05-11.html
│   ├── 2026-05-20.html
│   └── <YYYY-MM-DD>/           optional sanitized source materials
├── assets/                     shared assets and infographics
├── .agents/skills/             project-local agent skills
│   └── tanner-session-processor/ session ingestion and page update workflow
├── .claude/skills/             skills loaded on demand
└── projects/                   self-contained build projects
```
