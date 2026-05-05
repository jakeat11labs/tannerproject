# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Turns timestamped two-speaker interview transcripts into a single combined MP3, using ElevenLabs v3 (with expressive `[bracketed]` audio tags) for two distinct voices. Each speaker gets one voice and stays consistent across the whole transcript.

## Where this fits in the user's bigger workflow

This repo is **Step 2** of an interviewer-training pipeline:

```
Real interview MP4 + transcript
        │
        ▼
[Step 1] PII sanitization  ──► (separate Claude skill the user already has)
        │
        ▼
sanitized transcript with timestamps
        │
        ▼
[Step 2] THIS PROJECT  ────► reenacted MP3 with two distinct voices
        │
        ▼
training material: what good vs. bad interviews sound like
```

Implications for you:

- **Always assume the input transcript is _supposed_ to be sanitized already.** If you see text that looks like it might be PII (real names that aren't speaker labels, company names, email addresses, phone numbers), gently ask the user: _"Heads up — I see what looks like PII in this transcript. Has it gone through your Step 1 sanitization? I don't want to bake real names into the audio."_ Don't refuse to run; just confirm.
- The user's eventual goal is generating training snippets ("five best moments / five worst moments"), not always full interviews. When you see a long transcript, expect they may want to clip it down before generating.

## Your first message when the user opens this repo

Run the state-detection block silently, then open with something like:

> "Hey — here's where you are. ✅ deps installed, ✅ ffmpeg available, ❌ API key not set, ❌ no voice config yet. Want me to walk you through the two missing pieces? (~3 minutes)"

Adjust the checkmarks/X's to match reality. Keep it warm and brief. Don't dump the whole table of states. Don't preach. **Then ask one question** — usually "shall I help with the API key first?" — and proceed from their answer.

## State detection

Run these checks every time the user starts working in the repo:

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
| `key:missing` | **Ask** for their ElevenLabs API key. Once provided, write `.env` with `ELEVENLABS_API_KEY=<their_key>`. Reassure them `.env` is gitignored. If they don't have a key, point them at https://elevenlabs.io/app/settings/api-keys. |
| `voices:missing` | **Ask** for two ElevenLabs voice IDs (one per speaker name in their transcript). They can find IDs at https://elevenlabs.io/app/voice-library — click any voice, hit the "ID" button to copy. Then write `voices.config.json` from the example. |
| no transcripts | Tell them to drop a `.txt` file into `transcripts/` formatted as `[hh:mm:ss] Speaker Name: text…`. Show them `transcripts/sample.txt` as the template. |
| all green | See "Pre-flight before generating" below. |

## Pre-flight before generating (cost / time gate)

Before kicking off `node src/index.js …`, parse the transcript yourself and report:

```bash
node -e "
import('./src/parse.js').then(async ({ parseTranscript }) => {
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(process.argv[1], 'utf8');
  const segs = parseTranscript(text);
  const totalChars = segs.reduce((n, s) => n + s.text.length, 0);
  const speakers = [...new Set(segs.map(s => s.speaker))];
  console.log(JSON.stringify({ segments: segs.length, totalChars, speakers }));
});
" transcripts/<file>.txt
```

Then choose a posture based on segment count:

| Segments | Posture |
| --- | --- |
| ≤ 10 | Just go. Mention it's a small batch and proceed. |
| 11–30 | Mention "this is N segments, ~X characters, should take ~Y seconds." Then proceed unless the user pauses you. |
| 30+ | **Stop and offer a dry-run.** "This is N segments. Want me to generate just the first 3-5 segments first so you can sanity-check voice quality and pacing before we burn credits on the full thing?" Wait for confirmation. |

Rough character→cost rule of thumb (varies by plan): 1 character ≈ 1 ElevenLabs credit. Don't quote exact dollar figures (plans differ); use credit/character counts and let the user judge.

If they decline the dry-run on a long transcript, run anyway — it's their call.

## Helping with voice IDs

When the user gives you a voice ID, validate the shape — ElevenLabs IDs are typically 20+ alphanumeric characters (e.g. `21m00Tcm4TlvDq8ikWAM`). If they paste a name like "Rachel," tell them you need the ID, not the name, and link them to the voice library.

If they say something like _"help me pick voices"_ or _"I want a curious-sounding masculine voice and a warm feminine one"_:

1. If `mcp__ElevenLabs__search_voices` is available (ElevenLabs skills installed), call it with their natural-language query (e.g. `"curious masculine"`). Show top 5 candidates with names and a short description.
2. If they want to preview, use `mcp__ElevenLabs__text_to_speech` to generate a 1-line sample with each candidate using a stock phrase. Save to `.cache/voice-preview/<voice_id>.mp3` so they can `open` it.
3. Once they pick two, write the IDs into `voices.config.json` for them.

Don't auto-pick voices unless they explicitly ask. Their casting choice matters.

## Modes (`--mode auto|dialogue|segment`)

The CLI ships three modes. Default is `auto`.

- **`segment`** — generates each line individually via `/v1/text-to-speech`, then concats. Per-segment `voiceSettings` honored. Finest-grained cache. **Defaults to `eleven_v4`** (newest expressive model, no alpha gate, tighter pacing than v3). Override via `ELEVEN_MODEL_ID` env var. **This is the project's recommended default path** — it sounds confident and natural without needing the dialogue endpoint.
- **`dialogue`** — sends each ≤1900-char chunk to `/v1/text-to-dialogue`. Generates the whole exchange as one coherent performance: real turn-taking, prosody matching, interruptions. Coarser cache (per chunk). **Hard-pinned to `eleven_v3`** — the dialogue endpoint requires v3 specifically; v4 is TTS-only. `ELEVEN_MODEL_ID` does not apply here.
- **`auto`** — try dialogue (v3) first, automatically fall back to segment (v4) if the dialogue endpoint returns a v3 access error (4xx / `model_not_found` / permission / alpha hints). Fallback is built into `src/index.js` (`isV3AccessError`). User sees a warning + the alpha-access link, then segment mode runs. **You don't need to handle this manually.**

When the user asks "which mode should I use?" — recommend `auto` (the default). Mention the trade-off: dialogue captures cross-speaker prosody (e.g. one laugh answering another) but the cache is per-chunk so iteration is slower; segment + v4 gives per-line voiceSettings and finest-grain caching with audio quality that's nearly as good in most cases.

If the user wants to **A/B compare**, suggest:

```bash
node src/index.js transcripts/<file>.txt --mode dialogue -o out/dialogue.mp3
node src/index.js transcripts/<file>.txt --mode segment  -o out/segment-v4.mp3
ELEVEN_MODEL_ID=eleven_v3 node src/index.js transcripts/<file>.txt --mode segment -o out/segment-v3.mp3
```

The repo ships three pre-rendered samples in `samples/` (A: dialogue+v3, B: segment+v3, C: segment+v4) generated from `transcripts/cs-interview-example.txt` so the user can listen first.

If the user already attempted dialogue mode and got a permission error in `auto`, **don't suggest re-trying dialogue on every subsequent run** — they need to request alpha access first. Default to `--mode segment` until they confirm access landed.

## Model selection (segment mode only)

Segment mode honors `ELEVEN_MODEL_ID`. Available models in order of preference for expressive interview content:

| Model | Default? | Notes |
| --- | --- | --- |
| `eleven_v4` | ✅ | Newest expressive model, supports all audio tags, tighter pacing. **Project default.** |
| `eleven_v4_hq` | | Higher-quality v4 variant. Slightly slower. Comparable in our testing. |
| `eleven_v3` | | Used by dialogue endpoint. Looser pacing than v4. |
| `eleven_multilingual_v2` | | Pre-v3. **Audio tags NOT supported** — brackets get read aloud. Last-resort fallback only. |

Per-account access varies. Use `mcp__ElevenLabs__list_models` (or `curl https://api.elevenlabs.io/v1/models -H "xi-api-key: $KEY"`) to confirm what's available on the user's account. v4 is generally available — no alpha gate.

## Testing patterns

When the user is unhappy with output, or when they show up with a long transcript and want to try things:

- **"Narrow to a 2-minute snippet first."** A 30-min interview iteration loop (tweak tag → wait 2 min for full regen → listen → tweak again) is awful. Suggest cutting a representative ~2-min slice (10-20 segments) into `transcripts/sample-snippet.txt`, iterating on voices and tags there until it sounds right, then running the full thing.
- **"Run the same script 2-3 times."** v3 inflection varies between generations. Same input can give noticeably different reads. Before recommending a tag change, suggest re-running with `--no-cache` to see if a different take fixes it. Save credits and frustration.
- **One change at a time.** Don't change voice + stability + tags + speaker name in one round. Change one knob, regenerate the affected segment(s), listen, then move to the next knob.

## When generation feels off

- **Tags being read aloud as words** ("bracket excited bracket") → user is on `eleven_multilingual_v2`, not `eleven_v3`. Check `grep ELEVEN_MODEL_ID .env` and the model in `src/tts.js`. See the auto-fallback section above.
- **Voice ignoring tags** → stability too high. Check `voices.config.json` for that speaker; lower `voiceSettings.stability` to ~0.3 and re-run with `--no-cache` for that segment (or delete `.cache/`).
- **Random hallucinations / extra words** → stability too low. Bump to ~0.5.
- **Wrong voice on a speaker** → mismatched speaker name. The name in `voices.config.json` keys must match the transcript exactly (case-sensitive, including any trailing spaces). Print both and diff.
- **`401 Unauthorized`** → API key missing or wrong. Re-check `.env` and that the key has TTS + Voices: read scopes.
- **`model_not_found` / 403** → see "Auto-fallback" above.

## Transcript-format gotchas

The parser regex expects `^\s*\[(\d{1,2}):(\d{2}):(\d{2})\]\s*([^:]+?):\s*(.*)$`. If parsing fails, identify the line that broke and recognize one of the common variants:

| Variant they pasted | Fix |
| --- | --- |
| `Speaker A: [00:00:00] text…` | Timestamp/speaker order swapped. Offer to reformat the file or to adjust the regex in `parse.js`. |
| `00:00:00 Speaker A: text…` | Missing brackets. Same fix. |
| `[00:00] Speaker A: text…` | `mm:ss` not `hh:mm:ss`. Either pad with `00:` prefix or relax the regex. |
| `Speaker A (00:00:00): text…` | Parens around time, after speaker. Bigger reformat. |
| `1\n00:00:00,000 --> 00:00:03,500\nSpeaker A: text` | This is SRT. Suggest converting to plain `[hh:mm:ss] Speaker: text` — there are one-liner shell scripts for this; offer to write one. |

When the parser throws, paste the offending line back to the user, identify the pattern, and **ask** which fix they prefer before writing changes.

## Claude Code keyboard shortcuts to surface

When the user asks "how do I…":

- _"…undo what you just did?"_ → **Esc Esc** (escape twice) opens the message history; click any earlier message to revert all changes back to that point.
- _"…make you think before doing big things?"_ → **Shift+Tab** cycles modes; pick **plan mode** and Claude will draft a full plan, then wait for approval before touching files.
- _"…clear the conversation and start fresh?"_ → `/clear`.
- _"…what slash commands exist?"_ → `/help` lists them.
- _"…reference a file in my message?"_ → type `@` and a file picker appears.

## What to never do

- **Don't commit `.env` or `voices.config.json`.** They're gitignored. If you ever propose `git add -A`, run `git status` first and visually confirm those files aren't appearing.
- **Don't paste interview content into commit messages, PR descriptions, or any persistent file** (including `MEMORY.md` or any docs). Even if the transcript looks sanitized, treat it as private. Commit messages describe the change, not the content.
- **Don't `cat` the transcript or `.env` into terminal output if the user might be screen-sharing.** When in doubt, summarize counts and shapes ("transcript has 47 segments across 2 speakers") rather than dumping the text.
- **Don't run `--no-cache` reflexively.** The cache exists so we don't re-burn credits on unchanged segments. Only force regen when the user actually changed voice settings, the model, or wants a different take of the same line.
- **Don't auto-pick voices** unless explicitly asked. Casting matters; the user's choice is part of the creative work.
- **Don't write to MEMORY.md** about specific transcript content, voice IDs paired to people, or any project specifics that include PII. General preferences only.

## Writing expressive lines (audio tags)

See **`TAGS.md`** for the full v3 audio-tag reference, including:

- Categorized tag list ([laughs], [whispers], [thoughtful], etc.)
- Placement and combination rules
- Stability cheatsheet for expressive output
- Vibe → tag-combo cheatsheet for interview moods
- "Don't do this" patterns ([grinning], `<break time="x.xs"/>`, etc.)

Always pull guidance from `TAGS.md` rather than reciting tags from memory — the canonical list updates there, not here.

## Architecture (big picture)

Single-purpose CLI, six files in `src/`:

- **`parse.js`** → `parseTranscript(text)`. Regex matches `[hh:mm:ss] Speaker: text`. Lines without a timestamp fold into the previous segment.
- **`polish.js`** → `polishClip(inputPath, outputPath)`. ffmpeg filter chain: silence-trim both ends + loudnorm to -16 LUFS + 192k bitrate. Used by both modes.
- **`tts.js`** → `generateClip({ text, voiceId, voiceSettings, cacheDir })`. Calls `client.textToSpeech.convert(voiceId, …)` from `@elevenlabs/elevenlabs-js`. Caches polished clips. Cache key is `sha256(voiceId|modelId|voiceSettings|POLISH_VERSION|text).slice(0,16)`. **Used in segment mode.**
- **`dialogue.js`** → `runDialogueMode({ segments, voiceMap, cacheDir, noCache, seed })`. Chunks segments to ≤1900 chars, POSTs each chunk's `inputs[]` to `/v1/text-to-dialogue` via fetch, polishes the chunk audio, caches by chunk hash. **Used in dialogue mode.**
- **`assemble.js`** → `assembleClips({ clipPaths, gapsMs, outputPath, cacheDir })`. Pre-generates silence clips, writes a concat list, runs `ffmpeg -f concat …`. Re-encodes so silence and clip params line up. Output bitrate 192k.
- **`index.js`** orchestrates: parse → validate every speaker is mapped → run chosen mode → assemble. In `auto` mode, tries dialogue then falls back to segment via `isV3AccessError(err)` detection.

## Locked design decisions

- **Transcript format**: plain text, lines like `[00:01:23] Speaker A: text…`. Continuation lines (no timestamp) attach to previous segment.
- **Timing**: back-to-back with natural-pacing gaps (250 ms same speaker / 500 ms switch). Source timestamps are *not* used as absolute starts.
- **Stack**: Node ≥ 20 (ESM, `"type": "module"`), `@elevenlabs/elevenlabs-js`, `dotenv`, ffmpeg via raw `child_process.spawn`.
- **Voices**: each entry in `voices.config.json` is either a plain string `voice_id` OR `{ voiceId, voiceSettings: { stability, similarityBoost, style, useSpeakerBoost } }`. For expressive v3, use `stability` ~0.3–0.5. `voiceSettings` are part of the cache key.
- **Default model**: `eleven_v4` for segment mode (override via `ELEVEN_MODEL_ID`). Dialogue mode is hard-pinned to `eleven_v3` (endpoint requirement). See "Model selection" above for tradeoffs.
- **Output**: 128 kbps stereo MP3 at 44.1 kHz at `out/<basename>.mp3`.

## Caching

`.cache/` holds two cache directories plus shared silence clips:

- `.cache/segments/` — segment-mode clips, one MP3 per `(voice + model + settings + text)` hash. Edit one line → only that line re-generates.
- `.cache/dialogue/` — dialogue-mode chunks, one MP3 per `(inputs[] + model + seed + polish version)` hash. Edit one line in a chunk → that whole chunk re-generates (~10-15 segments at once).
- `.cache/silence_*.mp3` — pre-generated silence clips, shared by both modes.

All clips are polished (silence trimmed + loudness normalized to -16 LUFS) before caching. The `POLISH_VERSION` constant in `src/polish.js` is part of every cache key, so bumping it invalidates all caches simultaneously.

`--no-cache` forces regeneration. Safe to delete `.cache/` anytime — it'll repopulate.

## What lives where

- `voices.config.json` — gitignored, the speaker→voice map.
- `voices.config.example.json` — committed template.
- `transcripts/` — input files (`.txt`).
- `out/` — final combined MP3s, gitignored.
- `.cache/` — per-segment MP3s + silence clips, gitignored.
- `samples/` — three pre-rendered sample MP3s (A/B/C from the cs-interview-example) committed to the repo so users can listen before running anything.
- `TAGS.md` — Eleven v3 audio tag reference (committed).
- `CONVERSATION.md` / `CONVERSATION-RAW.md` — narrative + verbatim of how this project was built.
- `docs/RESEARCH-NATURAL-AUDIO.md` — research on how other projects do multi-voice TTS and why dialogue mode is the natural-sound win.

## When extending

- **New transcript format**: only `parse.js` should change. Keep `parseTranscript`'s return shape (`{ speaker, text, tsSeconds, lineNo }`) stable.
- **More than two speakers**: already works — just add more entries to `voices.config.json`. The validator checks every distinct speaker name.
- **Exact-timestamp mode**: add a flag in `index.js` that computes gaps as `seg[i].tsSeconds - cumulativeDuration` and clamps negatives to 0. `assemble.js` already supports any gap length.
- **Parallel TTS**: `index.js` is sequential by design. If speed matters on long transcripts, batch with `Promise.all` in chunks of 3–5 — but warn about rate limits first.

## Skills relevant to this repo

If the user installed the ElevenLabs skill bundle (`npx skills add https://github.com/elevenlabs/skills` — see README), these are available:

- `setup-api-key` — guided ElevenLabs API key setup if `ELEVENLABS_API_KEY` is missing.
- `text-to-speech` — voice/model selection conventions.
- `speech-to-text` (Scribe v2) — derive a transcript from audio. Useful if the user shows up with an MP4 instead of a transcript.

MCP tools also available: `mcp__ElevenLabs__search_voices`, `mcp__ElevenLabs__get_voice`, `mcp__ElevenLabs__list_models`, `mcp__ElevenLabs__text_to_speech`. See "Helping with voice IDs" above for the recommended use pattern.
