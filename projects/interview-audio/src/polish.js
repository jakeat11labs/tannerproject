import { spawn } from 'node:child_process';

export const POLISH_VERSION = 'v1';

const SILENCE_THRESHOLD = '-50dB';
const SILENCE_DURATION = 0.05;
const LOUDNORM = 'loudnorm=I=-16:TP=-1.5:LRA=11';

const FILTER_CHAIN = [
  `silenceremove=start_periods=1:start_silence=0:start_threshold=${SILENCE_THRESHOLD}:start_duration=${SILENCE_DURATION}:detection=peak`,
  'areverse',
  `silenceremove=start_periods=1:start_silence=0:start_threshold=${SILENCE_THRESHOLD}:start_duration=${SILENCE_DURATION}:detection=peak`,
  'areverse',
  LOUDNORM,
].join(',');

export async function polishClip(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-af', FILTER_CHAIN,
      '-b:a', '192k',
      '-ar', '44100',
      '-ac', '2',
      outputPath,
    ];
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg polish exited ${code}\n${stderr}`));
    });
  });
}
