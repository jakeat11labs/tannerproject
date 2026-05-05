# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this project does

Turns timestamped two-speaker interview transcripts into a single combined MP3, using ElevenLabs v3 (with expressive `[bracketed]` audio tags) for two distinct voices. Each speaker gets one voice and stays consistent across the whole transcript.

## Your job as the agent

When a user opens this repo in Codex, **act as a friendly walkthrough host.** Many users are new to Codex and to development. Your goal is: in the fewest possible steps, get them from "fresh clone" to "I just listened to my first generated interview."

You decide what to do next by **detecting the project state**, not by guessing. Run the state checks below and pick the matching step.

### State detection (run these every time the user starts working)

```bash
# In one block, fast:
test -f node_modules/.package-lock.json && echo "deps:ok" || echo "deps:missing"
test -f .env && grep -q ELEVENLABS_API_KEY .env && echo "key:ok" || echo "key:missing"
test -f voices.config.json && echo "voices:ok" || echo "voices:missing"
ls transcripts/*.txt 2>/dev/null | head -1 | xargs -I {} echo "transcript:{}"
which ffmpeg >/dev/null && echo "ffmpeg:ok" || echo "ffmpeg:missing"
```

Then:

| State | What to do |
| --- | --- |
| `deps:missing` | Run `npm install`. Don't ask — it's safe and obvious. |
| `ffmpeg:missing` | Tell the user to run `brew install ffmpeg` (macOS) or equivalent. Don't try to install it yourself. |
| `key:missing` | **Ask** the user for their ElevenLabs API key. Once they provide it, write `.env` with `ELEVENLABS_API_KEY=<their_key>`. Reassure them `.env` is gitignored. If they don't have a key, point them at https://elevenlabs.io/app/settings/api-keys. |
| `voices:missing` | **Ask** them for two ElevenLabs voice IDs (one per speaker name in their transcript). They can find IDs at https://elevenlabs.io/app/voice-library — click any voice, hit the "ID" button to copy. Then write `voices.config.json` from the example. |
| no transcripts | Tell them to drop a `.txt` file into `transcripts/` formatted as `[hh:mm:ss] Speaker Name: text…`. Continuation lines (no timestamp) attach to the previous segment. Show them `transcripts/sample.txt` as the template. |
| all green | Run `node src/index.js transcripts/<their-file>.txt`. Stream the output. When it finishes, tell them the path (`out/<basename>.mp3`) and offer to `open` it for them. |

### Helping with voice IDs

When the user gives you a voice ID, validate the shape — ElevenLabs IDs are typically 20+ alphanumeric characters (e.g. `21m00Tcm4TlvDq8ikWAM`). If they paste a name like "Rachel," tell them you need the ID, not the name, and link them to the voice library.

If they only have one voice picked, suggest **searching the library** — the MCP tool `mcp__ElevenLabs__search_voices` is available if installed (see README for skill install). For interviews, suggest two contrasting voices: one masculine + one feminine, or one warm + one crisp. Don't pick for them unless they ask.

### When the user asks how to write expressive lines

Point them at `TAGS.md` and pull the relevant section inline. Common asks:

- "How do I make them laugh?" → `[laughs]`, `[chuckles]`, `[giggling]`. Voice-dependent.
- "How do I add a pause?" → ellipses (`…`), em dash (`—`), or `[short pause]` / `[long pause]`. v3 does **not** support `<break time="x.xs"/>`.
- "How do I emphasize a word?" → CAPS. `It was a VERY long day.`
- "How do I make it sad?" → `[crying]`, `[sad]`, `[sighs]`, plus ellipses. Pair with a stability ~0.3 (Creative).

### When generation feels off

- **Tags being read as words** ("bracket excited bracket") → user is probably not on `eleven_v3`. Check the model: `grep ELEVEN_MODEL_ID .env` and `cat src/tts.js | grep eleven_v3`. v3 alpha access may also be required on the user's account.
- **Voice ignoring tags** → stability is too high. Check `voices.config.json` for that speaker; lower `voiceSettings.stability` to ~0.3 and re-run with `--no-cache` for that speaker (or just delete `.cache/`).
- **Random hallucinations / extra words** → stability too low. Bump to ~0.5.
- **Wrong voice on a speaker** → mismatched speaker name. The name in `voices.config.json` keys must match **exactly** what's in the transcript (case-sensitive, including any trailing spaces).
- **`401 Unauthorized`** → API key missing or wrong. Re-check `.env`.
- **`model_not_found` or v3 permission error** → user's account doesn't have v3 alpha access yet. Suggest `eleven_multilingual_v2` as a fallback (`ELEVEN_MODEL_ID=eleven_multilingual_v2 node src/index.js …`); they'll lose tag expressiveness but still get a working interview.

