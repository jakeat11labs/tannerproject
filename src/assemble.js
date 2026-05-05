import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}\n${stderr}`));
    });
  });
}

async function ensureSilenceClip(durationMs, cacheDir) {
  const path = join(cacheDir, `silence_${durationMs}.mp3`);
  try {
    await fs.access(path);
    return path;
  } catch { /* generate */ }

  await fs.mkdir(cacheDir, { recursive: true });
  const seconds = (durationMs / 1000).toFixed(3);
  await runFfmpeg([
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=44100:cl=stereo',
    '-t', seconds,
    '-b:a', '128k',
    path,
  ]);
  return path;
}

export async function assembleClips({ clipPaths, gapsMs, outputPath, cacheDir }) {
  if (clipPaths.length !== gapsMs.length) {
    throw new Error(`clipPaths (${clipPaths.length}) and gapsMs (${gapsMs.length}) length mismatch`);
  }

  const uniqueGaps = [...new Set(gapsMs.filter((g) => g > 0))];
  const silenceMap = {};
  for (const g of uniqueGaps) {
    silenceMap[g] = await ensureSilenceClip(g, cacheDir);
  }

  const concatLines = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const gap = gapsMs[i];
    if (gap > 0) concatLines.push(`file '${silenceMap[gap].replace(/'/g, "'\\''")}'`);
    concatLines.push(`file '${clipPaths[i].replace(/'/g, "'\\''")}'`);
  }

  const listPath = join(cacheDir, `concat_${Date.now()}.txt`);
  await fs.writeFile(listPath, concatLines.join('\n') + '\n');

  await fs.mkdir(dirname(outputPath), { recursive: true });

  // Re-encode (not -c copy) so mismatched bitrates / silence-vs-clip params concat cleanly.
  await runFfmpeg([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    outputPath,
  ]);

  await fs.unlink(listPath).catch(() => {});
}
