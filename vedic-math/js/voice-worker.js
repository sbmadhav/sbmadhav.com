/* Natural voice worker: runs Kokoro (kokoro-js, Apache-2.0) off the main thread so the page stays smooth.
   It is only created after the player opts in to the natural voice. The library comes from jsDelivr;
   the model and voice files come from Hugging Face and are kept in the browser cache after the first download. */
const LIB = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let tts = null;
const queue = [];
let busy = false;

async function load() {
  try {
    const { KokoroTTS } = await import(LIB);
    tts = await KokoroTTS.from_pretrained(MODEL, {
      dtype: 'q8', // model_quantized.onnx, about 92 MB
      device: 'wasm',
      progress_callback: p => { if (p && p.status === 'progress') postMessage({ type: 'progress', file: p.file, loaded: p.loaded, total: p.total }); }
    });
    // Warm up once so the first real phrase is quicker (also fetches the default voice file)
    await tts.generate('Hi.', { voice: 'af_heart' });
    postMessage({ type: 'ready' });
  } catch (e) {
    postMessage({ type: 'error', message: String((e && e.message) || e) });
  }
}

async function drain() {
  if (busy) return; busy = true;
  while (queue.length) {
    const { id, text, voice, speed } = queue.shift();
    try {
      const out = await tts.generate(text, { voice, speed });
      const audio = out.audio instanceof Float32Array ? out.audio : new Float32Array(out.audio);
      postMessage({ type: 'audio', id, audio, rate: out.sampling_rate }, [audio.buffer]);
    } catch (e) {
      postMessage({ type: 'genError', id, message: String((e && e.message) || e) });
    }
  }
  busy = false;
}

self.onmessage = ({ data }) => {
  if (data.type === 'load') load();
  else if (data.type === 'clear') { queue.splice(0).forEach(q => postMessage({ type: 'genError', id: q.id, message: 'cancelled' })); }
  else if (data.type === 'gen') {
    if (!tts) { postMessage({ type: 'genError', id: data.id, message: 'not loaded' }); return; }
    queue.push(data); drain();
  }
};
