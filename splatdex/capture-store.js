// Photos are appended individually: checkpoints do not rewrite the entire scan.
export class CaptureStore {
  constructor(name = 'splatdex') {
    this.ready = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('captures')) request.result.createObjectStore('captures', { keyPath: 'id' });
        if (!request.result.objectStoreNames.contains('capturePhotos')) request.result.createObjectStore('capturePhotos', { keyPath: ['id', 'index'] });
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Close other Splatdex tabs, then reopen to save scans'));
    });
  }
  async transaction(mode, run) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      let tx;
      try { tx = db.transaction(['captures', 'capturePhotos'], mode, { durability: mode === 'readwrite' ? 'strict' : 'default' }); }
      catch { tx = db.transaction(['captures', 'capturePhotos'], mode); }
      let result;
      tx.oncomplete = () => resolve(typeof result === 'function' ? result() : result);
      tx.onerror = tx.onabort = () => reject(tx.error ?? Error('The scan could not be saved'));
      try { result = run(tx.objectStore('captures'), tx.objectStore('capturePhotos')); }
      catch (error) { tx.abort(); reject(error); }
    });
  }
  range(id) { return IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]); }
  async save(record) {
    const photos = record.photos;
    const written = await this.transaction('readwrite', (records, frames) => {
      let changed = false;
      const get = records.get(record.id);
      get.onsuccess = () => {
        const old = get.result;
        // A queued/deleted capture cannot be resurrected by a late checkpoint.
        if (old?.state === 'discarding' && record.state !== 'discarding') return;
        if (old?.state === 'pending-upload' && record.state === 'draft') return;
        const savedCount = old?.storedFrames ?? 0;
        if (photos && photos.length < savedCount) return;
        if (photos) for (let index = savedCount; index < photos.length; index++) frames.put({ id: record.id, index, photo: photos[index] });
        const metadata = { ...old, ...record };
        delete metadata.photos;
        metadata.storedFrames = photos ? photos.length : savedCount;
        metadata.sourceBytes = photos ? photos.reduce((sum, blob) => sum + blob.size, 0) : old?.sourceBytes ?? 0;
        records.put(metadata); changed = true;
      };
      return () => changed;
    });
    if (!written) return false;
    // Read back committed metadata and all keys before displaying green.
    if (photos) {
      const proof = await this.transaction('readonly', (records, frames) => {
        const metadata = records.get(record.id), count = frames.count(this.range(record.id));
        return () => ({ record: metadata.result, count: count.result });
      });
      if (proof.record?.storedFrames !== photos.length || proof.count !== photos.length || proof.record?.sourceBytes !== photos.reduce((n, p) => n + p.size, 0)) throw Error('The scan was not saved completely. Free some space and try again');
    }
    return true;
  }
  async list() {
    return this.transaction('readonly', (records, frames) => {
      const all = records.getAll(), allFrames = frames.getAll();
      return () => {
        const byId = new Map();
        for (const frame of allFrames.result) {
          if (!byId.has(frame.id)) byId.set(frame.id, []);
          byId.get(frame.id)[frame.index] = frame.photo;
        }
        return all.result.map(record => ({ ...record, photos: byId.get(record.id) ?? record.photos ?? [] }));
      };
    });
  }
  async releaseSources(id, state = 'uploaded') {
    await this.transaction('readwrite', (records, frames) => {
      frames.delete(this.range(id));
      const get = records.get(id);
      get.onsuccess = () => {
        if (!get.result || (get.result.state === 'discarding' && state !== 'discarding')) return;
        const record = { ...get.result, state, storedFrames: 0, sourceBytes: 0 };
        delete record.photos; records.put(record);
      };
    });
  }
  async remove(id) { await this.transaction('readwrite', (records, frames) => { records.delete(id); frames.delete(this.range(id)); }); }
}
