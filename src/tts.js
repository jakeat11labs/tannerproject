import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

let _client;
function client() {
  if (!_client) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ELEVENLABS_API_KEY is not set. Add it to .env or your shell environment. ' +
        'If you need help getting a key, run the `setup-api-key` skill.'
      );
    }
    _client = new ElevenLabsClient({ apiKey });
  }
  return _client;
}

function cacheKey({ voiceId, modelId, text, voiceSettings }) {
  const settingsKey = voiceSettings ? JSON.stringify(voiceSettings) : '';
  return createHash('sha256')
    .update(`${voiceId}|${modelId}|${settingsKey}|${text}`)
    .digest('hex')
    .slice(0, 16);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function generateClip({
  text,
  voiceId,
  voiceSettings,
  modelId = process.env.ELEVEN_MODEL_ID || 'eleven_v3',
  cacheDir,
  noCache = false,
}) {
  const key = cacheKey({ voiceId, modelId, text, voiceSettings });
  const path = join(cacheDir, `${key}.mp3`);

  if (!noCache) {
    try {
      await fs.access(path);
      return { path, cached: true };
    } catch {
      /* fall through to fetch */
    }
  }

  const audio = await client().textToSpeech.convert(voiceId, {
    text,
    modelId,
    outputFormat: 'mp3_44100_128',
    ...(voiceSettings ? { voiceSettings } : {}),
  });

  const buf = await streamToBuffer(audio);
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(path, buf);
  return { path, cached: false };
}
