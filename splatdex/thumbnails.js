import * as pc from './vendor/playcanvas.mjs';

const size = 384;
const normalized = new Map();
let renderQueue = Promise.resolve();

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

async function renderThumbnail(item) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  canvas.style.cssText = 'position:fixed;left:-1024px;top:0;width:512px;height:512px;pointer-events:none';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  let renderer, asset;
  try {
    renderer = new pc.Application(canvas, {
      graphicsDeviceOptions: { alpha: true, antialias: false, preserveDrawingBuffer: true }
    });
    renderer.graphicsDevice.maxPixelRatio = 1;
    renderer.resizeCanvas(512, 512);
    const frame = item.cameraFrame;
    const center = new pc.Vec3(...frame.center);
    const camera = new pc.Entity('Thumbnail camera', renderer);
    camera.addComponent('camera', {
      clearColor: new pc.Color(0, 0, 0, 0), fov: 45,
      nearClip: frame.radius * .005, farClip: frame.radius * 100
    });
    camera.setPosition(center.clone().add(new pc.Vec3(...frame.front).mulScalar(frame.radius * 3.8)));
    camera.lookAt(center, new pc.Vec3(...frame.up));
    renderer.root.addChild(camera);
    asset = new pc.Asset('Capture thumbnail', 'gsplat', { url: item.url, filename: 'model.ply' });
    await new Promise((resolve, reject) => {
      asset.once('load', resolve);
      asset.once('error', reject);
      renderer.assets.add(asset);
      renderer.assets.load(asset);
    });
    const object = new pc.Entity('Captured object', renderer);
    object.addComponent('gsplat', { asset });
    renderer.root.addChild(object);
    renderer.start();
    // Gaussian sorting runs asynchronously. Wait for a populated frame.
    let thumbnail;
    for (let attempt = 0; attempt < 12; attempt++) {
      for (let frameIndex = 0; frameIndex < 4; frameIndex++) {
        await new Promise(resolve => renderer.once('postrender', resolve));
      }
      try { thumbnail = normalizeCanvas(canvas); break; }
      catch { /* The first frames may precede the sorter response. */ }
    }
    if (!thumbnail) throw Error('The splat thumbnail could not render');
    return await new Promise((resolve, reject) => thumbnail.toBlob(
      blob => blob ? resolve(blob) : reject(Error('The thumbnail could not be saved')), 'image/png'));
  } finally {
    renderer?.destroy();
    canvas.remove();
  }
}

export function renderCaptureThumbnail(item) {
  const result = renderQueue.then(() => renderThumbnail(item));
  renderQueue = result.catch(() => {});
  return result;
}
