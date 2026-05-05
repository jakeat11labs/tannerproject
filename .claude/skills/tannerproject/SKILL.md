---
name: tannerproject
description: |
  Operational walkthrough for the Tannerproject (transcript → two-voice interview audio via ElevenLabs). Use this skill whenever the user wants to set up the project, generate audio from a transcript, debug a generation issue, pick voices, write expressive lines, or do anything operational with this repo. Triggers on: "set me up", "walk me through", "how do I run this", "generate audio", "this isn't working", "pick voices", "what mode should I use", "the audio sounds wrong", or any natural request to use the project. Pulls in detailed playbooks from references/ on demand. Always load this skill before answering questions about how to use this specific repo — don't try to reconstruct the setup flow from memory.
---

# Tannerproject — Operational Walkthrough

You're driving the user through using the Tannerproject (transcript → two-voice interview audio). Be warm, brief, and one-step-at-a-time. The user may be new to development. Don't dump information — ask one question, wait for the answer, take the next step.

## Step 0: State detection (run silently first)

Before saying anything to the user, run this in one block to know where they are:

```bash
test -f node_modules/.package-lock.json && echo "deps:ok" || echo "deps:missing"
test -f .env && grep -q ELEVENLABS_API_KEY .env && echo "key:ok" || echo "key:missing"
test -f voices.config.json && echo "voices:ok" || echo "voices:missing"
ls transcripts/*.txt 2>/dev/null | wc -l | xargs -I {} echo "transcripts:{}"
which ffmpeg >/dev/null && echo "ffmpeg:ok" || echo "ffmpeg:missing"
```

## Step 1: Greet based on state

Open with a warm one-liner showing checkmarks/X's so the user knows where they stand. Then ask one question.

> "Hey — here's where you are. ✅ deps installed, ✅ ffmpeg, ❌ API key not set, ❌ no voice config. Want me to walk you through the two missing pieces? Should take ~3 minutes."

Adjust to reality. Keep it brief. Don't preach. **Then ask one specific question** — usually "shall I help with the API key first?" — and proceed from their answer.

## Step 2: Drive what's missing

Pick up the first missing item and walk through it. One at a time:

| State | What to do |
| --- | --- |
| `deps:missing` | Run `npm install` directly. Don't ask — it's safe and obvious. |
| `ffmpeg:missing` | Tell them to run `brew install ffmpeg` (macOS) and rerun. Don't try to install ffmpeg yourself. |
| `key:missing` | Ask for their ElevenLabs API key. Once they paste it, write `.env` with `ELEVENLABS_API_KEY=<their_key>`. Reassure them `.env` is gitignored. If they don't have a key, link https://elevenlabs.io/app/settings/api-keys . |
| `voices:missing` | Ask for two voice IDs (one per speaker name in the transcript they want to run). They can find IDs at https://elevenlabs.io/app/voice-library — click any voice → click the **ID** button to copy. If they want help picking, see `references/voices.md`. |
| no transcripts | Tell them to drop a `.txt` file into `transcripts/` formatted as `[hh:mm:ss] Speaker Name: text…`. Show `transcripts/sample.txt` or `transcripts/cs-interview-example.txt` as templates. Continuation lines (no timestamp) attach to the previous segment. |
| all green | Run the generation. See "Step 3" below. |

## Step 3: Generate

Default command:

```bash
node src/index.js transcripts/<file>.txt
```

This uses **segment mode + `eleven_v4`** (the project default — the recommended path). Pre-rendered samples in `samples/` show what this sounds like.

For longer transcripts (30+ segments), give a one-line heads-up about wall-clock time before running, but **don't gate or ask for confirmation** — the user has unlimited credits and just wants to hear the result. See `references/modes.md` for when/why to use other modes.

After generation, offer to `open out/<basename>.mp3`.

## Step 4: Iterate

If they don't like the output:

- **First instinct:** offer to re-run the same script 2-3 times. v4 inflection varies between generations — same input gives noticeably different reads. Often a different take fixes it without changing tags.
- **If voice choice is wrong** for a tone they want: load `references/voices.md` for guidance on picking via `mcp__ElevenLabs__search_voices` or previewing.
- **If tags aren't landing** how they want: point at `TAGS.md` (top-level reference doc, not in this skill) for the canonical tag list, plus `references/troubleshooting.md` for stability/model issues.
- **For long transcripts**: suggest the "narrow to 2-min snippet" pattern — clip a representative slice, iterate on it, then run the full thing.

## When to load each reference

| Topic | Load |
| --- | --- |
| What this project is and where it fits in Tanner's bigger pipeline | `references/workflow.md` |
| Modes (segment vs dialogue vs auto), model choice, the v4/v3/v4_hq tradeoff | `references/modes.md` |
| Voice picking, ID validation, MCP voice search, previewing | `references/voices.md` |
| Transcript format gotchas, parser edge cases, format conversion | `references/transcripts.md` |
| Generation failures, audio quality issues, debugging | `references/troubleshooting.md` |

## What to never do

- **Don't commit `.env` or `voices.config.json`.** Both are gitignored. Always `git status` before staging.
- **Don't paste interview content into commit messages, MEMORY.md, or other persistent places.** Treat transcripts as private even after sanitization.
- **Don't `cat` the transcript or `.env` into terminal output if the user might be screen-sharing.** Summarize counts and shapes, not content.
- **Don't run `--no-cache` reflexively.** Re-runs are nearly instant via cache. Force regen only when the user changed voice settings, model, or wants a different take.
- **Don't auto-pick voices.** Casting matters. The user's choice is part of the creative work.
- **Don't volunteer dialogue mode** unless the user describes a specific need that benefits from cross-speaker prosody (laugh-on-laugh, interruptions). Default is segment + v4 for a reason.
