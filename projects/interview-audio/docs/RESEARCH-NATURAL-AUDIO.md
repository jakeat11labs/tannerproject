# How others make multi-voice TTS sound natural

> Research notes from inspecting open-source projects that generate multi-speaker podcasts/interviews with ElevenLabs and similar TTS, plus the official ElevenLabs Text-to-Dialogue API. Goal: find the "secrets" for naturalness and decide what (if anything) to bring into this project.

---

## TL;DR

**There's no clever post-processing trick.** The projects that advertise "natural sounding multi-voice podcasts" don't do anything magical with ffmpeg. Most of them just concatenate clips with `pydub.AudioSegment +=` — exactly what we're doing, often with even less care (no silence padding at all).

The actual "secret" is **upstream, not downstream**:

1. **Use a server-side dialogue endpoint** so the model generates the whole conversation as one coherent audio stream. ElevenLabs ships [`/v1/text-to-dialogue`](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert) for exactly this. Google has Studio MultiSpeaker. The model "hears" the other speaker's prosody and matches across turns — that's what makes it sound like a real conversation. You can't recreate this by concatenating isolated clips.
2. **Write better scripts.** Audio tags, ellipses, em-dashes, CAPS emphasis, narrative cues like _"she said quietly"_ — these all influence delivery. Most of the "natural" wins come from the input text, not the audio pipeline.

Secondary post-processing tricks (crossfades, normalization, silence trimming) help eliminate **clicks/pops** and **volume mismatches** but don't make a stitched-together audio sound like a real conversation. They smooth rough edges; they don't add naturalness.

---

## What I looked at

