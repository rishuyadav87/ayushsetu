import React, { useEffect, useState } from 'react';
import { SYNC_PALETTE, MARKER_CELL_PX } from '../../proctoring/screen';

// Colour code read back from the shared screen to prove the test is what's being shown on it
export const ScreenSyncMarker = ({ code }) => (
  <div
    aria-hidden="true"
    title="Screen sync marker"
    className="fixed top-0 left-0 z-[9999] grid grid-cols-2 pointer-events-none"
    style={{ width: MARKER_CELL_PX * 2, height: MARKER_CELL_PX * 2 }}
  >
    {code.map((c, i) => (
      <div key={i} style={{ width: MARKER_CELL_PX, height: MARKER_CELL_PX, background: `rgb(${SYNC_PALETTE[c].join(',')})` }} />
    ))}
  </div>
);

// Traceable watermark: a photo of the screen taken with a phone reveals who leaked it and when
export const Watermark = ({ name, email, attemptId }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const text = `${name || ''} · ${email || ''} · ${String(attemptId || '').slice(0, 8)} · ${now.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`;
  return (
    <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0">
      <div className="absolute -inset-1/2 flex flex-wrap content-start gap-x-24 gap-y-20 rotate-[-24deg] opacity-[0.07] text-gray-900 text-sm font-semibold">
        {Array.from({ length: 80 }).map((_, i) => <span key={i} className="whitespace-nowrap">{text}</span>)}
      </div>
    </div>
  );
};

export const AudioMeter = ({ level = 0, speaking }) => (
  <div className="flex items-end gap-0.5 h-4" title={speaking ? 'Voice detected' : 'Microphone level'}>
    {[0.15, 0.3, 0.45, 0.6, 0.75].map((t, i) => (
      <div key={i} className={`w-1 rounded-sm ${level >= t ? (speaking ? 'bg-red-500' : 'bg-blue-500') : 'bg-gray-300'}`} style={{ height: `${(i + 1) * 3}px` }} />
    ))}
  </div>
);
