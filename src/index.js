import { promises as fs } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import 'dotenv/config';

import { parseTranscript } from './parse.js';
import { generateClip } from './tts.js';
import { runDialogueMode } from './dialogue.js';
import { assembleClips } from './assemble.js';

const SAME_SPEAKER_GAP_MS = 250;
const SPEAKER_SWITCH_GAP_MS = 500;
const VALID_MODES = ['auto', 'dialogue', 'segment'];

function usage() {
  console.log(`Usage: node src/index.js <transcript.txt> [options]

Options:
  -o, --output <path>        Output MP3 path (default: out/<basename>.mp3)
  --config <path>            Voice config (default: voices.config.json)
  --mode <segment|dialogue|auto>
                             Generation mode (default: segment)
                               segment:  per-segment TTS via /text-to-speech, then concat. Default model: eleven_v4.
                                         Per-line voiceSettings honored. Recommended path.
                               dialogue: server-side multi-speaker via /text-to-dialogue. Hard-pinned to eleven_v3.
                                         Best cross-speaker prosody but coarser cache.
                               auto:     try dialogue first, fall back to segment on v3 access errors.
  --no-cache                 Force regeneration of all clips
  --seed <int>               Seed for deterministic generation
  -h, --help                 Show this help`);
}

function isV3AccessError(err) {
  if (!err) return false;
  if (err.status === 403 || err.status === 404) return true;
  const haystack = `${err.body || ''} ${err.message || ''}`.toLowerCase();
  return /model_not_found|model not found|requires alpha|alpha access|permission|forbidden|unauthorized model/.test(haystack);
}

async function runSegmentMode({ segments, voiceMap, cacheDir, noCache }) {
  const clipPaths = [];
  const gapsMs = [];
  let prevSpeaker = null;
  let cacheHits = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const preview = seg.text.length > 60 ? `${seg.text.slice(0, 57)}...` : seg.text;
    process.stdout.write(`  [${i + 1}/${segments.length}] ${seg.speaker}: "${preview}" `);

    const { voiceId, voiceSettings } = voiceMap[seg.speaker];
    const { path, cached } = await generateClip({
      text: seg.text,
      voiceId,
      voiceSettings,
      cacheDir,
      noCache,
    });
    if (cached) cacheHits++;
    console.log(cached ? '(cache)' : '(tts)');

    clipPaths.push(path);
    gapsMs.push(
      i === 0 ? 0 : seg.speaker === prevSpeaker ? SAME_SPEAKER_GAP_MS : SPEAKER_SWITCH_GAP_MS
    );
    prevSpeaker = seg.speaker;
  }

  return { clipPaths, gapsMs, cacheHits };
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      output: { type: 'string', short: 'o' },
      config: { type: 'string', default: 'voices.config.json' },
      mode: { type: 'string', default: 'segment' },
      'no-cache': { type: 'boolean', default: false },
      seed: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    usage();
    process.exit(values.help ? 0 : 1);
  }

  const mode = values.mode;
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`invalid --mode '${mode}'. Must be one of: ${VALID_MODES.join(', ')}`);
  }

  const transcriptPath = resolve(positionals[0]);
  const configPath = resolve(values.config);
  const outputPath = resolve(
    values.output ?? join('out', `${basename(transcriptPath, extname(transcriptPath))}.mp3`)
  );
  const cacheDir = resolve('.cache');
  const segmentCacheDir = join(cacheDir, 'segments');
  const dialogueCacheDir = join(cacheDir, 'dialogue');
  const noCache = values['no-cache'];
  const seed = values.seed != null ? Number.parseInt(values.seed, 10) : undefined;
  if (values.seed != null && !Number.isFinite(seed)) {
    throw new Error(`invalid --seed '${values.seed}'. Must be an integer.`);
  }

  const [transcriptText, configText] = await Promise.all([
    fs.readFile(transcriptPath, 'utf8'),
    fs.readFile(configPath, 'utf8').catch(() => {
      throw new Error(
        `voice config not found at ${configPath}. Copy voices.config.example.json → voices.config.json and fill in voice IDs.`
      );
    }),
  ]);

  const rawVoiceMap = JSON.parse(configText);
  const voiceMap = Object.fromEntries(
    Object.entries(rawVoiceMap).map(([speaker, val]) => {
      if (typeof val === 'string') return [speaker, { voiceId: val }];
      if (val && typeof val === 'object' && typeof val.voiceId === 'string') return [speaker, val];
      throw new Error(`voice config entry for "${speaker}" must be a string or { voiceId, voiceSettings? }`);
    })
  );
  const segments = parseTranscript(transcriptText);

  const speakers = [...new Set(segments.map((s) => s.speaker))];
  const missing = speakers.filter((s) => {
    const e = voiceMap[s];
    return !e || !e.voiceId || e.voiceId.startsWith('REPLACE_');
  });
  if (missing.length) {
    throw new Error(
      `voice config missing valid voice IDs for: ${missing.join(', ')}. Edit ${configPath}.`
    );
  }

  console.log(`Transcript: ${transcriptPath}`);
  console.log(`Segments: ${segments.length} (${speakers.join(', ')})`);
  console.log(`Mode: ${mode}${noCache ? ' (cache disabled)' : ''}${seed != null ? ` (seed=${seed})` : ''}`);
  console.log('');

  let clipPaths;
  let gapsMs;
  let cacheHits;
  let modeUsed = mode;

  const tryDialogue = () =>
    runDialogueMode({ segments, voiceMap, cacheDir: dialogueCacheDir, noCache, seed });
  const trySegment = () =>
    runSegmentMode({ segments, voiceMap, cacheDir: segmentCacheDir, noCache });

  if (mode === 'dialogue') {
    ({ clipPaths, gapsMs, cacheHits } = await tryDialogue());
    modeUsed = 'dialogue';
  } else if (mode === 'segment') {
    ({ clipPaths, gapsMs, cacheHits } = await trySegment());
    modeUsed = 'segment';
  } else {
    // auto
    try {
      ({ clipPaths, gapsMs, cacheHits } = await tryDialogue());
      modeUsed = 'dialogue';
    } catch (err) {
      if (!isV3AccessError(err)) throw err;
      console.warn('');
      console.warn(`[!] Dialogue mode unavailable (${err.status || '?'}): ${err.message}`);
      console.warn('[!] Falling back to per-segment mode. Tags will still work but conversation flow will be less natural.');
      console.warn('[!] To enable dialogue mode: request v3 alpha access at');
      console.warn('    https://help.elevenlabs.io/hc/en-us/articles/35869066075921');
      console.warn('');
      ({ clipPaths, gapsMs, cacheHits } = await trySegment());
      modeUsed = 'segment (auto-fallback)';
    }
  }

  console.log('');
  console.log(`Assembling ${clipPaths.length} clip(s) → ${outputPath}`);
  console.log(`Mode used: ${modeUsed} · cache hits: ${cacheHits}/${clipPaths.length}`);
  await assembleClips({ clipPaths, gapsMs, outputPath, cacheDir });
  console.log(`Done: ${outputPath}`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
