import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { polishClip, POLISH_VERSION } from './polish.js';

const ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-dialogue';
const CHUNK_GAP_MS = 500;

// Per-model max chars on the dialogue endpoint, derived from /v1/models
// `maximum_text_length_per_request`. Set conservatively below the limit
// so we have headroom for any whitespace/encoding overhead.
const MAX_CHARS_BY_MODEL = {
  eleven_v3: 1900,       // limit 2000
  eleven_v4: 1400,       // limit 1500
  eleven_v4_hq: 1400,    // limit 1500
};
const DEFAULT_MAX_CHARS = 1400;

export function maxCharsForModel(modelId) {
  return MAX_CHARS_BY_MODEL[modelId] || DEFAULT_MAX_CHARS;
}

export function chunkSegments(segments, maxChars = DEFAULT_MAX_CHARS) {
  const chunks = [];
  let current = [];
  let currentChars = 0;
  for (const seg of segments) {
    if (seg.text.length > maxChars) {
      throw new Error(
        `segment on line ${seg.lineNo} is ${seg.text.length} chars, exceeds dialogue chunk limit of ${maxChars}. ` +
        `Split this line into shorter segments, or use --mode segment.`
      );
    }
    if (currentChars + seg.text.length > maxChars && current.length > 0) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(seg);
    currentChars += seg.text.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function chunkCacheKey({ inputs, modelId, seed }) {
  const data = JSON.stringify({ inputs, modelId, seed: seed ?? null, polish: POLISH_VERSION });
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

async function callDialogueApi({ inputs, modelId, seed }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set. Add it to .env or your shell environment.');
  }

  const body = {
    inputs,
    model_id: modelId,
    output_format: 'mp3_44100_128',
    ...(seed != null ? { seed } : {}),
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    const error = new Error(`text-to-dialogue ${res.status}: ${errText.slice(0, 500)}`);
    error.status = res.status;
    error.body = errText;
    throw error;
  }

  return Buffer.from(await res.arrayBuffer());
}

// Dialogue endpoint default. Official docs say "v3 only," but live API
// testing (May 2026) confirms v4 and v4_hq also accepted and return valid
// audio (mono for v4, stereo for v4_hq). ELEVEN_MODEL_ID overrides the
// default for both segment and dialogue modes.
export async function generateDialogueChunk({
  segments,
  voiceMap,
  modelId = process.env.ELEVEN_MODEL_ID || 'eleven_v3',
  cacheDir,
  noCache = false,
  seed,
}) {
  const inputs = segments.map((s) => ({
    text: s.text,
    voice_id: voiceMap[s.speaker].voiceId,
  }));

  const key = chunkCacheKey({ inputs, modelId, seed });
  const path = join(cacheDir, `${key}.mp3`);

  if (!noCache) {
    try {
      await fs.access(path);
      return { path, cached: true };
    } catch {
      /* fall through to fetch */
    }
  }

  const buf = await callDialogueApi({ inputs, modelId, seed });
  await fs.mkdir(cacheDir, { recursive: true });
  const rawPath = `${path}.raw.mp3`;
  await fs.writeFile(rawPath, buf);
  await polishClip(rawPath, path);
  await fs.unlink(rawPath).catch(() => {});

  return { path, cached: false };
}

export async function runDialogueMode({ segments, voiceMap, cacheDir, noCache, seed }) {
  const modelId = process.env.ELEVEN_MODEL_ID || 'eleven_v3';
  const maxChars = maxCharsForModel(modelId);
  const chunks = chunkSegments(segments, maxChars);
  console.log(`Dialogue mode: ${chunks.length} chunk(s) for ${segments.length} segments (model: ${modelId}, max ${maxChars} chars/chunk)`);

  const clipPaths = [];
  let cacheHits = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkSegs = chunks[i];
    const chars = chunkSegs.reduce((n, s) => n + s.text.length, 0);
    process.stdout.write(`  [${i + 1}/${chunks.length}] ${chunkSegs.length} segments, ${chars} chars `);

    const { path, cached } = await generateDialogueChunk({
      segments: chunkSegs,
      voiceMap,
      cacheDir,
      noCache,
      seed,
    });
    if (cached) cacheHits++;
    console.log(cached ? '(cache)' : '(api)');
    clipPaths.push(path);
  }

  const gapsMs = clipPaths.map((_, i) => (i === 0 ? 0 : CHUNK_GAP_MS));
  return { clipPaths, gapsMs, cacheHits };
}
