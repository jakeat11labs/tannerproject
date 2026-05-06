# Troubleshooting playbook

## Setup / config errors

### `ELEVENLABS_API_KEY is not set`

`.env` is missing or doesn't have the key. Check with:
```bash
test -f .env && grep ELEVENLABS_API_KEY .env > /dev/null && echo "ok" || echo "missing"
```
If missing, ask for the key and write it: `echo "ELEVENLABS_API_KEY=$KEY" > .env && chmod 600 .env`.

### `voice config not found at /path/to/voices.config.json`

User skipped the voice config step. Run `cp voices.config.example.json voices.config.json` and walk them through filling in voice IDs (see `voices.md`).

### `voice config missing valid voice IDs for: <names>`

Either they still have `REPLACE_WITH_VOICE_ID` placeholders, or the speaker names in the config don't match the transcript. Names must match exactly — case-sensitive, including trailing spaces.

Diagnose:
```bash
grep -oE '\] \w[^:]*:' transcripts/<file>.txt | sort -u    # speaker names in transcript
jq -r 'keys[]' voices.config.json                          # speaker names in config
```

### `parse error on line N: expected [hh:mm:ss] Speaker: text, got: ...`

Transcript format mismatch. See `transcripts.md` for common variants and fixes.

### `ffmpeg: command not found`

Not installed. Tell them: `brew install ffmpeg` (macOS) or your distro's equivalent. Don't try to install it yourself.

## Generation errors

### `text-to-dialogue 403` or `model_not_found` (dialogue mode only)

User's account doesn't have v3 alpha access. Two paths:
1. Switch to segment mode (the default and recommended): `node src/index.js transcripts/<file>.txt` (no `--mode` flag, or `--mode segment`)
2. Request v3 alpha access: https://help.elevenlabs.io/hc/en-us/articles/35869066075921

Don't keep retrying dialogue mode on the same account in the same session — it'll keep failing.

### `401 Unauthorized`

API key is wrong or has insufficient scopes. Check:
1. Key value: `head -c 40 .env`
2. Scopes: at https://elevenlabs.io/app/settings/api-keys, the key needs **TTS** + **Voices: read** at minimum.

### Long pauses / weird hesitations / extra "uh"s

v4/v3 inflection is non-deterministic without a seed. Suggest:
1. Re-run the same script 2-3 times — same input gives different reads. Pick the take you like.
2. Use `--seed <int>` for deterministic generation if they want a specific take to be reproducible.

### Generation succeeds but ffmpeg concat errors

Look for the specific ffmpeg error in the output. Common causes:
- A clip in the cache is corrupted (download interrupted). Delete and retry: `rm .cache/segments/<hash>.mp3` (or `rm -rf .cache/` and re-run).
- File path has special characters that broke the concat list. Check the temp `concat_*.txt` in `.cache/`.

## Audio quality issues

### Output sounds robotic / no expression

- Check `voiceSettings.stability` for both speakers — should be ~0.3-0.5 for expressive output. Higher values (0.75+) suppress tag responsiveness.
- Confirm you're on v3 or v4. If `ELEVEN_MODEL_ID=eleven_multilingual_v2` is set anywhere, brackets get read as words.

### Brackets are read aloud as words

The model isn't a v3-family model. Confirm:
- `grep ELEVEN_MODEL_ID .env` — should be unset, or set to `eleven_v4`/`eleven_v3`/`eleven_v4_hq`
- The default in `src/tts.js` is `eleven_v4`

### Voice ignores tags even on v3/v4

`voiceSettings.stability` is too high. Drop to ~0.3 and force regen for the affected segments:
```bash
rm -rf .cache/segments/   # nukes the cache
node src/index.js transcripts/<file>.txt --no-cache
```

### Random hallucinations / extra words

Stability too low. Bump `voiceSettings.stability` to ~0.5 and regen.

### Wrong voice on a speaker

Speaker name in `voices.config.json` doesn't match the transcript. Names are case-sensitive, including spaces.

### Both speakers sound the same

Too-similar voice picks. Pick more contrasting voices (one masculine + one feminine, one warm + one crisp). See `voices.md`.

### Audio levels jump between segments

Already handled — `src/polish.js` runs loudnorm to -16 LUFS on every clip before caching. If it's still happening, the polish filter may have failed silently for some segments. Check:
```bash
ls -la .cache/segments/*.mp3 | awk '{print $5, $NF}' | sort -n | head
```
Suspiciously small files (< 5 KB) probably failed polish. Delete them and re-run: `rm <suspicious>; node src/index.js transcripts/<file>.txt --no-cache`.

### Clicks/pops at speaker switches

Shouldn't happen with the current pipeline (silence padding eliminates clicks at concat boundaries). If it does, inspect the gap structure — `src/index.js` puts 250 ms between same-speaker segments, 500 ms between speaker switches. Bump those if needed.

## Cache issues

### Re-runs are slow even though I didn't change anything

Something in the cache key changed. Check:
- Did `voiceSettings` change in `voices.config.json`? Settings are part of the cache key.
- Did `ELEVEN_MODEL_ID` env var change? Model is part of the key.
- Did `POLISH_VERSION` in `src/polish.js` change? Bumping it invalidates everything.

If none of those changed, the cache might have been corrupted. `rm -rf .cache/` and re-run.

### I want a different take of the same line

Either:
- `--no-cache` (forces regen of everything for this run)
- Use a different `--seed N` (different cache entry)
- Manually delete the specific segment: `rm .cache/segments/<hash>.mp3` then re-run

To find a segment's hash without re-running: print it from `parse.js` + the cache key formula. Easier: just `rm -rf .cache/segments/` if you don't mind regenerating everything.

## Last-resort moves

When nothing else is working:

1. `rm -rf .cache/ out/` — start fresh
2. Re-verify env: `cat .env | head -1` (key still set?)
3. Re-verify config: `cat voices.config.json` (matches transcript speakers?)
4. Verify ffmpeg: `ffmpeg -version | head -1`
5. Try the smallest possible transcript: `node src/index.js transcripts/sample.txt --no-cache`
6. If even the sample fails, the issue is environmental — check Node version (`node --version`, need 20+) and ffmpeg.
