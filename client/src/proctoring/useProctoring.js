import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { loadVision, analyseFrame, faceSimilarity, captureFrame, VISION_MODEL_NAME } from './vision';
import { VoiceMonitor } from './voice';
import { requestEntireScreen, readMarker, codesMatch, randomCode, SYNC_INTERVAL_MS, isScreenShareSupported } from './screen';
import { scanEnvironment, countDisplays, startInputIntegrity, createAnswerBurstDetector } from './integrity';
import { messageFor } from './messages';

// ---- tunables ----
const VISION_INTERVAL_MS = 700;
const OBJECT_EVERY_N_TICKS = 4;          // object detection ≈ every 2.8 s
const NO_FACE_GRACE_MS = 3000;
const MULTI_FACE_STREAK = 2;
const IDENTITY_EVERY_MS = 3000;
const IDENTITY_MIN_SIMILARITY = 0.45;    // Human normalised similarity (>0.5 usually same person)
const SPOOF_THRESHOLD = 0.3;
const SPOOF_STREAK = 4;
const LOOK_AWAY_MS = 4000;
const VOICE_SUSTAIN_MS = 1500;
const MAX_SNAPSHOTS = 8;
const TOASTED = new Set(['LOOKING_AWAY', 'COPY_PASTE', 'BLOCKED_SHORTCUT', 'TYPING_DETECTED', 'BOOK_DETECTED', 'SECOND_SCREEN_OBJECT']);

const BLOCKED_KEYS = new Set(['F5', 'F11', 'F12', 'PrintScreen', 'ContextMenu', 'Meta', 'OS']);
const BLOCKED_CTRL_KEYS = new Set(['c', 'v', 'x', 'a', 'p', 's', 'u', 'r', 't', 'n', 'w', 'f', 'j', 'i', 'tab', 'h', 'd', 'l']);

