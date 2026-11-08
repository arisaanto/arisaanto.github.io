export async function captureRequest(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw Error('Open Splatdex and sign in before uploading');
  }
  const data = await response.json();
  if (!response.ok) { const error = Error(data.error ?? 'The upload could not finish'); error.status = response.status; throw error; }
  return data;
}
export async function uploadCapture(record, progress = () => {}, active = () => true, automatic = false) {
  const job = await captureRequest('/api/captures', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: record.id, name: record.name, category: record.category ?? '',
      memory: record.memory ?? '', frames: record.photos.length,
      viewGroups: record.viewGroups, frameTimes: record.frameTimes, frameHints: record.frameHints })
  });
  if (!active()) throw Error('Scan cancelled');
  if (job.state === 'failed') {
    if (automatic) return job; // All source frames already reached the server; show its corrective feedback.
    throw Error(job.error || 'This scan needs attention before retrying');
  }
  if (automatic && job.state === 'checked') return captureRequest(`/api/captures/${record.id}/reconstruct`, { method: 'POST' });
  if (job.state !== 'uploading') return job;
  const uploaded = new Set(job.uploadedFrames ?? []);
  progress(0, record.photos.length);
  for (const [index, photo] of record.photos.entries()) {
    if (!active()) throw Error('Scan cancelled');
    if (uploaded.has(index)) { progress(index + 1, record.photos.length); continue; }
    await captureRequest(`/api/captures/${record.id}/frames/${index}`, {
      method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: photo
    });
    progress(index + 1, record.photos.length);
  }
  if (!active()) throw Error('Scan cancelled');
  return captureRequest(`/api/captures/${record.id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ automatic }) });
}
