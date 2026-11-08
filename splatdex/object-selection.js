export class ObjectSelection {
  constructor() {
    this.point = null; this.box = null; this.generation = 0; this.sequence = 0; this.stable = 0;
    this.worker = new Worker(new URL('./object-selection-worker.js', import.meta.url));
    this.ready = new Promise((resolve, reject) => { this.resolveReady = resolve; this.rejectReady = reject; });
    // Avoid an unhandled rejection if the camera closes before its first sample.
    this.ready.catch(() => {});
    this.worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { this.loaded = true; this.resolveReady(); return; }
      if (data.type === 'error') {
        const error = Error('Object selection could not run. Reopen the camera to retry');
        if (!this.loaded) this.rejectReady(error);
        this.pending?.reject(error); this.pending = null; return;
      }
      if (this.pending?.id === data.id) { const pending = this.pending; this.pending = null; pending.resolve(data.target); }
    };
    this.worker.onerror = () => { const error = Error('Object selection is unavailable in this browser'); this.rejectReady(error); this.pending?.reject(error); this.pending = null; };
    this.worker.postMessage({ type: 'init' });
  }
  select(x, y) { this.generation++; this.point = { x, y }; this.box = null; this.stable = 0; }
  reset() { this.generation++; this.point = null; this.box = null; this.stable = 0; }
  async analyse(canvas) {
    if (!this.loaded) await this.ready;
    if (!this.point) return { found: false, ready: false, message: 'Tap the object' };
    const generation = this.generation, point = { ...this.point }, previous = this.box;
    this.input ??= document.createElement('canvas');
    const scale = Math.min(1, 640 / Math.max(canvas.width, canvas.height));
    const width = Math.round(canvas.width * scale), height = Math.round(canvas.height * scale);
    if (this.input.width !== width) this.input.width = width;
    if (this.input.height !== height) this.input.height = height;
    this.input.getContext('2d').drawImage(canvas, 0, 0, this.input.width, this.input.height);
    const image = await createImageBitmap(this.input);
    if (generation !== this.generation || this.closed) { image.close(); return { found: false, ready: false, message: 'Tap the object' }; }
    const id = ++this.sequence;
    const result = await new Promise((resolve, reject) => { this.pending = { id, resolve, reject }; this.worker.postMessage({ type: 'frame', id, image, point, previous, session: generation }, [image]); });
    if (generation !== this.generation || this.closed) return { found: false, ready: false, message: 'Tap the object' };
    if (result.found) { this.point = { x: result.hint.point[0], y: result.hint.point[1] }; this.box = result.box; this.stable++; }
    else this.stable = 0;
    return { ...result, stable: this.stable >= 2 };
  }
  close() { this.closed = true; this.generation++; this.worker.terminate(); this.rejectReady(Error('Camera closed')); this.pending?.reject(Error('Camera closed')); this.pending = null; }
}
