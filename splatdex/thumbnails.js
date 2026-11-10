const size = 384;
const normalized = new Map();

function normalizeCanvas(source) {
  const input = document.createElement('canvas');
  input.width = source.naturalWidth ?? source.width;
  input.height = source.naturalHeight ?? source.height;
  const context = input.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, input.width, input.height).data;
  let left = input.width, top = input.height, right = -1, bottom = -1;
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      if (pixels[(y * input.width + x) * 4 + 3] < 24) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw Error('The thumbnail has no visible object');
  const width = right - left + 1, height = bottom - top + 1;
  const scale = size * .82 / Math.max(width, height);
  const output = document.createElement('canvas');
  output.width = output.height = size;
  output.getContext('2d').drawImage(input, left, top, width, height,
    (size - width * scale) / 2, (size - height * scale) / 2, width * scale, height * scale);
  return output;
}

export function thumbnailImage(image, source) {
  image.dataset.thumbnailSource = source;
  if (!normalized.has(source)) {
    const loading = new Image();
    loading.src = source;
    normalized.set(source, loading.decode().then(() => normalizeCanvas(loading).toDataURL('image/png')));
  }
  normalized.get(source).then(url => {
    if (image.dataset.thumbnailSource === source) image.src = url;
  }).catch(() => {
    if (image.dataset.thumbnailSource === source) image.src = source;
  });
}
