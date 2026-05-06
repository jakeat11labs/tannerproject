# Voice picking, ID validation, and preview

## Validating a voice ID

ElevenLabs voice IDs are typically 20+ alphanumeric characters, e.g. `21m00Tcm4TlvDq8ikWAM` or `wWWn96OtTHu1sn8SRGEr`. If the user pastes a name like "Rachel" or "Dave," tell them you need the ID specifically:

> "I need the voice **ID**, not the name. Open the voice in your library at https://elevenlabs.io/app/voice-library — click the voice you want, then click the **ID** button to copy. It'll look like `21m00Tcm4TlvDq8ikWAM`."

## Helping the user pick voices

When the user says "help me pick voices" or describes what they want ("a curious masculine interviewer + a warm feminine candidate"):

### Option 1: MCP voice search (preferred when available)

If `mcp__ElevenLabs__search_voices` is available (ElevenLabs skills installed via `npx skills add https://github.com/elevenlabs/skills`), call it with the user's natural-language query:

```
mcp__ElevenLabs__search_voices(search="curious masculine")
```

Show top 5 candidates with names and short descriptions. Then ask which one they want.

### Option 2: Preview clips

If they want to hear before deciding:

1. Generate a 1-line sample for each candidate using a stock phrase (e.g., the first segment of `transcripts/sample.txt` or a generic line):
   ```js
   mcp__ElevenLabs__text_to_speech(
     text="Hey, thanks for jumping on with me today. How's your morning going?",
     voice_id="<candidate_id>",
     output_directory="./.cache/voice-preview/"
   )
   ```
2. Save each preview to `.cache/voice-preview/<voice_id>.mp3`.
3. Tell the user how to listen: `open .cache/voice-preview/<voice_id>.mp3`.

### Option 3: Direct API browse

Direct them to https://elevenlabs.io/app/voice-library and let them filter by accent, gender, age, use-case. Click any voice to hear a sample, then copy the ID.

## Writing the voice config

Once they pick two, write `voices.config.json`:

```json
{
  "<SpeakerName1>": {
    "voiceId": "<id>",
    "voiceSettings": {
      "stability": 0.4,
      "similarityBoost": 0.75,
      "style": 0.4,
      "useSpeakerBoost": true
    }
  },
  "<SpeakerName2>": "<id>"
}
```

**Either form works** — full object with settings, or just the voice ID string. The full object is recommended for v3 (where stability really matters); for v4 the settings are mostly silently ignored.

The speaker names (keys) MUST match the speaker names in the transcript exactly — case-sensitive, including spaces. If the transcript says `[00:00:00] Tanner:` then the config key is `"Tanner"`.

## When voices feel wrong after generation

- **Wrong voice on a speaker** → speaker name mismatch. Diff the keys in `voices.config.json` against the speaker names in the transcript. Check for trailing whitespace, capitalization differences.
- **Both speakers sound similar** → too-similar voice picks. Suggest more contrasting voices (e.g., one masculine + one feminine, one warm + one crisp).
- **One voice sounds emotionally flat** vs. the other → that voice's training samples may not cover the emotional range. Pick a voice tagged "expressive" or with an "Emotionally diverse" indicator in the library.
- **Voice ignores `[bracketed]` tags** → stability too high. Lower `voiceSettings.stability` to ~0.3 and re-run with `--no-cache` for that segment (or `rm -rf .cache/segments/`).

## Don't auto-pick

Casting is creative work. Even if the user describes what they want vaguely ("just pick something"), it's better to surface 3-5 candidates and let them choose than to silently pick. The exception: if they explicitly say "just use any two voices, surprise me" — then it's fine to default to two of the top stock voices and tell them you can swap later.

Reasonable defaults if forced to pick:
- Masculine, warm, conversational: `21m00Tcm4TlvDq8ikWAM` (Rachel — wait that's feminine, double-check before using)
- Or browse https://elevenlabs.io/app/voice-library/collections/aF6JALq9R6tXwCczjhKH for ElevenLabs's curated v3-friendly list

When in doubt, ask the user.
