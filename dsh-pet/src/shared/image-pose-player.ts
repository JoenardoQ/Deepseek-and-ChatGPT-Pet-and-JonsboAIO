import type { AtlasCell } from './pet-pack';
/** Draw one static pose. The clock only ends an action or drives window motion;
 * no interpolated frames, video decoder, or continuous canvas redraw is used. */
export class ImagePosePlayer {
  declare readonly canvas: HTMLCanvasElement;
  declare ready: boolean;
  declare duration: number;
  declare private startedAt: number;
  declare private generation: number;
  declare private timer: ReturnType<typeof setTimeout> | undefined;
  declare private ended: () => void;
  declare private request: AbortController | undefined;
  declare private finishRequested: boolean;
  get currentTime(): number {
    return Math.min(this.duration, (performance.now() - this.startedAt) / 1000);
  }
  constructor(container: HTMLElement) {
    this.ready = false;
    this.duration = 4;
    this.startedAt = 0;
    this.generation = 0;
    this.finishRequested = false;
    this.ended = () => {};
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.canvas.className = 'pet-image';
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      display: 'none',
    });
    container.appendChild(this.canvas);
  }
  stop(): void {
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.request?.abort();
    this.ready = false;
    this.finishRequested = false;
    this.canvas.style.display = 'none';
  }
  async play(url: string, once: boolean, ended: () => void, cell?: AtlasCell, durationMs = 4000): Promise<void> {
    this.stop();
    const generation = this.generation;
    this.ended = ended;
    this.request = new AbortController();
    const response = await fetch(url, { signal: AbortSignal.any([this.request.signal, AbortSignal.timeout(10000)]) });
    if (!response.ok) throw Error('Image HTTP ' + response.status);
    const bitmap = await createImageBitmap(await response.blob());
    try {
      if (generation !== this.generation) return;
      const cols = cell?.columns || 1,
        rows = cell?.rows || 1,
        index = cell?.index || 0;
      const sw = bitmap.width / cols,
        sh = bitmap.height / rows;
      const scale = Math.min(640 / sw, 360 / sh);
      const ctx = this.canvas.getContext('2d');
      if (!ctx) throw Error('Canvas unavailable');
      ctx.clearRect(0, 0, 640, 360);
      ctx.drawImage(
        bitmap,
        (index % cols) * sw,
        Math.floor(index / cols) * sh,
        sw,
        sh,
        (640 - sw * scale) / 2,
        360 - sh * scale,
        sw * scale,
        sh * scale,
      );
      this.duration = durationMs / 1000;
      this.startedAt = performance.now();
      this.ready = true;
      this.canvas.style.display = '';
      if (once || this.finishRequested)
        this.timer = setTimeout(() => {
          this.timer = undefined;
          if (generation === this.generation) this.ended();
        }, durationMs);
    } finally {
      bitmap.close();
    }
  }
  finishLoop(): void {
    this.finishRequested = true;
    if (!this.ready || this.timer !== undefined) return;
    const generation = this.generation;
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        if (generation === this.generation) this.ended();
      },
      Math.max(0, (this.duration - this.currentTime) * 1000),
    );
  }
  dispose(): void {
    this.stop();
    this.canvas.remove();
  }
}
