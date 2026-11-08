let worker;
let nextId = 0;

export function askBrowser(data, signal, status) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    worker ??= new Worker(new URL('./guide-worker.js', import.meta.url), { type: 'module' });
    const active = worker;
    const id = ++nextId;
    const timer = setTimeout(() => fail(new Error('The study guide took too long. Try again.')), 210_000);
    function cleanup() {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      active.removeEventListener('message', receive);
      active.removeEventListener('error', unavailable);
    }
    function fail(error) {
      active.terminate();
      if (worker === active) worker = null;
      cleanup();
      reject(error);
    }
    function abort() {
      cleanup();
      reject(signal.reason);
    }
    function unavailable() { fail(new Error('The study guide could not load in this browser.')); }
    function receive(event) {
      if (event.data.id !== id) return;
      if (event.data.status) return status(event.data.status);
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.answer);
    }
    signal.addEventListener('abort', abort, { once: true });
    active.addEventListener('message', receive);
    active.addEventListener('error', unavailable);
    status('Preparing the study guide…');
    active.postMessage({ id, ...data });
  });
}
