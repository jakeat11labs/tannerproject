# How this project was built — a guided tour

This isn't a textbook chapter. It's a walkthrough of how someone goes from "I have an idea" to "working tool that's good enough to ship to a friend" using Claude Code. Read in order, but skip around if a section interests you more than another.

The full receipts are in `CONVERSATION.md` (narrative) and `CONVERSATION-RAW.md` (verbatim) at the repo root. This file is the curated lessons-learned version.

---

## Phase 1: Starting with intent, not code

Jake opened a brand-new empty directory and ran `/init` (Claude Code's built-in slash command for setting up a project's `CLAUDE.md`) with a custom one-paragraph prompt explaining the goal:

> "I have transcripts that have timestamps of a conversation between two people doing an interview. I want to use ElevenLabs to generate two different voices, time it out, and combine into one audio file."

That's the entire project specification at this point. No code, no architecture, no library choices. **Just intent.**

**The lesson:** Start with the goal stated as if you were explaining it to a coworker. Don't try to design the system upfront. Don't mention "Node.js" or "ffmpeg" until you actually have a reason to.

## Phase 2: Plan mode + clarifying questions

Next, Jake hit **Shift+Tab** to enter plan mode (more on plan mode in `claude-code-basics.md`). In plan mode, Claude can explore and ask questions, but **can't modify any files** until the plan is approved. This forces a "think before code" rhythm.

Claude noticed the directory was empty (no codebase to understand) and immediately asked four clarifying questions in one batch:

1. What format are the transcripts in? (plain text / SRT / VTT / "I'll share a sample")
2. How should generated audio honor timestamps? (back-to-back / exact timestamps with silence / stretch to fit)
3. Which language/stack? (Python / Node / Bash)
4. How should voices be picked? (you provide IDs / pick stock voices / search library)

Jake's answers locked four major design decisions before any code was written:
- Plain text with `[hh:mm:ss]` tags
- Back-to-back natural pacing
- Node.js + ffmpeg
- Jake provides voice IDs

**The lesson:** When the goal is ambiguous, the AI should ask first, not guess. The four questions saved hours of "oh wait, that's not what I meant" later. If your first prompt to Claude doesn't include the answers to the obvious clarifying questions, expect plan mode to ask them.

## Phase 3: The plan + the build

With decisions locked, Claude wrote a plan to a file (Claude Code names plan files things like `so-let-s-go-ahead-starry-narwhal.md` — random animal names, kind of charming). The plan included:

- File layout (`src/parse.js`, `src/tts.js`, `src/assemble.js`, `src/index.js`)
- Function signatures for each module
- Dependencies (`@elevenlabs/elevenlabs-js`, `dotenv`, ffmpeg via raw `child_process.spawn`)
- A caching scheme using SHA-256 hashes
- The ffmpeg assembly approach
- Verification steps

Jake approved the plan and the build started. Claude implemented file by file, writing the parser first (smallest piece), then sanity-checking it on the sample transcript before moving on.

**The lesson:** Each step verifies the previous step. After writing the parser, Claude ran a one-line script to confirm it parsed the sample correctly. That one-line check would have caught any number of bugs before they compounded into "the whole pipeline doesn't work and I don't know why."

## Phase 4: A small task taught a research lesson

A few exchanges later, Jake said: "I want to use v3 with expressive mode, can you research the [tags] they use?"

Claude tried `WebFetch` on the ElevenLabs docs URL — got a 404 (the URL had moved). Tried a search to find the right URL — got better URLs. Tried `WebFetch` on the new URLs — got blocked by bot detection. Tried `firecrawl` (a different tool that uses a real browser to render JS-heavy doc sites) — succeeded, got the full official tag reference.

**The lesson:** When research fails, switch tools. There are usually three or four ways to get a piece of information; don't keep banging on the one that didn't work. `firecrawl` for JS-rendered pages, `WebSearch` for finding URLs, raw `curl` for direct API calls, GitHub raw URLs for source code, MCP tools for authenticated services — each has a niche.

## Phase 5: Asking the API what it can do

Later, Jake had a hunch: "I might have access to test models." Instead of guessing, Claude `curl`'d the ElevenLabs `/v1/models` endpoint with Jake's API key:

```bash
curl -sH "xi-api-key: $KEY" https://api.elevenlabs.io/v1/models
```

The response listed 14 models — including `eleven_v4` and `eleven_v4_hq`, which weren't in the public docs at the time. Two models the project hadn't even known about, sitting right there for the asking.

**The lesson:** When you're integrating with an API, **ask the API what it can do**. List endpoints (`/v1/models`, `/v1/voices`, `/v1/<resource>`) almost always exist. Read them before you read marketing docs.

## Phase 6: A/B testing instead of arguing

After learning v4 existed, Claude proposed building a "dialogue mode" that uses ElevenLabs's `/text-to-dialogue` endpoint for whole-conversation generation (vs. the per-line stitching the project did originally). Open question: was dialogue mode actually better?

Instead of debating in theory, Claude generated three versions of the same transcript:
- A: dialogue mode (v3)
- B: segment mode (v3) — the original
- C: segment mode (v4) — the newly-discovered model

Jake listened to all three and decided: **segment + v4 sounds best.** Done. The project's default flipped to segment + v4.

**The lesson:** With AI-generated content, **listen first, theorize second**. Theory says "dialogue mode handles cross-speaker prosody better." Reality says "v4 in segment mode is so good that the cross-speaker thing isn't worth the v3 lock-in." You only know which is true by listening to actual audio.

## Phase 7: From CLAUDE.md to skills

Toward the end, Jake noticed `CLAUDE.md` had grown to 200+ lines of operational guidance. Better idea: turn the operational stuff into a **skill** that lives inside the project. CLAUDE.md becomes thin and points at the skill. The skill loads only when relevant — saves context, keeps each piece focused.

That's what produced the two skills you're reading right now:
- `tannerproject` — operational walkthrough (loads when you want to use the project)
- `tutor-mode` — what you're in now (loads when you want to learn)

**The lesson:** When a CLAUDE.md gets fat, that's a signal it's mixing two concerns. Pull operational playbooks into a skill. CLAUDE.md should be facts the agent always needs in context (architecture, locked decisions, safety rules); skills are for everything that's "load this when the user does X."

## What patterns showed up over and over

1. **Clarify intent before coding.** Plan mode + 4 clarifying questions saved the project from being designed wrong.
2. **Verify each step before moving on.** Tiny tests beat big debugging sessions.
3. **Switch tools when one fails.** WebFetch → firecrawl. Native SDK → raw fetch. Theory → A/B test.
4. **Ask the API what it supports.** `/v1/models` told us about v4.
5. **Listen, don't theorize.** Audio quality decisions came from playing actual files, not reading specs.
6. **When something gets fat, split it.** 200-line CLAUDE.md → thin CLAUDE.md + skills.

That's the whole loop. It's not magic. It's not even particularly fancy. It's just doing the boring thing — clarify, plan, build, verify, iterate — but with an AI that does the heavy lifting on each step.

---

## Where to go next

- Want to see the actual session? `CONVERSATION-RAW.md` (verbatim) at the repo root.
- Want the curated narrative? `CONVERSATION.md` (also at repo root).
- Want to learn the Claude Code mechanics referenced above (plan mode, slash commands, etc.)? Load `claude-code-basics.md`.
- Want the dev patterns spelled out as guidance for your next project? Load `dev-patterns.md`.
