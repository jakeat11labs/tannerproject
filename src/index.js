import { promises as fs } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import 'dotenv/config';

import { parseTranscript } from './parse.js';
import { generateClip } from './tts.js';
import { assembleClips } from './assemble.js';

const SAME_SPEAKER_GAP_MS = 250;
const SPEAKER_SWITCH_GAP_MS = 500;

function usage() {
  console.log(`Usage: node src/index.js <transcript.txt> [-o out.mp3] [--config voices.config.json] [--no-cache]`);
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      output: { type: 'string', short: 'o' },
      config: { type: 'string', default: 'voices.config.json' },
      'no-cache': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    usage();
    process.exit(values.help ? 0 : 1);
  }

  const transcriptPath = resolve(positionals[0]);
  const configPath = resolve(values.config);
  const outputPath = resolve(
    values.output ?? join('out', `${basename(transcriptPath, extname(transcriptPath))}.mp3`)
  );
  const cacheDir = resolve('.cache');
  const noCache = values['no-cache'];

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
  console.log(`Cache: ${cacheDir}${noCache ? ' (disabled)' : ''}`);

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

  console.log(`\nAssembling ${clipPaths.length} clips → ${outputPath} (cache hits: ${cacheHits}/${segments.length})`);
  await assembleClips({ clipPaths, gapsMs, outputPath, cacheDir });
  console.log(`Done: ${outputPath}`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
