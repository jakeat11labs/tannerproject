# Modes and model selection

The CLI ships three modes via `--mode segment|dialogue|auto`. Default is `segment`.

## Quick decision tree

> Just run the default. `node src/index.js transcripts/<file>.txt` uses segment mode + `eleven_v4`. That's the recommended path for 95% of use cases.

Override only if the user asks for something specific.

## The three modes

### `segment` (default, recommended)

Each speaker line goes through `/v1/text-to-speech` individually, then ffmpeg-concats with silence padding (250 ms same-speaker, 500 ms speaker-switch). Per-line `voiceSettings` honored. Cache is per-line — edit one segment, only that one re-generates.

- Default model: `eleven_v4`
- Override: `ELEVEN_MODEL_ID=eleven_v4_hq` (or v3, etc.)
- All `voiceSettings` from `voices.config.json` apply

### `dialogue` (opt-in)

Sends each ≤1900-char chunk to `/v1/text-to-dialogue`. The model generates the whole exchange as one coherent performance — real turn-taking, prosody matching across speakers, interruptions. Coarser cache (per chunk, ~10-15 segments at once).

- **Default model: `eleven_v3`** (the documented path). The official docs say "v3 only," but live API testing (May 2026) confirms `eleven_v4` and `eleven_v4_hq` are also accepted and return valid audio. **`ELEVEN_MODEL_ID` overrides** the default. Note: v4 dialogue tends to read **substantially faster** than v3 dialogue — sometimes ~2× faster. If the user wants the natural cross-speaker prosody of dialogue mode at a normal pace, default v3 is the right pick. If they want tighter, more confident delivery and don't mind the speedup, `ELEVEN_MODEL_ID=eleven_v4 --mode dialogue` works.
- **Per-model chunk size** (handled automatically by `chunkSegments`): v3 max 1900 chars/chunk (endpoint limit 2000), v4/v4_hq max 1400 chars/chunk (endpoint limit 1500).
- `voiceSettings` does NOT apply — the dialogue endpoint doesn't accept per-input voice settings.
- Best for: reactive moments where one speaker's tone should affect the other's reply (laugh-on-laugh, interruptions, tonal shifts).

### `auto` (legacy)

Tries `dialogue` first, falls back to `segment` on v3 access errors. Mostly there from earlier development. Default flipped to `segment`; only suggest `auto` if the user asks for fallback behavior explicitly.

## Model selection (segment mode only)

Set `ELEVEN_MODEL_ID` env var to override the default:

| Model | Description | Default? |
| --- | --- | --- |
| **`eleven_v4`** | Newest expressive model. Tighter pacing, confident delivery, supports all v3 audio tags. | ✅ default |
| `eleven_v4_hq` | Higher-quality variant. Slightly slower. Comparable in our testing. | |
| `eleven_v3` | The model the dialogue endpoint uses. More leisurely pacing than v4. | |
| `eleven_multilingual_v2` | Pre-v3 model. **Audio tags NOT supported** — brackets get read aloud. Last-resort fallback only. | |

To check what's available on the user's account:

```bash
KEY=$(grep -E '^ELEVENLABS_API_KEY=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")
curl -sH "xi-api-key: $KEY" https://api.elevenlabs.io/v1/models | jq -r '.[] | "\(.model_id)\t\(.name)\tTTS:\(.can_do_text_to_speech)\tAlpha:\(.requires_alpha_access)"' | column -ts $'\t'
```

Or use the MCP tool `mcp__ElevenLabs__list_models` if available.

## When to suggest dialogue mode

Don't volunteer it. But suggest it explicitly if the user:

- Says the segment output sounds "stitched together" or "robotic between turns"
- Has a transcript with lots of reactive moments (laughs, interruptions, gasps)
- Wants the model to "hear both speakers" or asks about cross-speaker prosody
- Is doing a research/comparison task and wants to A/B both modes

## When to suggest model overrides

- User says v4 sounds "too tight" or "rushed" → try `eleven_v3` for more leisurely pacing
- User wants higher fidelity → try `eleven_v4_hq` (slightly slower, similar quality)
- User has v3 alpha access and wants to try the dialogue endpoint → `--mode dialogue`
- Don't suggest `eleven_multilingual_v2` unless the user explicitly can't use v3/v4 — tags won't render

## A/B comparison command

If the user wants to compare modes/models:

```bash
node src/index.js transcripts/<file>.txt                                                  -o out/segment-v4.mp3
node src/index.js transcripts/<file>.txt --mode dialogue                                  -o out/dialogue-v3.mp3
ELEVEN_MODEL_ID=eleven_v3    node src/index.js transcripts/<file>.txt                     -o out/segment-v3.mp3
ELEVEN_MODEL_ID=eleven_v4_hq node src/index.js transcripts/<file>.txt                     -o out/segment-v4hq.mp3
```

Then `open out/` to listen to all four side-by-side.

The repo ships three pre-rendered samples (`samples/A-dialogue-v3.mp3`, `samples/B-segment-v3.mp3`, `samples/C-segment-v4.mp3`) generated from `transcripts/cs-interview-example.txt` — point users at those before they burn time generating their own A/B.
