const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function objectRegion(probability, width, height, point, previous = null) {
  const selectedX = clamp(Math.round(point.x * (width - 1)), 0, width - 1);
  const selectedY = clamp(Math.round(point.y * (height - 1)), 0, height - 1);
  const foreground = new Uint8Array(width * height);
  for (let i = 0; i < foreground.length; i++) foreground[i] = Number(probability[i] >= .65);
  // Only the connected object at the selected point can become the target.
  let start = selectedY * width + selectedX;
  if (!foreground[start]) {
    let nearest = Infinity;
    for (let y = Math.max(0, selectedY - 4); y <= Math.min(height - 1, selectedY + 4); y++) for (let x = Math.max(0, selectedX - 4); x <= Math.min(width - 1, selectedX + 4); x++) {
      const d = (x - selectedX) ** 2 + (y - selectedY) ** 2;
      if (foreground[y * width + x] && d < nearest) { start = y * width + x; nearest = d; }
    }
    if (!Number.isFinite(nearest)) return { found: false, message: 'Tap the object again' };
  }
  const queue = new Uint32Array(width * height); let head = 0, count = 1, left = width, right = 0, top = height, bottom = 0, sx = 0, sy = 0, confidence = 0;
  queue[0] = start; foreground[start] = 0;
  while (head < count) {
    const i = queue[head++], x = i % width, y = Math.floor(i / width);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    sx += x; sy += y; confidence += probability[i];
    for (const next of [x ? i - 1 : -1, x + 1 < width ? i + 1 : -1, y ? i - width : -1, y + 1 < height ? i + width : -1]) {
      if (next >= 0 && foreground[next]) { foreground[next] = 0; queue[count++] = next; }
    }
  }
  const fraction = count / (width * height), box = { x: left / width, y: top / height, width: (right - left + 1) / width, height: (bottom - top + 1) / height };
  const fail = message => ({ found: false, message, box });
  if (fraction < .002 || fraction > .65 || confidence / count < .75) return fail('Tap the object again');
  if (previous) {
    const a = previous.width * previous.height, b = box.width * box.height;
    const shift = Math.hypot((box.x + box.width / 2 - previous.x - previous.width / 2) * width, (box.y + box.height / 2 - previous.y - previous.height / 2) * height) / Math.min(width, height);
    if (b > a * 2.8 || b < a * .3 || shift > .32) return fail('Tap the object again');
  }
  if (left <= 2 || right >= width - 3 || top <= 2 || bottom >= height - 3) return fail('Bring the whole object into view');
  const cx = sx / count, cy = sy / count;
  // A centroid may lie in a hole. Keep the next prompt inside this component.
  let nextPoint = start, best = Infinity;
  for (let k = 0; k < count; k++) {
    const i = queue[k], x = i % width, y = Math.floor(i / width);
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (probability[i] >= .85 && d < best) { best = d; nextPoint = i; }
  }
  const extent = Math.max(box.width * width, box.height * height) / Math.min(width, height);
  const hint = { box: [box.x, box.y, box.x + box.width, box.y + box.height].map(v => +v.toFixed(4)), point: [(nextPoint % width + .5) / width, (Math.floor(nextPoint / width) + .5) / height].map(v => +v.toFixed(4)) };
  return { found: true, box, hint, extent, confidence: confidence / count, message: extent < .28 ? 'Move closer' : extent > .88 ? 'Move back a little' : '' };
}

// A small normalized template predicts image motion between segmentation calls.
// It never certifies a target: every prediction is checked by the segmenter.
export class TargetMotion {
  reset() { this.template = null; }
  commit(bytes, width, height, box, point) {
    this.width = width; this.height = height; this.box = { ...box }; this.point = { ...point };
    this.template = this.patch(bytes, width, height, box);
  }
  patch(bytes, width, height, box) {
    const values = new Float32Array(16 * 16); let sum = 0, squares = 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = clamp(Math.round((box.x + (x + .5) / 16 * box.width) * width), 0, width - 1);
      const py = clamp(Math.round((box.y + (y + .5) / 16 * box.height) * height), 0, height - 1);
      const i = (py * width + px) * 4, value = bytes[i] * .2126 + bytes[i + 1] * .7152 + bytes[i + 2] * .0722;
      values[y * 16 + x] = value; sum += value; squares += value * value;
    }
    const mean = sum / values.length, norm = Math.sqrt(Math.max(0, squares - values.length * mean * mean));
    return { values, mean, norm };
  }
  estimate(bytes, width, height) {
    if (!this.template || this.template.norm < 10 || width !== this.width || height !== this.height) return null;
    const old = this.box, short = Math.min(width, height), range = short * .25;
    let best = null;
    for (const scale of [.85, 1, 1.15]) for (let dy = -range; dy <= range; dy += 4) for (let dx = -range; dx <= range; dx += 4) {
      const box = { x: old.x + dx / width - old.width * (scale - 1) / 2, y: old.y + dy / height - old.height * (scale - 1) / 2, width: old.width * scale, height: old.height * scale };
      if (box.x < 0 || box.y < 0 || box.x + box.width > 1 || box.y + box.height > 1) continue;
      const patch = this.patch(bytes, width, height, box); if (patch.norm < 10) continue;
      let dot = 0;
      for (let i = 0; i < patch.values.length; i++) dot += (patch.values[i] - patch.mean) * (this.template.values[i] - this.template.mean);
      const correlation = dot / (patch.norm * this.template.norm);
      const score = correlation - .05 * Math.hypot(dx, dy) / Math.max(1, range) - .03 * Math.abs(scale - 1);
      if (!best || score > best.score) best = { score, correlation, box };
    }
    if (!best || best.correlation < .5) return null;
    return { x: clamp(best.box.x + (this.point.x - old.x) / old.width * best.box.width, .005, .995), y: clamp(best.box.y + (this.point.y - old.y) / old.height * best.box.height, .005, .995) };
  }
}
