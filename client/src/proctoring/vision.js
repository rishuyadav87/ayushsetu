// Camera AI for proctoring, powered by @vladmandic/human (TensorFlow.js, runs fully in the browser).
// Models are self-hosted in /public/models — no video frames ever leave the device.
//
// Per frame it reports: number of faces, head pose + gaze, mouth opening (for lip/voice sync),
// anti-spoofing + liveness scores (photo / screen held up to the camera), a face embedding for
// identity checks and — on demand — objects in the room (mobile phone, extra person, books, screens).

let humanPromise = null;

export const VISION_MODEL_NAME = 'Human 3.3 (BlazeFace + FaceMesh + Iris + FaceRes + AntiSpoof + Liveness + CenterNet)';

const baseConfig = () => ({
  debug: false,
  backend: 'webgl',
  modelBasePath: `${import.meta.env.BASE_URL || '/'}models/`,
  async: true,
  warmup: 'none',
  cacheSensitivity: 0,
  filter: { enabled: true, equalization: false, flip: false },
  face: {
    enabled: true,
    detector: { rotation: false, maxDetected: 5, minConfidence: 0.5, skipFrames: 2, skipTime: 500, return: false },
    mesh: { enabled: true },
    attention: { enabled: false },
    iris: { enabled: true },
    description: { enabled: true, skipFrames: 6, skipTime: 2500 },
    emotion: { enabled: false },
    antispoof: { enabled: true, skipFrames: 6, skipTime: 2000 },
    liveness: { enabled: true, skipFrames: 6, skipTime: 2000 },
    gear: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  segmentation: { enabled: false },
  gesture: { enabled: true },
  object: { enabled: false, minConfidence: 0.35, maxDetected: 10, skipFrames: 0, skipTime: 0 },
});

export const loadVision = () => {
  if (!humanPromise) {
    humanPromise = (async () => {
      const { Human } = await import('@vladmandic/human');
      const human = new Human(baseConfig());
      await human.load({ object: { enabled: true } }); // preload object detector too
      return human;
    })().catch((err) => {
      humanPromise = null;
      throw err;
    });
  }
  return humanPromise;
};

const OBJECT_LABELS = {
  phone: ['cell phone'],
  person: ['person'],
  book: ['book'],
  screen: ['laptop', 'tv', 'remote'],
};

/**
 * @param {HTMLVideoElement} video
 * @param {{ objects?: boolean }} opts
 */
export const analyseFrame = async (video, { objects = false } = {}) => {
  const human = await loadVision();
  if (!video || video.readyState < 2 || !video.videoWidth) return null;

  const result = await human.detect(video, { object: { enabled: objects } });
  if (result.error) throw new Error(result.error);

  const faces = (result.face || [])
    .filter(f => (f.boxScore ?? f.score ?? 0) >= 0.5)
    .map((f, index) => {
      const gestures = (result.gesture || []).filter(g => g.face === f.id || g.iris === f.id).map(g => g.gesture);
      const mouthGesture = gestures.find(g => typeof g === 'string' && g.startsWith('mouth'));
      const mouthOpen = mouthGesture ? Number((mouthGesture.match(/(\d+)%/) || [])[1] || 0) / 100 : 0;
      const angle = f.rotation?.angle || {};
      return {
        index,
        box: f.box,
        size: f.box ? f.box[2] * f.box[3] : 0,
        yaw: angle.yaw ?? 0,
        pitch: angle.pitch ?? 0,
        gazeStrength: f.rotation?.gaze?.strength ?? 0,
        // gaze + head pose together to avoid false alarms from a slightly tilted webcam
        lookingAway: Math.abs(angle.yaw ?? 0) > 0.6 || (angle.pitch ?? 0) > 0.5 ||
          (gestures.some(g => /looking (left|right|down)/.test(g)) && (Math.abs(angle.yaw ?? 0) > 0.35 || (angle.pitch ?? 0) > 0.35)),
        lookingDown: (angle.pitch ?? 0) > 0.5 || (gestures.some(g => g === 'looking down') && (angle.pitch ?? 0) > 0.3),
        mouthOpen,
        real: typeof f.real === 'number' ? f.real : null,
        live: typeof f.live === 'number' ? f.live : null,
        embedding: Array.isArray(f.embedding) && f.embedding.length ? f.embedding : null,
      };
    })
    .sort((a, b) => b.size - a.size);

  let found = null;
  if (objects) {
    found = { phone: 0, person: 0, book: 0, screen: 0, labels: [] };
    for (const o of result.object || []) {
      for (const [key, labels] of Object.entries(OBJECT_LABELS)) {
        if (labels.includes(o.label)) {
          found[key] += 1;
          found.labels.push(`${o.label} ${Math.round(o.score * 100)}%`);
        }
      }
    }
  }

  return { faceCount: faces.length, faces, primary: faces[0] || null, objects: found };
};

export const faceSimilarity = async (a, b) => {
  const human = await loadVision();
  return human.match.similarity(a, b);
};

// Small JPEG evidence snapshot
export const captureFrame = (source, width = 160, quality = 0.6) => {
  try {
    const w = source?.videoWidth || source?.width;
    const h = source?.videoHeight || source?.height;
    if (!w || !h) return null;
    const height = Math.round((h / w) * width);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (_) {
    return null;
  }
};
