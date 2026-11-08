// Select changing, reasonably steady video views without counting frames as 3D coverage.
export function analyseFrame(bytes, width, height) {
    const grey = new Float32Array(width * height);
    let sum = 0, squares = 0;
    for (let i = 0; i < grey.length; i++) {
        const v = .2126 * bytes[i * 4] + .7152 * bytes[i * 4 + 1] + .0722 * bytes[i * 4 + 2];
        grey[i] = v; sum += v; squares += v * v;
    }
    const mean = sum / grey.length;
    let lap = 0, lapSquares = 0, count = 0;
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        const i = y * width + x, v = grey[i - 1] + grey[i + 1] + grey[i - width] + grey[i + width] - 4 * grey[i];
        lap += v; lapSquares += v * v; count++;
    }
    return { grey, mean, contrast: Math.sqrt(Math.max(0, squares / grey.length - mean * mean)), sharpness: Math.max(0, lapSquares / count - (lap / count) ** 2) };
}
export function frameDifference(a, b) {
    if (!a || !b) return 1;
    let sum = 0; const shift = a.mean - b.mean;
    for (let i = 0; i < a.grey.length; i++) sum += Math.abs(a.grey[i] - b.grey[i] - shift);
    return sum / a.grey.length / 255;
}

// Match the saved photograph to the full-screen camera preview.
export function videoCrop(video, aspect = video.clientWidth / video.clientHeight || video.videoWidth / video.videoHeight) {
    const width = video.videoWidth, height = video.videoHeight;
    const cropWidth = Math.min(width, height * aspect);
    const cropHeight = Math.min(height, width / aspect);
    return { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2,
        width: Math.round(cropWidth), height: Math.round(cropHeight), aspect };
}

