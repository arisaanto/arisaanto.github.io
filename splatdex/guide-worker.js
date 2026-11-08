import { env, pipeline } from './study-runtime/transformers.min.js';

const model = 'HuggingFaceTB/SmolLM2-360M-Instruct';
const revision = 'a10cc1512eabd3dde888204e902eca88bddb4951';
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = new URL('./study-runtime/', import.meta.url).href;

// Strawberry references: NC State Extension's Botany and Strawberry Production Guide.
const background = {
  strawberry: 'Each achene is a dry fruit with a wall that protects a single seed. An achene develops from a flower ovary after pollination and fertilization. Successful fertilization across the flower helps the fleshy receptacle develop evenly.',
  'banded-rock': 'The composition and geological type of this particular stone are unknown.'
};

let loading;
let currentStatus;

function loadModel() {
  if (loading) return loading;
  let lastPercentage = -1;
  loading = pipeline('text-generation', model, {
    revision,
    device: 'wasm',
    dtype: 'q4',
    progress_callback: progress => {
      if (progress.status === 'progress' && progress.total > 0 && progress.file.endsWith('.onnx')) {
        const percentage = Math.min(100, Math.floor(progress.progress / 5) * 5);
        if (lastPercentage === percentage) return;
        lastPercentage = percentage;
        currentStatus?.(`Downloading the language model (${percentage}%)`);
      }
    }
  }).catch(error => {
    loading = null;
    throw error;
  });
  return loading;
}

let requests = Promise.resolve();
self.onmessage = ({ data }) => {
  requests = requests.then(() => answerQuestion(data));
};

async function answerQuestion({ id, item, note, question, conversation = [] }) {
  const status = message => self.postMessage({ id, status: message });
  currentStatus = status;
  try {
    status('Loading the language model on this device…');
    const generate = await loadModel();
    status('Writing an answer…');
    const messages = [
      { role: 'system', content: 'You explain science in plain English. Use general scientific knowledge to answer the question in one to three short sentences. Use the object, note and reference facts as context. Avoid repeating the note verbatim. Do not invent details about this particular object. Say when you are unsure.' },
      ...conversation,
      { role: 'user', content: `Object: ${item.name}${item.latin ? ` (${item.latin})` : ''}\nNote: ${note.label}. ${note.note}\n${background[item.file] ? `Reference: ${background[item.file]}\n` : ''}Question: ${question}` }
    ];
    const [result] = await generate(messages, { max_new_tokens: 100, do_sample: false });
    const answer = result.generated_text.at(-1)?.content?.trim();
    if (!answer) throw new Error('Empty model response');
    self.postMessage({ id, answer });
  } catch (error) {
    console.error(error);
    self.postMessage({ id, error: 'The language model could not run on this device. Try again on a computer with a stable connection.' });
  } finally {
    currentStatus = null;
  }
}
