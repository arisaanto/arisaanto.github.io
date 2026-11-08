import { captureRequest } from './capture-sync.js';

export function nativeCaptureBridge() { return globalThis.webkit?.messageHandlers?.splatdexNative; }
export function startNativeCapture(category) {
  const bridge = nativeCaptureBridge();
  if (!bridge) return false;
  void bridge.postMessage({ type: 'capture', category: category ?? '', dark: Boolean(globalThis.document?.body?.classList.contains('dark')) });
  return true;
}
function bytes(base64) {
  const decoded = atob(base64), result = new Uint8Array(decoded.length);
  for (let i=0;i<decoded.length;i++) result[i]=decoded.charCodeAt(i);
  return result;
}
export function wireNativeCapture(refresh) {
  let uploading = false;
  async function resume() {
    const bridge = nativeCaptureBridge();
    if (!bridge || uploading) return;
    uploading = true;
    try {
      for (const id of await bridge.postMessage({type:'deletions'})) {
        await globalThis.splatdexNativeDelete(id);
        await bridge.postMessage({type:'deleted',ids:[id]});
      }
      for (;;) {
        const input = await bridge.postMessage({ type: 'manifest' });
        if (!input) break;
        const job = await captureRequest('/api/captures', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input) });
        if (job.state === 'uploading') {
          const uploaded = new Set(job.uploadedFrames ?? []);
          for (let i=0;i<input.frames;i++) {
            if (uploaded.has(i)) continue;
            const photo = bytes(await bridge.postMessage({ type:'photo',id:input.id,index:i }));
            await captureRequest(`/api/captures/${input.id}/frames/${i}`,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:photo});
          }
          const data = bytes(await bridge.postMessage({ type:'data',id:input.id }));
          await captureRequest(`/api/captures/${input.id}/native-data`,{method:'PUT',headers:{'Content-Type':'application/json'},body:data});
          await captureRequest(`/api/captures/${input.id}/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({automatic:true})});
        }
        await bridge.postMessage({type:'queued',id:input.id});
        await refresh();
      }
    } catch(error) {
      await bridge.postMessage({type:'upload-failed',message:error.message}).catch(()=>{});
    } finally { uploading=false; }
  }
  globalThis.splatdexNativeDelete = async id => {
    try { return await captureRequest(`/api/captures/${encodeURIComponent(id)}`,{method:'DELETE'}); }
    catch(error) {
      // A never-uploaded local capture has no remote record to remove.
      if(error.status===404)return {deleted:true};
      throw error;
    }
  };
  addEventListener('splatdex:native-ready',()=>{void resume();});
  addEventListener('online',()=>{void resume();});
  addEventListener('visibilitychange',()=>{if(!document.hidden)void resume();});
  return resume;
}
export function releaseNativeSources(data) {
  const bridge=nativeCaptureBridge();
  if(!bridge)return;
  const ids=[...(data.deletedCaptureIds??[]),...(data.captures??[]).filter(item=>item.state==='complete').map(item=>item.id)];
  if(ids.length)void bridge.postMessage({type:'release',ids}).catch(()=>{});
}
