// Store-only ZIP export: JPEGs are already compressed. No media leaves the device.
const encoder = new TextEncoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    return c >>> 0;
});
function crc32(bytes) {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
function header(size) { const bytes = new Uint8Array(size); return { bytes, view: new DataView(bytes.buffer) }; }
function dosDate(value) {
    let date = new Date(value);
    if (!Number.isFinite(date.getTime())) date = new Date();
    const year = Math.max(1980, Math.min(2107, date.getFullYear()));
    return {
        date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
        time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
    };
}
export async function captureArchive(record, onProgress = () => {}) {
    if (!record || !Array.isArray(record.photos) || !record.photos.length) throw new Error('This capture has no saved photos');
    if (record.photos.length > 65532) throw new Error('Too many photos for a single export');
    if (record.photos.some(photo => !(photo instanceof Blob))) throw new Error('A saved photo could not be read');
    if (record.photos.reduce((total, photo) => total + photo.size, 0) > 2_000_000_000) throw new Error('This capture is too large for a single export');
    const names = record.photos.map((_, i) => `images/${String(i + 1).padStart(4, '0')}.jpg`);
    const metadata = {
        schema: 'splatdex-capture-v1', id: record.id, name: record.name,
        memory: record.memory || '', capturedAt: record.created,
        state: 'photos-saved', reconstruction: 'not-started', captureMethod: record.captureMethod || 'manual',
        photos: record.photos.map((photo, i) => ({ file: names[i], bytes: photo.size, mimeType: photo.type || 'image/jpeg', ...(record.viewGroups?.[i] ? { side: record.viewGroups[i] } : {}), ...(record.frameHints?.[i] ? { objectHint: record.frameHints[i] } : {}), ...(Number.isFinite(record.frameTimes?.[i]) ? { elapsedMs: record.frameTimes[i] } : {}) }))
    };
    const readme = 'Splatdex capture\n\nimages/ contains the original JPEG views in capture order.\ncapture.json contains the name, memory and capture date.\n\nThis archive is a photo capture, not a reconstructed 3D model.\nCamera poses have not been estimated. No photos were uploaded by this export.\nThe original capture is retained in the browser.\n';
    const files = [
        { name: 'capture.json', blob: new Blob([JSON.stringify(metadata, null, 2)]) },
        { name: 'README.txt', blob: new Blob([readme]) },
        ...record.photos.map((blob, i) => ({ name: names[i], blob }))
    ];
    const parts = [], directory = [];
    let offset = 0;
    const stamp = dosDate(record.created);
    for (const [i, file] of files.entries()) {
        const name = encoder.encode(file.name);
        const data = new Uint8Array(await file.blob.arrayBuffer());
        const crc = crc32(data);
        const local = header(30);
        local.view.setUint32(0, 0x04034b50, true);
        local.view.setUint16(4, 20, true);
        local.view.setUint16(6, 0x800, true);
        local.view.setUint16(10, stamp.time, true);
        local.view.setUint16(12, stamp.date, true);
        local.view.setUint32(14, crc, true);
        local.view.setUint32(18, data.length, true);
        local.view.setUint32(22, data.length, true);
        local.view.setUint16(26, name.length, true);
        parts.push(local.bytes, name, data);
        const entry = header(46);
        entry.view.setUint32(0, 0x02014b50, true);
        entry.view.setUint16(4, 20, true);
        entry.view.setUint16(6, 20, true);
        entry.view.setUint16(8, 0x800, true);
        entry.view.setUint16(12, stamp.time, true);
        entry.view.setUint16(14, stamp.date, true);
        entry.view.setUint32(16, crc, true);
        entry.view.setUint32(20, data.length, true);
        entry.view.setUint32(24, data.length, true);
        entry.view.setUint16(28, name.length, true);
        entry.view.setUint32(42, offset, true);
        directory.push(entry.bytes, name);
        offset += local.bytes.length + name.length + data.length;
        onProgress(i + 1, files.length);
    }
    const directorySize = directory.reduce((sum, data) => sum + data.length, 0);
    const end = header(22);
    end.view.setUint32(0, 0x06054b50, true);
    end.view.setUint16(8, files.length, true);
    end.view.setUint16(10, files.length, true);
    end.view.setUint32(12, directorySize, true);
    end.view.setUint32(16, offset, true);
    return new Blob([...parts, ...directory, end.bytes], { type: 'application/zip' });
}
export async function exportCapture(record, onProgress) {
    const blob = await captureArchive(record, onProgress);
    const url = URL.createObjectURL(blob);
    const name = String(record.name || 'capture').normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'capture';
    const file = new File([blob], `${name}-splatdex.zip`, { type: 'application/zip' });
    const link = document.createElement('a');
    link.href = url; link.download = file.name; document.body.append(link); link.click(); link.remove();
    // Leave time for mobile browsers to start reading the archive.
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return 'downloaded';
}
