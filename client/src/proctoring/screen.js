// Entire-screen sharing + "screen sync" verification.
//
// The candidate must share their ENTIRE screen (not a tab or a window). While the test runs in full
// screen, a tiny marker in the top-left corner shows a rotating colour code. We sample the shared
// screen and check that the same code is visible at the same place. If it is not, then the shared
// screen is not the one showing the test (second monitor, remote-desktop session, virtual display,
// or another window covering the test) and a violation is raised.

export const SYNC_PALETTE = [
  [255, 0, 0], [0, 200, 0], [0, 0, 255], [255, 220, 0], [255, 0, 255], [0, 220, 220],
];
export const MARKER_CELL_PX = 14;   // CSS px per cell; marker is 2 x 2 cells
export const SYNC_INTERVAL_MS = 2000;

export const randomCode = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * SYNC_PALETTE.length));

export const isScreenShareSupported = () => Boolean(navigator.mediaDevices?.getDisplayMedia);

export class ScreenShareError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const requestEntireScreen = async () => {
  if (!isScreenShareSupported()) {
    throw new ScreenShareError('UNSUPPORTED', 'Screen sharing is not supported in this browser. Use the latest Chrome, Edge or Firefox on a laptop/desktop.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor', frameRate: { ideal: 5, max: 10 } },
      audio: false,
      monitorTypeSurfaces: 'include',
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      systemAudio: 'exclude',
    });
  } catch (err) {
    throw new ScreenShareError('DENIED', 'Screen sharing was cancelled. You must share your entire screen to take this test.');
  }
  const track = stream.getVideoTracks()[0];
  const surface = track?.getSettings?.().displaySurface;
  if (surface && surface !== 'monitor') {
    stream.getTracks().forEach(t => t.stop());
    throw new ScreenShareError('NOT_ENTIRE_SCREEN', 'Please choose "Entire screen" — sharing a single tab or window is not allowed.');
  }
  return stream;
};

const nearestPaletteIndex = ([r, g, b]) => {
  let best = -1;
  let bestDist = Infinity;
  SYNC_PALETTE.forEach(([pr, pg, pb], i) => {
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return bestDist < 120 ** 2 ? best : -1; // too far from every palette colour => unknown
};

/**
 * Read the 2x2 marker from a screen frame.
 * @param {CanvasImageSource} frameSource video element with the shared screen
 * @param {number} viewportW CSS width of the test page (full screen)
 * @param {number} viewportH CSS height
 * @returns {number[]|null} palette indices for the 4 cells, -1 when a cell is unreadable
 */
export const readMarker = (frameSource, viewportW, viewportH, canvas = document.createElement('canvas')) => {
  const fw = frameSource.videoWidth || frameSource.width;
  const fh = frameSource.videoHeight || frameSource.height;
  if (!fw || !fh || !viewportW || !viewportH) return null;
  const sx = fw / viewportW;
  const sy = fh / viewportH;
  const regionW = Math.ceil(MARKER_CELL_PX * 2 * sx);
  const regionH = Math.ceil(MARKER_CELL_PX * 2 * sy);
  canvas.width = regionW;
  canvas.height = regionH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(frameSource, 0, 0, regionW, regionH, 0, 0, regionW, regionH);
  const cells = [[0, 0], [1, 0], [0, 1], [1, 1]];
  return cells.map(([cx, cy]) => {
    const x = Math.floor((cx + 0.5) * MARKER_CELL_PX * sx);
    const y = Math.floor((cy + 0.5) * MARKER_CELL_PX * sy);
    const r = Math.max(1, Math.floor(MARKER_CELL_PX * sx * 0.2));
    const data = ctx.getImageData(Math.max(0, x - r), Math.max(0, y - r), r * 2, r * 2).data;
    let R = 0; let G = 0; let B = 0; let count = 0;
    for (let i = 0; i < data.length; i += 4) { R += data[i]; G += data[i + 1]; B += data[i + 2]; count++; }
    return count ? nearestPaletteIndex([R / count, G / count, B / count]) : -1;
  });
};

export const codesMatch = (read, expected) => {
  if (!read || !expected) return null;
  const hits = read.filter((v, i) => v === expected[i]).length;
  return hits >= 3;
};