export function framingQuality(bytes, width, height, aspect = 1, guideFraction = .64) {
    const sample = analyseFrame(bytes, width, height);
    if (sample.mean < 20) return { ready: false, message: 'Find softer, brighter light' };
    const border = [[], [], []];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (x > 3 && x < width - 4 && y > 3 && y < height - 4) continue;
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) border[channel].push(bytes[offset + channel]);
    }
    const background = border.map(values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]);
    const foreground = new Uint8Array(width * height);
    for (let i = 0; i < foreground.length; i++) {
        const delta = Math.hypot(...background.map((value, channel) => bytes[i * 4 + channel] - value));
        foreground[i] = Number(delta > 50);
    }
    const queue = new Uint16Array(width * height);
    let best;
    // Connected regions keep a hand or a small background mark from defining the frame.
    for (let start = 0; start < foreground.length; start++) {
        if (!foreground[start]) continue;
        let head = 0, tail = 1, left = width, right = 0, top = height, bottom = 0;
        queue[0] = start; foreground[start] = 0;
        while (head < tail) {
            const point = queue[head++], x = point % width, y = Math.floor(point / width);
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
            const neighbours = [];
            if (x) neighbours.push(point - 1);
            if (x + 1 < width) neighbours.push(point + 1);
            if (y) neighbours.push(point - width);
            if (y + 1 < height) neighbours.push(point + width);
            for (const neighbour of neighbours) {
                if (!foreground[neighbour]) continue;
                foreground[neighbour] = 0;
                queue[tail++] = neighbour;
            }
        }
        const cx = (left + right) / 2 / width, cy = (top + bottom) / 2 / height;
        const score = tail / (1 + 10 * Math.hypot(cx - .5, cy - .5));
        if (!best || score > best.score) best = { score, left, right, top, bottom, cx, cy };
    }
    if (!best || sample.contrast < 8) return { ready: false, message: 'Use a plain, contrasting surface' };
    if (Math.hypot((best.cx - .5) * aspect, best.cy - .5) > Math.min(aspect, 1) * guideFraction * .2) {
        return { ready: false, message: 'Centre the object in the circle' };
    }
    const extent = Math.max((best.right - best.left + 1) / width * aspect,
        (best.bottom - best.top + 1) / height) / Math.min(aspect, 1);
    if (extent < guideFraction * .5) return { ready: false, message: 'Move closer' };
    if (extent > guideFraction * .96) return { ready: false, message: 'Move back a little' };
    if (sample.sharpness < 12) return { ready: false, message: 'Hold steady to focus' };
    return { ready: true, message: 'Ready to scan' };
}
export class ViewSelector {
    constructor() { this.reset(); }
    reset() { this.previous = null; this.accepted = null; this.lastSaved = -Infinity; this.focus = []; }
    consider(frame, now) {
        const movement = frameDifference(frame, this.previous); this.previous = frame;
        this.focus.push(frame.sharpness); if (this.focus.length > 5) this.focus.shift();
        if (frame.mean < 24) return 'Find a brighter spot';
        if (frame.contrast < 5) return 'Keep the object in view';
        // A relative focus test alone eventually accepts a consistently blurred video.
        if (frame.sharpness < 12) return 'Hold steady to focus';
        if (movement > .12) return 'Move a little more slowly';
        if (frame.sharpness < Math.max(...this.focus) * .55) return 'Hold the phone steady';
        if (now - this.lastSaved < 700) return 'Capturing automatically';
        if (frameDifference(frame, this.accepted) < .012) return 'Move around the object';
        return 'save';
    }
    commit(frame, now) { this.accepted = frame; this.lastSaved = now; }
}
export class ContinuousCapture {
    constructor(video, { onPhoto, onStatus, onLimit, onTarget = () => {}, objectSelection, group, geometry, viewDirection, acceptView, maxViews = 180, maxBytes = 96_000_000 }) {
        Object.assign(this, { video, onPhoto, onStatus, onLimit, onTarget, objectSelection, group, viewDirection, acceptView, maxViews, maxBytes });
        this.count = 0; this.bytes = 0; this.selector = new ViewSelector();
        this.running = false; this.previewing = false; this.generation = 0; this.pending = null;
        this.geometry = geometry ?? videoCrop(video);
        this.analysis = document.createElement('canvas'); this.analysis.width = this.analysis.height = 96;
        this.analysisContext = this.analysis.getContext('2d', { willReadFrequently: true });
        this.frame = document.createElement('canvas');
    }
    startPreview() { if (this.previewing) return; this.previewing = true; this.tick(); }
    resume({ newSide = false } = {}) {
        if (newSide) this.selector.reset();
        this.running = true;
        if (!this.previewing) this.startPreview();
    }
    async pause() { this.running = false; if (this.pending) await this.pending; }
    stop() { this.running = false; this.previewing = false; clearTimeout(this.timer); this.generation++; }
    async tick() {
        if (!this.previewing || this.pending) return;
        const generation = this.generation;
        this.pending = this.sample(generation).catch(error => {
            if (generation === this.generation) { this.running = false; this.previewing = false; this.onLimit(error.message); }
        });
        await this.pending; this.pending = null;
        if (this.previewing && generation === this.generation) this.timer = setTimeout(() => this.tick(), 200);
    }
    async sample(generation) {
        const video = this.video;
        if (video.readyState < 2 || !video.videoWidth) return;
        const crop = videoCrop(video, this.geometry.aspect), wasRecording = this.running;
        if (Math.abs((video.clientWidth / video.clientHeight) / this.geometry.aspect - 1) > .2) {
            this.onStatus('Keep the phone in its starting orientation'); return;
        }
        // One frozen frame supplies the mask, quality check, pose and saved JPEG.
        // The camera preview continues independently while inference runs in a worker.
        const capturedAt = performance.now();
        if (this.frame.width !== this.geometry.width) this.frame.width = this.geometry.width;
        if (this.frame.height !== this.geometry.height) this.frame.height = this.geometry.height;
        this.frame.getContext('2d').drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, this.frame.width, this.frame.height);
        const direction = this.viewDirection?.() ?? null;
        let selected = null;
        if (this.objectSelection) {
            selected = await this.objectSelection.analyse(this.frame);
            if (generation !== this.generation) return;
            if (!selected.found || selected.message || !selected.stable) {
                const message = selected.message || 'Hold steady';
                this.onTarget({ ...selected, ready: false, message }); this.onStatus(message); return;
            }
        }
        const box = selected?.box ?? { x: .15, y: .15, width: .7, height: .7 };
        // Evaluate the object's interior at native capture resolution, not a
        // sharp table or fabric elsewhere in the photograph.
        const inset = selected ? .18 : 0;
        this.analysisContext.drawImage(this.frame, (box.x + box.width * inset) * this.frame.width,
            (box.y + box.height * inset) * this.frame.height, box.width * (1 - 2 * inset) * this.frame.width,
            box.height * (1 - 2 * inset) * this.frame.height, 0, 0, 96, 96);
        const frame = analyseFrame(this.analysisContext.getImageData(0, 0, 96, 96).data, 96, 96), now = capturedAt;
        let verdict = this.selector.consider(frame, now);
        if (verdict === 'Hold steady to focus') {
            this.focusWarningSince ??= now;
            if (now - this.focusWarningSince > 4000) verdict = 'Try softer light or a more detailed surface';
        } else this.focusWarningSince = null;
        const acceptable = verdict === 'save' || verdict === 'Capturing automatically' || verdict === 'Move around the object';
        this.onTarget({ ...selected, ready: acceptable, sharpness: frame.sharpness, message: acceptable ? '' : verdict });
        if (verdict !== 'save') { this.onStatus(verdict); return; }
        if (!this.running || !wasRecording) { this.onStatus('Ready to scan'); return; }
        const guidance = this.acceptView?.(direction);
        if (guidance) { this.onStatus(guidance); return; }
        if (this.count >= this.maxViews || this.bytes >= this.maxBytes) { this.running = false; this.onLimit('Scan is full'); return; }
        const side = this.group();
        const blob = await new Promise(resolve => this.frame.toBlob(resolve, 'image/jpeg', .92));
        if (!blob) throw Error('This view could not be saved');
        if (generation !== this.generation || !this.running) return;
        if (this.bytes + blob.size > this.maxBytes) { this.running = false; this.onLimit('Scan is full'); return; }
        this.count++; this.bytes += blob.size; this.selector.commit(frame, now);
        this.onPhoto(blob, null, { group: side, elapsedMs: Math.round(now), viewDirection: direction, usable: true, objectHint: selected?.hint ?? null });
        this.onStatus('Capturing automatically');
    }
}
