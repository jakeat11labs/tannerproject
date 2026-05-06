# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Turns timestamped two-speaker interview transcripts into one combined MP3 using ElevenLabs. Each speaker gets a distinct voice. Default mode is segment + `eleven_v4`. See `samples/` for pre-rendered output.

## Where to look for guidance

This repo ships two project-local skills under `.claude/skills/`. **Load the relevant one** before answering — don't try to reconstruct workflows from this file.

| User intent | Load |
| --- | --- |
| Set up the project, generate audio, debug a generation issue, pick voices, write expressive lines, troubleshoot anything operational | `.claude/skills/tannerproject/SKILL.md` |
| "How does this work?", "Why did we do X?", "Explain Y", "Teach me Z", learning Claude Code, learning AI-assisted dev | `.claude/skills/tutor-mode/SKILL.md` |

If both could apply, default to `tannerproject` for "how do I do X with this project" and `tutor-mode` for "how does X work." When in doubt, ask the user.

## Architecture (always-relevant facts)

Six files in `src/`:

- **`parse.js`** — `parseTranscript(text)`. Regex matches `[hh:mm:ss] Speaker: text`. Continuation lines (no timestamp) fold into previous segment.
- **`polish.js`** — `polishClip(in, out)`. ffmpeg silence-trim + loudnorm to -16 LUFS + 192k bitrate. Used by both modes.
- **`tts.js`** — segment mode TTS via `/v1/text-to-speech`. Cache key: `sha256(voiceId|model|voiceSettings|POLISH_VERSION|text)`. Default model `eleven_v4`, override via `ELEVEN_MODEL_ID`.
- **`dialogue.js`** — dialogue mode via `/v1/text-to-dialogue`. Hard-pinned to `eleven_v3` (endpoint requirement). Chunks segments to ≤1900 chars per request.
- **`assemble.js`** — ffmpeg concat list with silence padding (250 ms same-speaker, 500 ms speaker switch in segment mode; 500 ms between dialogue chunks).
- **`index.js`** — CLI orchestrator. `--mode segment|dialogue|auto` (default: segment). Auto-fallback logic in `isV3AccessError()`.

## Locked design decisions

- **Transcript format**: plain `[hh:mm:ss] Speaker: text…`. Continuation lines fold into previous segment. Speaker names case-sensitive, must match `voices.config.json` keys exactly.
- **Timing**: back-to-back natural pacing. Source timestamps are informational only — output uses fixed gap rules.
- **Stack**: Node ≥ 20 (ESM, `"type": "module"`), `@elevenlabs/elevenlabs-js`, `dotenv`, ffmpeg via raw `child_process.spawn`.
- **Default model**: `eleven_v4` for segment mode (override with `ELEVEN_MODEL_ID`). Dialogue mode is pinned to `eleven_v3`. See `tannerproject/references/modes.md` for the full tradeoff table.
- **Cache layout**: `.cache/segments/` (per-line, segment mode), `.cache/dialogue/` (per-chunk, dialogue mode), `.cache/silence_*.mp3` (shared). Bumping `POLISH_VERSION` in `src/polish.js` invalidates everything.
- **Output**: 192 kbps stereo MP3 at 44.1 kHz at `out/<basename>.mp3`.

## What lives where

- `src/` — source (six files, ~500 lines total)
- `transcripts/` — input `.txt` files (sample + cs-interview-example committed)
- `samples/` — pre-rendered MP3s (A: dialogue+v3, B: segment+v3, C: segment+v4)
- `voices.config.json` — gitignored speaker→voice map (template at `voices.config.example.json`)
- `out/`, `.cache/` — gitignored
- `TAGS.md` — Eleven v3 audio-tag canonical reference
- `CONVERSATION.md` / `CONVERSATION-RAW.md` — narrative + verbatim of how this project was built
- `docs/RESEARCH-NATURAL-AUDIO.md` — research notes on multi-voice TTS
- `.claude/skills/tannerproject/` — operational walkthrough skill
- `.claude/skills/tutor-mode/` — learning/case-study skill

## Universal safety rules (always in context)

- **Never commit `.env` or `voices.config.json`.** Both gitignored. Run `git status` before staging.
- **Never paste interview content into commits, MEMORY.md, or other persistent locations.** Treat transcripts as private even after sanitization.
- **Never `cat .env` or transcript content into terminal output during screen-share.** Summarize counts and shapes, not content.
- **Never modify these files without intent:** `.gitignore` should keep secrets out; deleting entries can leak. `voices.config.example.json` is a public template — don't put real IDs in it.

## User context

Jake (the project owner) and Tanner (the friend learning) are ElevenLabs employees with unlimited API usage. **Don't gate or prompt for confirmation based on transcript length or cost.** Just run.

Tanner is new to development and Claude Code. Lean toward warmth, plain language, and one-step-at-a-time guidance — see `.claude/skills/tannerproject/SKILL.md` for the operational walkthrough script and `.claude/skills/tutor-mode/SKILL.md` for tutor-mode behavior.
