import { asset } from './lib/util.js';

/**
 * Plays image sequences on a canvas, one frame per scroll position.
 * All clips from the manifest are flattened into one long frame list.
 */
export class FrameSequence {
  constructor(canvas, base, manifest) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.size = this.pickSize(manifest.sizes);
    this.frames = [];
    this.ranges = {};
    this.current = -1;
    this.wanted = 0;

    for (const clip of manifest.clips) {
      const start = this.frames.length;
      for (let i = 1; i <= clip.frames; i++) {
        this.frames.push({
          src: asset(`${base}/${this.size}/${clip.id}/${String(i).padStart(4, '0')}.webp`),
          img: null,
        });
      }
      this.ranges[clip.id] = { start, end: this.frames.length - 1 };
    }

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  pickSize(sizes) {
    const px = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2);
    return px <= 1100 && sizes.includes('sm') ? 'sm' : sizes[0];
  }

  range(clipId) {
    const r = this.ranges[clipId];
    if (!r) throw new Error(`Clip "${clipId}" is in the config but not in the frame manifest.`);
    return r;
  }

  loadFrame(i) {
    const frame = this.frames[i];
    if (frame.promise) return frame.promise;
    frame.promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frame.img = img;
        // A frame the scroll position was waiting for has arrived.
        if (Math.abs(i - this.wanted) <= Math.abs(this.current - this.wanted)) this.draw(this.wanted);
        resolve();
      };
      img.onerror = resolve;
      img.src = frame.src;
    });
    return frame.promise;
  }

  /** Load frames [from, to] with limited concurrency; resolves when all are in. */
  async load(from, to, onProgress) {
    let next = from;
    let done = 0;
    const total = to - from + 1;
    const worker = async () => {
      while (next <= to) {
        await this.loadFrame(next++);
        onProgress?.(++done / total);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    const shown = this.current;
    this.current = -1;
    this.draw(shown < 0 ? this.wanted : shown);
  }

  /** Nearest frame that has finished loading, preferring earlier ones. */
  nearestLoaded(i) {
    for (let d = 0; d < this.frames.length; d++) {
      if (this.frames[i - d]?.img) return i - d;
      if (this.frames[i + d]?.img) return i + d;
    }
    return -1;
  }

  draw(index) {
    this.wanted = Math.max(0, Math.min(this.frames.length - 1, Math.round(index)));
    const i = this.nearestLoaded(this.wanted);
    if (i < 0 || i === this.current) return;
    this.current = i;
    const { img } = this.frames[i];
    const { width: cw, height: ch } = this.canvas;
    // object-fit: cover
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
}
