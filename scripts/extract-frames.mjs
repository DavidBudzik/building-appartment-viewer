// Turns the source clips in media-src/clips into scroll-scrubbable frame sequences.
//
//   npm run frames
//
// Clips are read in alphabetical order (01-approach.mp4, 02-arrival.mp4, ...).
// Output: public/media/frames/{lg,sm}/<clip>/0001.webp + public/media/frames/manifest.json
// Requires ffmpeg on PATH.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const SRC = 'media-src/clips';
const OUT = 'public/media/frames';
const FPS = Number(process.env.FPS || 12);
const SIZES = { lg: { width: 1440, quality: 58 }, sm: { width: 854, quality: 55 } };

if (!existsSync(SRC)) {
  console.error(`No clips found. Put your .mp4 files in ${SRC}/ first.`);
  process.exit(1);
}

const clips = readdirSync(SRC).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).sort();
rmSync(OUT, { recursive: true, force: true });

const manifest = { fps: FPS, sizes: Object.keys(SIZES), clips: [] };

for (const file of clips) {
  const id = basename(file, extname(file));
  let count = 0;
  for (const [size, { width, quality }] of Object.entries(SIZES)) {
    const dir = join(OUT, size, id);
    mkdirSync(dir, { recursive: true });
    execFileSync('ffmpeg', [
      '-v', 'error', '-y', '-i', join(SRC, file),
      '-vf', `fps=${FPS},scale=${width}:-2:flags=lanczos`,
      '-c:v', 'libwebp', '-quality', String(quality), '-compression_level', '5',
      join(dir, '%04d.webp'),
    ]);
    count = readdirSync(dir).length;
  }
  manifest.clips.push({ id, frames: count });
  console.log(`${id}: ${count} frames`);
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${OUT}/manifest.json`);