export default function useProctoring({ enabled = true, maxViolations = 5, onAutoSubmit, onPageClose } = {}) {
  // ---------- state ----------
  const [environment, setEnvironment] = useState({ status: 'pending', risks: [], report: null });
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | requesting | active | denied | error | ended
  const [micStatus, setMicStatus] = useState('idle');       // idle | active | calibrating | ended | error
  const [mediaError, setMediaError] = useState('');
  const [aiStatus, setAiStatus] = useState('loading');      // loading | ready | unavailable
  const [faceCount, setFaceCount] = useState(-1);
  const [faceInfo, setFaceInfo] = useState({ real: null, identityReady: false });
  const [screenStatus, setScreenStatus] = useState('idle'); // idle | requesting | active | error | ended
  const [screenError, setScreenError] = useState('');
  const [displays, setDisplays] = useState({ checked: false, count: 1 });
  const [roomScan, setRoomScan] = useState({ status: 'idle', shots: [], issues: [] });
  const [voice, setVoice] = useState({ level: 0, speaking: false });
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [focusLost, setFocusLost] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [events, setEvents] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [syncCode, setSyncCode] = useState(() => randomCode());

  // ---------- refs ----------
  const camStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoElRef = useRef(null);
  const screenVideoRef = useRef(null);
  const voiceRef = useRef(null);
  const monitoringRef = useRef(false);
  const eventsRef = useRef([]);
  const unsentRef = useRef([]);
  const snapshotsRef = useRef([]);
  const roomScanRef = useRef([]);
  const violationsRef = useRef(0);
  const startedAtRef = useRef(null);
  const referenceRef = useRef(null);
  const lastHighAtRef = useRef({});
  const autoSubmittedRef = useRef(false);
  const busyRef = useRef(false);
  const presenceRef = useRef({ faceCount: null, identityMismatch: false });
  const mouthHistoryRef = useRef([]);
  const syncRef = useRef({ code: syncCode, prev: null, mismatch: 0 });
  const vs = useRef({ tick: 0, noFaceSince: null, noFaceReported: false, multi: 0, lastMultiAt: 0, persons: 0, phones: 0, lastIdAt: 0, idStreak: 0, spoof: 0, awaySince: null, downEvents: [], lastRefAt: 0 });
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const onPageCloseRef = useRef(onPageClose);
  onAutoSubmitRef.current = onAutoSubmit;
  onPageCloseRef.current = onPageClose;

  // ---------- logging ----------
  const COOLDOWN_MS = { MULTIPLE_FACES: 8000, EXTRA_PERSON: 15000, PHONE_DETECTED: 15000, FACE_MISMATCH: 15000, FACE_SPOOF: 30000, CANDIDATE_SPEAKING: 15000, BACKGROUND_VOICE: 15000, SCREEN_SYNC_MISMATCH: 30000, WINDOW_BLUR: 4000, LOOKING_AWAY: 10000, BOOK_DETECTED: 60000, SECOND_SCREEN_OBJECT: 60000, REPEATED_LOOKING_DOWN: 60000 };

  const logEvent = useCallback((type, severity = 'high', { snapshot = false, screen = false, detail, silent = false } = {}) => {
    const now = Date.now();
    const cd = COOLDOWN_MS[type] ?? (severity === 'high' ? 1500 : 0);
    if (cd && now - (lastHighAtRef.current[type] || 0) < cd) return;
    lastHighAtRef.current[type] = now;

    const event = {
      type, severity, message: messageFor(type),
      ...(detail ? { detail: String(detail).slice(0, 150) } : {}),
      at: new Date(now).toISOString(),
      elapsedSec: startedAtRef.current ? Math.round((now - startedAtRef.current) / 1000) : 0,
    };
    eventsRef.current = [...eventsRef.current, event].slice(-500);
    unsentRef.current.push(event);
    setEvents(eventsRef.current);

    if (snapshotsRef.current.length < MAX_SNAPSHOTS) {
      if (snapshot) {
        const image = captureFrame(videoElRef.current, 200);
        if (image) snapshotsRef.current.push({ type, at: event.at, image });
      }
      if (screen && screenVideoRef.current) {
        const image = captureFrame(screenVideoRef.current, 320, 0.5);
        if (image) snapshotsRef.current.push({ type: `SCREEN_${type}`, at: event.at, image });
      }
    }

    if (!monitoringRef.current || silent) return;
    if (severity === 'high') {
      violationsRef.current += 1;
      setViolationCount(violationsRef.current);
      const n = violationsRef.current;
      if (n >= maxViolations) {
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          toast.error('Maximum proctoring violations reached. Your test is being submitted.', { id: 'proctor-max', duration: 6000 });
          onAutoSubmitRef.current?.('MAX_VIOLATIONS');
        }
      } else {
        toast.error(`Warning ${n}/${maxViolations}: ${event.message}`, { id: `proctor-${type}`, duration: 4000 });
      }
    } else if (TOASTED.has(type)) {
      toast(event.message, { id: `proctor-${type}`, icon: '⚠️', duration: 2500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxViolations]);

  // ---------- video element wiring ----------
  const attachVideo = useCallback((el) => {
    videoElRef.current = el;
    if (el && camStreamRef.current && el.srcObject !== camStreamRef.current) {
      el.srcObject = camStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const attachScreenVideo = useCallback((el) => {
    screenVideoRef.current = el;
    if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
      el.srcObject = screenStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // ---------- environment ----------
  const runEnvironmentScan = useCallback(async () => {
    const { report, risks } = await scanEnvironment();
    const blocked = risks.some(r => r.blocking);
    setEnvironment({ status: blocked ? 'blocked' : risks.length ? 'warn' : 'ok', risks, report });
    return { report, risks };
  }, []);

  // ---------- camera + microphone ----------
  const stopCamera = useCallback(() => {
    camStreamRef.current?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    camStreamRef.current = null;
    voiceRef.current?.stop();
    voiceRef.current = null;
  }, []);

  const startMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('error');
      setMediaError('This browser cannot access the camera/microphone. Use the latest Chrome, Edge or Firefox.');
      return false;
    }
    try {
      setCameraStatus('requesting');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      camStreamRef.current = stream;
      const [vTrack] = stream.getVideoTracks();
      const [aTrack] = stream.getAudioTracks();
      vTrack.onended = () => { setCameraStatus('ended'); if (monitoringRef.current) logEvent('CAMERA_OFF', 'high'); };
      if (aTrack) {
        aTrack.onended = () => { setMicStatus('ended'); if (monitoringRef.current) logEvent('MIC_OFF', 'high'); };
        aTrack.onmute = () => { if (monitoringRef.current) logEvent('MIC_OFF', 'high', { detail: 'muted' }); };
      }
      if (videoElRef.current) attachVideo(videoElRef.current);
      setCameraStatus('active');
      setMediaError('');

      if (aTrack) {
        const vm = new VoiceMonitor(stream);
        await vm.start();
        voiceRef.current = vm;
        vm.onChange(({ speaking, level }) => setVoice(v => (v.speaking === speaking && Math.abs(v.level - level) < 0.05 ? v : { speaking, level })));
        setMicStatus('calibrating');
        await vm.calibrate(2500);
        setMicStatus('active');
      } else {
        setMicStatus('error');
      }
      return true;
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      setCameraStatus(denied ? 'denied' : 'error');
      setMicStatus('error');
      setMediaError(
        denied ? 'Camera/microphone permission was denied. Allow both in the browser address bar and retry.'
          : err?.name === 'NotFoundError' ? 'A webcam and microphone are required for this test.'
            : 'Camera or microphone could not start. Close other apps using them and retry.'
      );
      return false;
    }
  }, [attachVideo, logEvent, stopCamera]);

  // ---------- screen share ----------
  const stopScreen = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    screenStreamRef.current = null;
  }, []);

  const requestScreen = useCallback(async () => {
    try {
      setScreenStatus('requesting');
      setScreenError('');
      stopScreen();
      
      // Mobile bypass: If screen sharing isn't supported (e.g. mobile Safari/Chrome), just pretend it succeeded
      if (!isScreenShareSupported()) {
        setScreenStatus('active');
        voiceRef.current?.resume();
        setDisplays({ checked: true, count: 1, supported: false });
        return true;
      }

      const stream = await requestEntireScreen();
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => {
        setScreenStatus('ended');
        if (monitoringRef.current) logEvent('SCREEN_SHARE_STOPPED', 'high');
      };
      if (screenVideoRef.current) attachScreenVideo(screenVideoRef.current);
      setScreenStatus('active');
      voiceRef.current?.resume();
      const d = await countDisplays();
      setDisplays({ checked: true, count: d.count, supported: d.supported });
      return true;
    } catch (err) {
      setScreenStatus('error');
      setScreenError(err.message || 'Screen sharing failed');
      return false;
    }
  }, [attachScreenVideo, logEvent, stopScreen]);

  // ---------- AI models ----------
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    runEnvironmentScan();
    loadVision()
      .then(() => !cancelled && setAiStatus('ready'))
      .catch((err) => { console.error('Vision models failed to load', err); if (!cancelled) setAiStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [enabled, runEnvironmentScan]);

  // ---------- camera AI loop ----------
  useEffect(() => {
    if (!enabled || cameraStatus !== 'active' || aiStatus !== 'ready') return undefined;

    let stopped = false;
    let timer = null;
    const schedule = () => {
      if (stopped) return;
      // adaptive rate: slower devices analyse less often so the test UI stays responsive
      const delay = Math.min(5000, Math.max(VISION_INTERVAL_MS, (vs.current.avgMs || 0) * 1.5));
      timer = setTimeout(async () => { await tick(); schedule(); }, delay);
    };

    const tick = async () => {
      if (busyRef.current || roomScanRef.scanning) return;
      busyRef.current = true;
      try {
        const s = vs.current;
        const now = Date.now();
        s.tick += 1;
        const live = monitoringRef.current;
        const fastEnough = !s.avgMs || s.avgMs < 600;
        if (live && !fastEnough && !s.degradedLogged && s.avgMs > 1500) {
          s.degradedLogged = true;
          logEvent('AI_DEGRADED', 'low', { detail: `${Math.round(s.avgMs)} ms per frame — object detection reduced` });
        }
        const withObjects = live && (fastEnough ? s.tick % OBJECT_EVERY_N_TICKS === 0 : (s.avgMs < 1500 && now - (s.lastObjAt || 0) > 30000));
        if (withObjects) s.lastObjAt = now;
        const t0 = performance.now();
        const r = await analyseFrame(videoElRef.current, { objects: withObjects });
        if (!withObjects) s.avgMs = s.avgMs ? s.avgMs * 0.7 + (performance.now() - t0) * 0.3 : performance.now() - t0;
        if (!r) return;
        const { faceCount: count, primary, objects } = r;
        setFaceCount(count);
        presenceRef.current = { ...presenceRef.current, faceCount: count };

        // reference face for recognition (kept fresh until the test starts)
        if (!live) {
          if (count === 1 && primary?.embedding && (primary.real === null || primary.real >= SPOOF_THRESHOLD) && now - s.lastRefAt > 2500) {
            referenceRef.current = primary.embedding;
            s.lastRefAt = now;
          }
          setFaceInfo({ real: primary?.real ?? null, identityReady: Boolean(referenceRef.current) });
          return;
        }

        // 1) no face
        if (count === 0) {
          s.noFaceSince = s.noFaceSince || now;
          if (!s.noFaceReported && now - s.noFaceSince >= NO_FACE_GRACE_MS) {
            s.noFaceReported = true;
            logEvent('NO_FACE', 'high', { snapshot: true });
          }
        } else {
          s.noFaceSince = null;
          s.noFaceReported = false;
        }

        // 2) more than one face
        s.multi = count >= 2 ? s.multi + 1 : 0;
        if (s.multi >= MULTI_FACE_STREAK) logEvent('MULTIPLE_FACES', 'high', { snapshot: true, detail: `${count} faces` });

        // 3) objects: phone / extra person / books / other screens
        if (objects) {
          s.phones = objects.phone > 0 ? s.phones + 1 : 0;
          if (s.phones >= 2) logEvent('PHONE_DETECTED', 'high', { snapshot: true, detail: objects.labels.join(', ') });
          s.persons = objects.person > Math.max(1, count) ? s.persons + 1 : 0;
          if (s.persons >= 2) logEvent('EXTRA_PERSON', 'high', { snapshot: true, detail: `${objects.person} people` });
          if (objects.book > 0) logEvent('BOOK_DETECTED', 'low', { snapshot: true });
          if (objects.screen > 0) logEvent('SECOND_SCREEN_OBJECT', 'low', { snapshot: true, detail: objects.labels.join(', ') });
        }

        if (primary) {
          // 4) spoofing: a photo / phone screen held up to the webcam
          const spoofy = (primary.real !== null && primary.real < SPOOF_THRESHOLD) || (primary.live !== null && primary.live < 0.2);
          s.spoof = spoofy ? s.spoof + 1 : 0;
          if (s.spoof >= SPOOF_STREAK) logEvent('FACE_SPOOF', 'high', { snapshot: true, detail: `real ${Math.round((primary.real ?? 0) * 100)}%` });

          // 5) gaze / head pose
          if (primary.lookingAway) {
            s.awaySince = s.awaySince || now;
            if (now - s.awaySince >= LOOK_AWAY_MS) {
              logEvent('LOOKING_AWAY', 'low');
              if (primary.lookingDown) {
                s.downEvents = [...s.downEvents.filter(t => now - t < 120000), now];
                s.awaySince = now;
                if (s.downEvents.length >= 3) { logEvent('REPEATED_LOOKING_DOWN', 'high', { snapshot: true }); s.downEvents = []; }
              }
            }
          } else {
            s.awaySince = null;
          }

          // 6) mouth movement history (for voice ↔ lip sync)
          mouthHistoryRef.current = [...mouthHistoryRef.current.filter(m => now - m.t < 3000), { t: now, v: primary.mouthOpen }];

          // 7) face recognition — same person as verified at the start?
          if (count === 1 && referenceRef.current && primary.embedding && now - s.lastIdAt >= IDENTITY_EVERY_MS) {
            s.lastIdAt = now;
            const sim = await faceSimilarity(referenceRef.current, primary.embedding);
            s.idStreak = sim < IDENTITY_MIN_SIMILARITY ? s.idStreak + 1 : 0;
            presenceRef.current.identityMismatch = s.idStreak >= 2;
            if (s.idStreak >= 2) logEvent('FACE_MISMATCH', 'high', { snapshot: true, detail: `similarity ${Math.round(sim * 100)}%` });
          }
        }
      } catch (err) {
        console.warn('Vision analysis error', err);
      } finally {
        busyRef.current = false;
      }
    };

    schedule();
    return () => { stopped = true; clearTimeout(timer); };
  }, [enabled, cameraStatus, aiStatus, logEvent]);

  // ---------- voice ↔ lips ----------
  useEffect(() => {
    if (!monitoring || !voiceRef.current) return undefined;
    const vm = voiceRef.current;
    const timer = setInterval(() => {
      if (!vm.speaking || !vm.speechStartedAt || Date.now() - vm.speechStartedAt < VOICE_SUSTAIN_MS) return;
      const hist = mouthHistoryRef.current.filter(m => Date.now() - m.t < 2500).map(m => m.v);
      const faces = presenceRef.current.faceCount;
      const mouthMoving = hist.length >= 2 && (Math.max(...hist) - Math.min(...hist) > 0.12 || hist.reduce((a, b) => a + b, 0) / hist.length > 0.2);
      if (faces > 0 && mouthMoving) logEvent('CANDIDATE_SPEAKING', 'high', { snapshot: true });
      else logEvent('BACKGROUND_VOICE', 'high', { snapshot: true, detail: faces === 0 ? 'no face on camera' : 'candidate\'s lips not moving' });
    }, 500);
    return () => clearInterval(timer);
  }, [monitoring, logEvent]);

  // ---------- screen sync ----------
  useEffect(() => {
    if (!monitoring || screenStatus !== 'active') return undefined;
    const canvas = document.createElement('canvas');
    const timer = setInterval(() => {
      const next = randomCode();
      syncRef.current.prev = syncRef.current.code;
      syncRef.current.code = next;
      setSyncCode(next);
      setTimeout(() => {
        const video = screenVideoRef.current;
        if (!video || !document.fullscreenElement || document.hidden) return; // other rules cover these cases
        const read = readMarker(video, window.innerWidth, window.innerHeight, canvas);
        if (!read) return;
        const ok = codesMatch(read, syncRef.current.code) || codesMatch(read, syncRef.current.prev);
        syncRef.current.mismatch = ok ? 0 : syncRef.current.mismatch + 1;
        if (syncRef.current.mismatch >= 3) {
          logEvent('SCREEN_SYNC_MISMATCH', 'high', { screen: true, detail: `read ${read.join(',')}` });
          syncRef.current.mismatch = 0;
        }
      }, 900);
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [monitoring, screenStatus, logEvent]);

  // ---------- room scan ----------
  const runRoomScan = useCallback(async () => {
    if (cameraStatus !== 'active') return;
    voiceRef.current?.resume();
    roomScanRef.scanning = true;
    setRoomScan({ status: 'scanning', shots: [], issues: [] });
    const shots = [];
    const issues = new Set();
    try {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 1500));
        while (busyRef.current) await new Promise(r => setTimeout(r, 50));
        const image = captureFrame(videoElRef.current, 240, 0.6);
        let labels = [];
        if (aiStatus === 'ready') {
          const slow = (vs.current.avgMs || 0) > 1500;
          const r = await analyseFrame(videoElRef.current, { objects: !slow || i === 2 }).catch(() => null);
          if (r?.objects) {
            labels = r.objects.labels.filter(l => !(l.startsWith('person') && r.objects.person <= 1));
            if (r.objects.phone) issues.add('mobile phone');
            if (r.objects.person > 1 || r.faceCount > 1) issues.add('another person');
            if (r.objects.book) issues.add('book / notes');
          }
        }
        if (image) shots.push({ at: new Date().toISOString(), image, objects: labels });
        setRoomScan({ status: 'scanning', shots: [...shots], issues: [...issues] });
      }
    } finally {
      roomScanRef.scanning = false;
    }
    roomScanRef.current = shots;
    setRoomScan({ status: 'done', shots, issues: [...issues] });
  }, [cameraStatus, aiStatus]);

  // ---------- full screen ----------
  const enterFullscreen = useCallback(async () => {
    voiceRef.current?.resume();
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      try { navigator.keyboard?.lock?.(['Escape', 'F11', 'MetaLeft', 'MetaRight', 'AltLeft', 'Tab'])?.catch?.(() => {}); } catch (_) { /* unsupported */ }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn('Fullscreen request failed', err);
      setIsFullscreen(Boolean(document.fullscreenElement));
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try { navigator.keyboard?.unlock?.(); } catch (_) { /* ignore */ }
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (_) { /* ignore */ } }
  }, []);

  // ---------- browser locks while monitoring ----------
  const answerBurstRef = useRef(null);
  useEffect(() => {
    if (!monitoring) return undefined;

    const onVisibility = () => { if (document.hidden) logEvent('TAB_SWITCH', 'high', { screen: true }); };
    const onBlur = () => {
      setFocusLost(true);
      setTimeout(() => {
        if (!monitoringRef.current || document.hidden || document.hasFocus()) return;
        if (Date.now() - (lastHighAtRef.current.TAB_SWITCH || 0) < 2000) return;
        logEvent('WINDOW_BLUR', 'high', { screen: true });
      }, 400);
    };
    const onFocus = () => setFocusLost(false);
    const onFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (!fs && monitoringRef.current) logEvent('FULLSCREEN_EXIT', 'high', { screen: true });
    };
    const onKeyDown = (e) => {
      const key = (e.key || '').toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked = BLOCKED_KEYS.has(e.key) || (ctrl && BLOCKED_CTRL_KEYS.has(key)) ||
        (e.altKey && ['tab', 'f4', 'escape'].includes(key)) || (ctrl && e.shiftKey && ['i', 'j', 'c', 'k', 's'].includes(key));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'PrintScreen') { try { navigator.clipboard?.writeText(''); } catch (_) { /* ignore */ } }
        logEvent('BLOCKED_SHORTCUT', 'low', { detail: `${ctrl ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}` });
      }
    };
    const blockClipboard = (e) => { e.preventDefault(); logEvent('COPY_PASTE', 'low'); };
    const blockContext = (e) => { e.preventDefault(); logEvent('RIGHT_CLICK', 'low'); };
    const blockDrag = (e) => e.preventDefault();
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = 'Your test is in progress.'; return e.returnValue; };
    const onPageHide = () => { if (monitoringRef.current) onPageCloseRef.current?.(); };
    const onPopState = () => { window.history.pushState({ proctoring: true }, '', window.location.href); logEvent('NAVIGATION_BLOCKED', 'low'); };

    window.history.pushState({ proctoring: true }, '', window.location.href);
    const listeners = [
      [document, 'visibilitychange', onVisibility], [window, 'blur', onBlur], [window, 'focus', onFocus],
      [document, 'fullscreenchange', onFullscreenChange], [window, 'keydown', onKeyDown, true],
      [document, 'copy', blockClipboard], [document, 'cut', blockClipboard], [document, 'paste', blockClipboard],
      [document, 'contextmenu', blockContext], [document, 'dragstart', blockDrag], [document, 'selectstart', blockDrag],
      [window, 'beforeunload', onBeforeUnload], [window, 'pagehide', onPageHide], [window, 'popstate', onPopState],
    ];
    listeners.forEach(([t, e, f, o]) => t.addEventListener(e, f, o));
    const stopIntegrity = startInputIntegrity({ log: logEvent, getPresence: () => presenceRef.current });
    answerBurstRef.current = createAnswerBurstDetector(logEvent);

    return () => {
      listeners.forEach(([t, e, f, o]) => t.removeEventListener(e, f, o));
      stopIntegrity();
    };
  }, [monitoring, logEvent]);

  // ---------- lifecycle ----------
  const startMonitoring = useCallback(({ startedAt } = {}) => {
    startedAtRef.current = startedAt ? new Date(startedAt).getTime() : Date.now();
    monitoringRef.current = true;
    autoSubmittedRef.current = false;
    setMonitoring(true);
    voiceRef.current?.resume();
    if (aiStatus === 'unavailable') logEvent('AI_UNAVAILABLE', 'low');
    // environment risks become part of the attempt record
    environment.risks.forEach(r => logEvent(r.type, r.severity, { detail: r.message, silent: false }));
    if (roomScan.issues.length) logEvent('ROOM_SCAN_ISSUE', 'high', { detail: roomScan.issues.join(', ') });
  }, [aiStatus, environment.risks, roomScan.issues, logEvent]);

  const stopMonitoring = useCallback(async () => {
    monitoringRef.current = false;
    setMonitoring(false);
    stopCamera();
    stopScreen();
    setCameraStatus('idle');
    setScreenStatus('idle');
    await exitFullscreen();
  }, [exitFullscreen, stopCamera, stopScreen]);

  const recordAnswer = useCallback(() => { answerBurstRef.current?.(); }, []);

  const drainNewEvents = useCallback(() => {
    const out = unsentRef.current;
    unsentRef.current = [];
    return out;
  }, []);

  const requeueEvents = useCallback((evts) => { unsentRef.current = [...evts, ...unsentRef.current].slice(-200); }, []);

  const getLiveStats = useCallback(() => ({ violationCount: violationsRef.current, faceCount: presenceRef.current.faceCount ?? null }), []);

  const captureThumbnail = useCallback(() => captureFrame(videoElRef.current, 160, 0.5), []);

  const getReport = useCallback((includeImages = true) => ({
    events: eventsRef.current,
    snapshots: includeImages ? snapshotsRef.current : [],
    roomScan: includeImages ? roomScanRef.current : [],
    violationCount: violationsRef.current,
    faceModel: aiStatus === 'ready' ? VISION_MODEL_NAME : 'unavailable',
    identityVerified: Boolean(referenceRef.current),
  }), [aiStatus]);

  const seedViolations = useCallback((count) => {
    violationsRef.current = Math.max(violationsRef.current, count || 0);
    setViolationCount(violationsRef.current);
  }, []);

  // release everything on unmount
  useEffect(() => () => {
    monitoringRef.current = false;
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    voiceRef.current?.stop();
    try { navigator.keyboard?.unlock?.(); } catch (_) { /* ignore */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  return {
    // state
    environment, cameraStatus, micStatus, mediaError, aiStatus, faceCount, faceInfo, screenStatus, screenError,
    displays, roomScan, voice, isFullscreen, focusLost, monitoring, events, violationCount, maxViolations, syncCode,
    // actions
    attachVideo, attachScreenVideo, runEnvironmentScan, startMedia, requestScreen, runRoomScan, enterFullscreen,
    startMonitoring, stopMonitoring, recordAnswer, drainNewEvents, requeueEvents, getLiveStats, captureThumbnail, getReport, seedViolations, logEvent,
  };
}
