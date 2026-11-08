importScripts('./vendor/object-selection/vision_bundle.js');
let model, region, motion, motionSession;
const preview = new OffscreenCanvas(1, 1);
const context = preview.getContext('2d', { willReadFrequently: true });
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const module = await import('./object-tracker.js'); region = module.objectRegion; motion = new module.TargetMotion();
      const files = await Vision.FilesetResolver.forVisionTasks(new URL('./vendor/object-selection/wasm', self.location).href);
      model = await Vision.InteractiveSegmenterLegacy.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL('./vendor/object-selection/magic_touch.tflite', self.location).href, delegate: 'CPU' },
        outputConfidenceMasks: true, outputCategoryMask: false
      });
      self.postMessage({ type: 'ready' }); return;
    }
    if (motionSession !== data.session) { motion.reset(); motionSession = data.session; }
    const scale = Math.min(1, 256 / Math.max(data.image.width, data.image.height));
    const width = Math.round(data.image.width * scale), height = Math.round(data.image.height * scale);
    if (preview.width !== width) preview.width = width;
    if (preview.height !== height) preview.height = height;
    context.drawImage(data.image, 0, 0, preview.width, preview.height);
    const pixels = context.getImageData(0, 0, preview.width, preview.height).data;
    const point = motion.estimate(pixels, preview.width, preview.height) ?? data.point;
    const result = model.segment(data.image, { keypoint: point });
    try {
      const mask = result.confidenceMasks[0];
      const target = region(mask.getAsFloat32Array(), mask.width, mask.height, point, data.previous);
      if (target.found) motion.commit(pixels, preview.width, preview.height, target.box, { x: target.hint.point[0], y: target.hint.point[1] });
      self.postMessage({ type: 'target', id: data.id, target });
    } finally { result.close(); data.image.close(); }
  } catch (error) {
    data.image?.close(); self.postMessage({ type: 'error', id: data.id, message: error.message });
  }
};
