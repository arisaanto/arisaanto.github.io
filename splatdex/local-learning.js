const model = 'qwen3-vl:2b-instruct';

export function supportsLocalQuestions() {
  return ['localhost', '127.0.0.1'].includes(location.hostname);
}

export async function askAboutView(item, canvas, question, signal) {
  const snapshot = document.createElement('canvas');
  const scale = Math.min(1, 512 / Math.max(canvas.width, canvas.height));
  snapshot.width = Math.max(1, Math.round(canvas.width * scale));
  snapshot.height = Math.max(1, Math.round(canvas.height * scale));
  const context = snapshot.getContext('2d');
  context.fillStyle = '#808080';
  context.fillRect(0, 0, snapshot.width, snapshot.height);
  context.drawImage(canvas, 0, 0, snapshot.width, snapshot.height);
  const image = snapshot.toDataURL('image/jpeg', .85).split(',')[1];
  const messages = [
    { role: 'system', content: 'You are a museum guide. The catalog identifies this object. Answer in at most two sentences. For questions about appearance, describe visible color, shape and texture, and stop there. For other questions, separate catalog facts from general background. Do not guess identity, age, origin, composition, cause, condition or scale from the image. Say when the image and notes are insufficient.' },
    { role: 'user', content: `Catalog entry: ${item.name}. ${item.latin}. ${item.description} ${item.part}\n\nQuestion: ${question}`, images: [image] }
  ];

  let response;
  try {
    response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false, options: { num_predict: 140, temperature: .2 } }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(120_000)])
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('The model took too long to answer. Try again.');
    if (signal.aborted) throw error;
    throw new Error('Could not reach Ollama. Start it on this Mac and try again.');
  }
  if (response.status === 404) throw new Error(`Download the model with ollama pull ${model}`);
  if (!response.ok) throw new Error('Ollama could not answer. Check that the model is running.');
  const answer = (await response.json()).message?.content?.trim();
  if (!answer) throw new Error('The model returned an empty answer. Try a shorter question.');
  return answer;
}