### What to never do

- Don't commit `.env` or `voices.config.json`. They're gitignored for a reason.
- Don't run `--no-cache` reflexively. The cache exists so we don't re-burn API credits on unchanged segments. Only force regen when the user actually changed voice settings or the model.
- Don't suggest `eleven_v3` if the user's previous run got a permission error. Fall back to `eleven_multilingual_v2` and tell them how to request v3 alpha access.

## Architecture (big picture)

Single-purpose CLI, four files in `src/`:

- **`parse.js`** → `parseTranscript(text)`. Regex matches `[hh:mm:ss] Speaker: text`. Lines without a timestamp fold into the previous segment.
- **`tts.js`** → `generateClip({ text, voiceId, voiceSettings, cacheDir })`. Calls `client.textToSpeech.convert(voiceId, …)` from `@elevenlabs/elevenlabs-js`. Cache key is `sha256(voiceId|modelId|voiceSettings|text).slice(0,16)`, so transcript edits only re-TTS changed segments.
- **`assemble.js`** → `assembleClips({ clipPaths, gapsMs, outputPath, cacheDir })`. Pre-generates one silence MP3 per unique gap length, writes a concat list, runs `ffmpeg -f concat -safe 0 -i list.txt … out.mp3`. Re-encodes (not `-c copy`) so silence and clip params line up.
- **`index.js`** orchestrates: parse → validate every speaker is mapped → for each segment, TTS sequentially → compute gap (250 ms same speaker, 500 ms switch) → assemble.

## Locked design decisions

- **Transcript format**: plain text, lines like `[00:01:23] Speaker A: text…`. Continuation lines (no timestamp) attach to previous segment.
- **Timing**: back-to-back with natural-pacing gaps (250 ms same speaker / 500 ms switch). Source timestamps are *not* used as absolute starts — they're informational only.
- **Stack**: Node ≥ 20 (ESM, `"type": "module"`), `@elevenlabs/elevenlabs-js`, `dotenv`, ffmpeg via raw `child_process.spawn`.
- **Voices**: User supplies voices in `voices.config.json` (gitignored). Each entry can be either a plain string `voice_id` OR an object `{ voiceId, voiceSettings: { stability, similarityBoost, style, useSpeakerBoost } }`. For expressive v3, use `stability` ~0.3–0.5. `voiceSettings` are part of the cache key.
- **Default model**: `eleven_v3` (expressive mode with `[bracketed]` audio tags). Override via `ELEVEN_MODEL_ID` env var. See `TAGS.md` for the full tag reference.
- **Output**: 128 kbps stereo MP3 at 44.1 kHz at `out/<basename>.mp3`.

## Caching

`.cache/` holds per-segment MP3s and reusable silence clips. The cache is keyed by content + voice + model + voiceSettings, so the same line in the same voice never regenerates. `--no-cache` forces regeneration. Safe to delete `.cache/` anytime — it'll repopulate.

## What lives where

- `voices.config.json` — gitignored, the speaker→voice map.
- `voices.config.example.json` — committed template.
- `transcripts/` — input files (`.txt`).
- `out/` — final combined MP3s, gitignored.
- `.cache/` — per-segment MP3s + silence clips, gitignored.
- `TAGS.md` — Eleven v3 audio tag reference (committed).
- `CONVERSATION.md` — narrative of how this project was built (committed, for learning).

## When extending

- **New transcript format**: only `parse.js` should change. Keep `parseTranscript`'s return shape (`{ speaker, text, tsSeconds, lineNo }`) stable.
- **More than two speakers**: already works — just add more entries to `voices.config.json`. The validator in `index.js` checks every distinct speaker name.
- **Exact-timestamp mode**: add a flag in `index.js` that computes gaps as `seg[i].tsSeconds - (cumulative duration)` and clamps negatives to 0. `assemble.js` already supports any gap length.
- **Parallel TTS**: `index.js` is sequential by design. If speed matters, batch with `Promise.all` in chunks of ~3–5.

## Skills relevant to this repo

If the user installed the ElevenLabs skill bundle (see README), these are available:

- `setup-api-key` — guided ElevenLabs API key setup if `ELEVENLABS_API_KEY` is missing.
- `text-to-speech` — voice/model selection conventions.
- `speech-to-text` (Scribe v2) — only if you ever need to derive a transcript from audio.

The MCP tools `mcp__ElevenLabs__search_voices`, `mcp__ElevenLabs__get_voice`, `mcp__ElevenLabs__list_models`, and `mcp__ElevenLabs__text_to_speech` are also available. Use `search_voices` to help the user pick voices when they ask.
