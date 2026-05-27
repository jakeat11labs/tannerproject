---
name: tanner-session-processor
description: |
  Process Jake and Tanner session source material into the Tannerproject Pages site. Use this skill whenever the user asks to add a new session, process raw session transcripts, process Claude Code or Cursor session logs, point at a project docs folder, turn a session into a project-page entry, update the learning tracker from a session, or decide whether new infographics/resources should be created from what was taught. This skill is especially for prompts like "process these two files from the last session", "add this session to Tannerproject", "turn this Claude Code log and transcript into a session page", "drop these into the project page", or "what should we make as resources from this session". It coordinates with the canvas-design skill when the session reveals a concept worth explaining visually.
---

# Tanner Session Processor

Use this skill to turn raw session material into the public Tannerproject session record. The goal is not to archive everything. The goal is to produce a useful learning artifact: what happened, what Tanner learned, what Jake should reinforce, what got built, what remains open, and what visual resources would help next time.

## Operating Contract

- Work from `/Users/jakerains/Projects/Tannerproject` unless the user explicitly names another repo.
- Treat raw human transcripts, Claude Code logs, Cursor logs, browser comments, and tool output as source material, not public copy.
- Do not dump raw transcript text or raw agent logs into public pages. Synthesize and quote sparingly, only when the quote is safe and useful.
- Keep private details, secrets, voice IDs, customer/interview content, and accidental tool output out of session pages, alt text, metadata, commit messages, and memory.
- Before editing, inspect `AGENTS.md`, `CLAUDE.md`, `index.html`, existing `sessions/*.html`, and any named input files.
- If Corridor is available in the host agent, run `analyzePlan` before file edits and apply its data-handling guidance.

## Inputs This Skill Handles

The user may provide:

- A raw human transcript file, such as `.../docs/05-26 ... transcript.txt`.
- A Claude Code or Cursor session log, such as `.../docs/session-2026-05-26.md`.
- A directory containing both files.
- Screenshots, browser comments, diagrams, PDFs, or links created during the session.
- A brief verbal note about what happened.

If the user only gives a directory, inventory it first with filenames, sizes, and likely roles. Do not recursively read unrelated folders. Confirm ambiguous files before using them.

## Path And HTML Safety

Source paths can point outside this repo, but they should be explicit user-provided paths or files discovered directly under an explicit user-provided directory. Avoid broad recursive searches across the home directory.

When converting source material into HTML:

- Paraphrase raw content into concise summaries.
- Escape all user/source-derived strings before putting them into HTML.
- Do not paste raw Markdown from logs directly into HTML.
- Avoid inline event handlers, scripts, or unsanitized HTML fragments.
- Validate links and image paths after editing.

## Workflow

1. **Orient**
   - Run `pwd`, `git status --short`, and inspect the repo guidance.
   - Identify the session date from filenames, transcript headers, or the user's note. If dates disagree, prefer the date the session happened, not today's date.
   - Identify whether there is already a `sessions/<YYYY-MM-DD>.html` page or `sessions/<YYYY-MM-DD>/` source folder.

2. **Inventory Inputs**
   - For each file, capture path, size, line count, and likely role.
   - Read enough content to understand structure and themes. For long logs, sample the start/end and use searches for headings, commands, tool calls, decisions, blockers, and final summaries.
   - Keep terminal output clean: summarize contents instead of printing raw transcript sections.

3. **Synthesize The Session Brief**
   Produce a private working brief with these fields:
   - session date and title,
   - what was built or changed,
   - what was taught,
   - AI coding agent workflows demonstrated,
   - infrastructure/GitHub/Vercel/environment-variable concepts covered,
   - decisions made,
   - unfinished work,
   - next-session checklist items,
   - resources or infographics that should exist.

4. **Decide Whether Visual Resources Are Needed**
   Use `references/infographic-decision-guide.md`.
   - If the session introduced a reusable mental model, workflow, deployment path, local-vs-remote distinction, data-flow/security concept, or repeated confusion point, propose an infographic.
   - If creating one now, use the global `canvas-design` skill at `/Users/jakerains/.agents/skills/canvas-design/SKILL.md`.
   - Put generated visual files under `assets/infographics/`.
   - Add a concise card/link in the Infographics section or resource index.

5. **Create Or Update The Session Page**
   - Use the existing visual language from nearby `sessions/*.html` pages.
   - Public page sections should usually include:
     - session title/date,
     - what we built,
     - what we practiced,
     - mental models covered,
     - artifacts/resources,
     - open loops,
     - next session.
   - From inside `sessions/`, shared assets use `../assets/...`; project artifacts use `../projects/...`.

6. **Update The Project Page**
   - Update `index.html` newest-first in the Sessions list.
   - Move the latest marker/class to the new session card.
   - Add links for related artifacts in the card's `.session-inside` area.
   - Update the top learning tracker and resources if the source material changes what Jake should cover next.

7. **Handle Source Materials**
   - By default, do not copy raw transcripts or raw Claude Code logs into this repo.
   - If the user explicitly wants source material stored here, put it under `sessions/<YYYY-MM-DD>/raw-transcript/` or `sessions/<YYYY-MM-DD>/claude-code-transcript/`.
   - Those raw-source folders are gitignored by default. Force-add only sanitized material after the user confirms it is safe to publish.

8. **Verify**
   - Run an HTML parse/check on changed `.html` files.
   - Check local image/link paths referenced by the new page and `index.html`.
   - Open or screenshot the local page when practical.
   - Run `git diff --check` and `git status --short`.
   - In the final response, list created/updated files and call out any raw materials intentionally left uncommitted.

## Output Shape

When the workflow is complete, the final answer should be short and concrete:

- New session page path.
- Updated project page path.
- Any new infographic/resource paths.
- Verification performed.
- Any raw source files that were used but not committed/copied.

## Reference Files

- `references/infographic-decision-guide.md` - when and how to turn a lesson concept into a canvas-design resource.
- `references/session-page-contract.md` - page structure, safety checks, and update checklist.
- `evals/evals.json` - lightweight example prompts for future testing.