| Project | Stack | Approach | Natural-sound technique |
| --- | --- | --- | --- |
| [Podcastfy](https://github.com/souzatharsis/podcastfy) | Python, pydub, ElevenLabs | Per-segment TTS → `combined += segment` (no silence, no crossfade) | None at the audio layer; relies on LLM-written script. Multi-speaker model variant uses Google's `en-US-Studio-MultiSpeaker` and just stitches the returned chunks |
| [ai-podcast-generator (pedrotorrecillas)](https://github.com/pedrotorrecillas/ai-podcast-generator) | Python, ElevenLabs | RSS → Claude script → ElevenLabs TTS → ffmpeg concat | None special; relies on script quality |
| [Ctrl_Alt_Discuss](https://github.com/Constantin-Hentgen/Ctrl_Alt_Discuss) | Python, GPT-3.5, ElevenLabs | RSS → script → TTS → concat | None special |
| [voicebox (jamiepine)](https://github.com/jamiepine/voicebox) | TS/UI | Multi-voice timeline editor | Manual editing in a DAW-style timeline; user adjusts gaps, fades, levels by hand |
| [ElevenLabs Text-to-Dialogue API](https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue) | Server-side | Batch `inputs[]` of `{text, voice_id}` in one request, model generates the dialogue as a single coherent audio | **The model itself handles turn-taking, interruptions, prosody matching across speakers.** This is the actual secret. |

---

## What I learned from each

### Podcastfy — the most popular open-source contender

Source: [`podcastfy/text_to_speech.py`](https://github.com/souzatharsis/podcastfy/blob/main/podcastfy/text_to_speech.py)

Their pipeline:

```python
combined = AudioSegment.empty()
for chunk in audio_data_list:
    segment = AudioSegment.from_file(io.BytesIO(chunk))
    combined += segment       # ← that's it, just append
combined.export(output_file, format=audio_format, codec="libmp3lame", bitrate="320k")
```

Things to note:

- **No silence between segments.** They concatenate with zero gap. Same speaker → speaker switch → no breath, just hard cut. This often sounds rushed/clipped.
- **High bitrate output (320 kbps).** We're at 128 kbps. Bumping ours costs nothing meaningful but improves quality on louder passages.
- **They use `pydub`, which uses ffmpeg under the hood.** Same engine as us, different ergonomics.
- **Their multi-speaker handling is a script tag system** (`<Person1>...</Person1><Person2>...</Person2>`), parsed into Q&A pairs. Identical conceptually to our `[Speaker]: text` format.

**Our project is already comparable to Podcastfy on the audio side**, with two improvements: (a) we add small natural-pacing gaps between segments, (b) we re-encode through the concat filter so silence and clip params line up. Podcastfy doesn't even do that.

### ElevenLabs Text-to-Dialogue API — the actual secret

Source: [docs](https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue), [API ref](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

Request shape:

```jsonc
POST /v1/text-to-dialogue
{
  "inputs": [
    { "text": "[curious] Welcome! How's your morning?", "voice_id": "voiceA" },
    { "text": "[laughs] Chaotic, but excited to chat.",   "voice_id": "voiceB" },
    { "text": "Tell me about a time...",                  "voice_id": "voiceA" }
  ],
  "model_id": "eleven_v3",
  "seed": 42,                  // optional, for determinism
  "output_format": "mp3_44100_128"
}
// → returns one audio file with the whole dialogue
```

Key constraints:

- **2000 characters total per request** across all `inputs[].text` for `eleven_v3`. v4 / v4_hq cap is **1500 characters per request**. Longer transcripts must be chunked accordingly.
- **Up to 10 unique voice IDs per request.** No issue for two-speaker interviews.
- **Officially v3 only.** Live API testing (May 2026) shows `eleven_v4` and `eleven_v4_hq` are also accepted by the dialogue endpoint despite the docs — though v4 dialogue tends to read aggressively fast (~2× v3 dialogue on the same input). Documented default stays v3.
- **Non-deterministic** — pass `seed` for repeatability.
- **2 free regenerations per piece of content (dashboard only).**

Why this is the win:

> "Eleven v3 offers Dialogue mode, allowing you to generate dynamic multi-speaker conversations with **natural pacing, that handle interruptions, shifts in tone, and emotional cues based on conversational context**. There is no limit to the number of speakers in a dialogue."  
> — [ElevenLabs help center](https://help.elevenlabs.io/hc/en-us/articles/35869170509201-What-is-Dialogue-mode)

The model **sees all speakers' lines together** and generates the whole exchange as one performance. When voiceA says "[laughs] that's hilarious," voiceB's reply is rendered with prosody that acknowledges that laugh. You cannot get this from per-segment TTS, no matter how good your post-processing is.

The docs explicitly call out interruptions:

```
"[cautiously] Hello, is this seat-"
"[jumping in] Free? [cheerfully] Yes it is."
```

That trailing dash + "[jumping in]" gets rendered as a real interruption when both lines go through Dialogue mode in one request. With per-segment TTS, the trailing dash just gets read as a hesitation.

---

## Secondary post-processing tricks (worth ~10% improvement)

If we keep the per-segment approach (or use it as a fallback), these would polish the output:

### 1. Crossfade between segments

Eliminates clicks/pops at concat boundaries. Pydub:
```python
combined = combined.append(next_segment, crossfade=15)  # 15ms
```
ffmpeg equivalent uses `acrossfade=d=0.015` in a filter graph. **Don't go above 30ms** — beyond that you get audible bleeding between speakers.

### 2. Loudness normalization

ElevenLabs clips can vary by 3-6 dB between generations. Normalize each clip to a target LUFS before concat:
```python
from pydub.effects import normalize
segment = normalize(segment)
```
Or with ffmpeg: `loudnorm=I=-16:TP=-1.5:LRA=11`. Industry standard for podcasts is -16 LUFS integrated.

### 3. Silence trimming

ElevenLabs clips often have 50-200ms of dead air at start/end. Strip it before concat so you control the gap:
```python
from pydub.silence import detect_leading_silence
segment = segment[detect_leading_silence(segment):-detect_leading_silence(segment.reverse())]
```

### 4. Higher bitrate output

We're at 128 kbps. Podcastfy's at 320 kbps. For interview audio, 192 kbps is a sensible middle — better quality on dynamic moments, no real cost increase.

### 5. Use the `seed` parameter

ElevenLabs accepts a `seed` for reproducibility. When iterating on tags, pin a seed so re-runs are deterministic and you can isolate the effect of your changes.

---

## Recommended upgrade path

Three options, in order of impact:

### Option A: Add a "dialogue mode" using `/text-to-dialogue` (BIG WIN)

**Effort:** medium (~150 lines of code)
**Impact:** large — this is the actual difference between "stitched clips" and "real conversation"

Mechanism:
1. Parse transcript as today.
2. Chunk segments into ≤2000-char batches, preserving speaker order.
3. Each chunk → one `/v1/text-to-dialogue` request with `inputs[]`.
4. Stitch chunk audio with the same ffmpeg concat we have today (chunks ARE the natural-sounding part; gaps between chunks should be ~500ms).
5. Cache key becomes the whole chunk's text + voices, so editing one segment invalidates one chunk (~5-10 segments) instead of one segment.

Trade-offs:
- Requires v3 alpha access (auto-fallback to per-segment v2 if unavailable).
- Coarser cache granularity (chunk, not segment) — re-runs cost more on small edits.
- 2000 char limit means a 30-min interview is ~6-12 chunks.

### Option B: Add post-processing to current per-segment pipeline

**Effort:** small (~30 lines)
**Impact:** modest — eliminates clicks, evens out volume, but doesn't add "naturalness"

- Add 15ms crossfade in `assemble.js` (use ffmpeg `acrossfade` instead of `concat` filter)
- Add `loudnorm` filter to even out per-segment volume
- Strip leading/trailing silence from each cached clip before concat
- Bump bitrate to 192 kbps

### Option C: Both (recommended)

Default to dialogue mode when v3 access is available. Fall back to per-segment + post-processing when it isn't.

---

## What we should NOT do

- **Don't add manual breath/silence injection.** v3 already breathes when you write naturally.
- **Don't try to "stretch" segments to match original timestamps.** Sounds robotic; we already decided against this.
- **Don't run multiple speakers through the same voice and rely on emotional tags** to differentiate. We tested this implicitly via Podcastfy's design — listeners need distinct voices to track who's speaking.
- **Don't normalize too aggressively.** Compression > -3 dBFS removes the dynamic range that makes expressive tags feel expressive.

---

## Open questions for the project

1. **Is v3 alpha access a soft requirement now?** If yes, we should default to dialogue mode. If most users won't have it for months, we should default to per-segment + polish.
2. **Are we OK with chunk-level caching?** Per-segment cache is one of our nicer features (edit one line → only re-TTS that line). Dialogue chunks coarsen this.
3. **Do we want to expose a `--mode` CLI flag** so users can pick per-run, or auto-detect based on transcript length and v3 availability?

---

## Sources

- [Podcastfy GitHub](https://github.com/souzatharsis/podcastfy) (esp. `podcastfy/text_to_speech.py`)
- [ElevenLabs Text-to-Dialogue overview](https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue)
- [ElevenLabs Text-to-Dialogue API reference](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)
- [ElevenLabs help: What is Dialogue mode?](https://help.elevenlabs.io/hc/en-us/articles/35869170509201-What-is-Dialogue-mode)
- [ElevenLabs Eleven v3 prompting guide](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3)
