// Device, browser and input integrity checks against remote-access and tool-assisted cheating.

const VIRTUAL_GPU = /swiftshader|llvmpipe|softpipe|virtualbox|vmware|parallels|qemu|virgl|hyper-v|microsoft basic render|remote display|rdpudd|citrix|parsec|spacedesk|teamviewer|anydesk|chrome remote|mesa offscreen/i;
const MOBILE_UA = /android|iphone|ipad|ipod|mobile/i;

export const getGpuInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { renderer: 'unavailable', vendor: 'unavailable' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    };
  } catch (_) {
    return { renderer: 'unavailable', vendor: 'unavailable' };
  }
};

export const devtoolsLikelyOpen = () => {
  // Docked developer tools shrink the page inside the window
  const wGap = window.outerWidth - window.innerWidth;
  const hGap = window.outerHeight - window.innerHeight;
  return (document.fullscreenElement && (wGap > 160 || hGap > 160)) || wGap > 320;
};

const KNOWN_EXTENSION_MARKERS = [
  'grammarly-desktop-integration', 'data-gr-ext-installed', 'data-new-gr-c-s-check-loaded',
  'chatgpt', 'monica', 'merlin', 'sider', 'maxai', 'harpa', 'wiseone', 'glasp', 'copilot',
];

export const detectInjectedExtensions = () => {
  const found = new Set();
  const html = document.documentElement;
  const body = document.body;
  [html, body].forEach(el => {
    if (!el) return;
    for (const attr of el.getAttributeNames()) {
      if (KNOWN_EXTENSION_MARKERS.some(m => attr.toLowerCase().includes(m))) found.add(attr);
    }
  });
  Array.from(body?.children || []).forEach(el => {
    if (el.id === 'root' || el.tagName === 'SCRIPT' || el.tagName === 'NOSCRIPT') return;
    const name = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`;
    if (el.tagName.includes('-') || KNOWN_EXTENSION_MARKERS.some(m => name.includes(m)) || el.tagName === 'IFRAME') found.add(name);
  });
  return [...found].slice(0, 10);
};

/**
 * One-time environment scan before the test.
 * risks: [{ type, severity, message, blocking }]
 */
export const scanEnvironment = async () => {
  const gpu = getGpuInfo();
  const ua = navigator.userAgent || '';
  const risks = [];
  const report = {
    userAgent: ua.slice(0, 200),
    platform: navigator.userAgentData?.platform || navigator.platform || '',
    webdriver: Boolean(navigator.webdriver),
    gpuRenderer: String(gpu.renderer).slice(0, 120),
    gpuVendor: String(gpu.vendor).slice(0, 80),
    cpuCores: navigator.hardwareConcurrency || null,
    deviceMemory: navigator.deviceMemory || null,
    screen: { width: screen.width, height: screen.height, dpr: window.devicePixelRatio, colorDepth: screen.colorDepth, isExtended: Boolean(screen.isExtended) },
    touch: navigator.maxTouchPoints || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    displays: null,
    extensions: detectInjectedExtensions(),
  };

  if (MOBILE_UA.test(ua) || navigator.userAgentData?.mobile) {
    risks.push({ type: 'MOBILE_DEVICE', severity: 'high', blocking: true, message: 'Proctored tests must be taken on a laptop or desktop computer.' });
  }
  if (report.webdriver || /HeadlessChrome/.test(ua)) {
    risks.push({ type: 'AUTOMATION_DETECTED', severity: 'high', blocking: false, message: 'Browser automation / bot control detected.' });
  }
  if (VIRTUAL_GPU.test(`${gpu.renderer} ${gpu.vendor}`)) {
    risks.push({ type: 'VIRTUAL_OR_REMOTE_DISPLAY', severity: 'high', blocking: false, message: `Virtual machine or remote-desktop display adapter detected (${String(gpu.renderer).slice(0, 60)}).` });
  }
  if (screen.isExtended) {
    risks.push({ type: 'MULTIPLE_DISPLAYS', severity: 'high', blocking: true, message: 'More than one display is connected. Disconnect extra monitors/projectors.' });
  }
  if (devtoolsLikelyOpen()) {
    risks.push({ type: 'DEVTOOLS_OPEN', severity: 'high', blocking: true, message: 'Developer tools appear to be open. Close them to continue.' });
  }
  if (report.extensions.length) {
    risks.push({ type: 'EXTENSION_INJECTION', severity: 'low', blocking: false, message: `Browser extensions are modifying the page (${report.extensions.join(', ')}). Disable AI/assistant extensions.` });
  }
  return { report, risks };
};

// Window Management API: counts physical screens (asks for permission in Chromium)
export const countDisplays = async () => {
  try {
    if (typeof window.getScreenDetails !== 'function') return { supported: false, count: screen.isExtended ? 2 : 1 };
    const details = await window.getScreenDetails();
    return { supported: true, count: details.screens.length, details };
  } catch (_) {
    return { supported: false, count: screen.isExtended ? 2 : 1 };
  }
};

/**
 * Runtime input integrity: remote-control patterns, synthetic input, answering without being present,
 * dictated "answer bursts", hidden typing, devtools, DOM injection by extensions, printing and display changes.
 * `log(type, severity, opts)` is the proctoring logger; `getPresence()` returns the latest camera state.
 */
export const startInputIntegrity = ({ log, getPresence }) => {
  const cleanups = [];
  const on = (target, evt, fn, opts) => { target.addEventListener(evt, fn, opts); cleanups.push(() => target.removeEventListener(evt, fn, opts)); };
  const cooldown = {};
  const once = (key, ms) => { const now = Date.now(); if (now - (cooldown[key] || 0) < ms) return false; cooldown[key] = now; return true; };

  // 1) Synthetic (script-generated) input
  const untrusted = (e) => { if (!e.isTrusted && once('SYNTHETIC_INPUT', 10000)) log('SYNTHETIC_INPUT', 'high', { detail: e.type }); };
  ['click', 'keydown', 'pointerdown', 'input', 'change'].forEach(evt => on(document, evt, untrusted, true));

  // 2) Remote-control cursor pattern: many large instantaneous jumps with no intermediate movement
  let last = null;
  let jumps = [];
  on(document, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (last) {
      const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const dt = now - last.t;
      if (dist > 350 && dt < 40) {
        jumps = [...jumps.filter(t => now - t < 60000), now];
        if (jumps.length >= 6 && once('REMOTE_INPUT_PATTERN', 120000)) log('REMOTE_INPUT_PATTERN', 'high', { detail: `${jumps.length} cursor teleports in 60s` });
      }
    }
    last = { x: e.clientX, y: e.clientY, t: now };
  }, { passive: true });

  // 3) Input while the candidate is not in front of the camera ("keyboard / mouse ↔ camera sync")
  const presenceCheck = (e) => {
    const p = getPresence?.();
    if (!p || p.faceCount === null || p.faceCount === undefined) return;
    if (p.faceCount === 0 && once('INPUT_WITHOUT_PRESENCE', 20000)) {
      log('INPUT_WITHOUT_PRESENCE', 'high', { snapshot: true, detail: `${e.type} with no face on camera` });
    } else if (p.identityMismatch && once('INPUT_BY_OTHER_PERSON', 20000)) {
      log('INPUT_BY_OTHER_PERSON', 'high', { snapshot: true, detail: `${e.type} while a different person was on camera` });
    }
  };
  on(document, 'pointerdown', presenceCheck, true);
  on(document, 'keydown', presenceCheck, true);

  // 4) Hidden typing (an MCQ test needs no typing — typed text usually means chatting / prompting)
  let typed = [];
  on(document, 'keydown', (e) => {
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const now = Date.now();
      typed = [...typed.filter(t => now - t < 30000), now];
      if (typed.length >= 15 && once('TYPING_DETECTED', 60000)) log('TYPING_DETECTED', 'low', { detail: `${typed.length} keys in 30s` });
    }
  }, true);

  // 5) Devtools, focus polling (overlay apps), extension injection
  const poll = setInterval(() => {
    if (devtoolsLikelyOpen() && once('DEVTOOLS_OPEN', 30000)) log('DEVTOOLS_OPEN', 'high');
    if (!document.hasFocus() && !document.hidden && once('WINDOW_BLUR_POLL', 8000)) log('WINDOW_BLUR', 'high', { screen: true, detail: 'another app or overlay has focus' });
  }, 1500);
  cleanups.push(() => clearInterval(poll));

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName && KNOWN_EXTENSION_MARKERS.some(k => m.attributeName.includes(k))) {
        if (once(`EXT_ATTR_${m.attributeName}`, 60000)) log('EXTENSION_INJECTION', 'low', { detail: m.attributeName });
      }
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const root = document.getElementById('root');
        if (root && root.contains(node)) continue;
        const name = `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}`;
        if (once(`EXT_${name}`, 60000)) log('EXTENSION_INJECTION', 'low', { detail: name });
      }
    }
  });
  observer.observe(document.body, { childList: true });
  observer.observe(document.documentElement, { attributes: true });
  observer.observe(document.body, { attributes: true });
  cleanups.push(() => observer.disconnect());

  // 6) Printing, network, display changes
  on(window, 'beforeprint', () => log('PRINT_ATTEMPT', 'high'));
  on(window, 'offline', () => log('NETWORK_OFFLINE', 'low'));
  if (screen && 'onchange' in screen) {
    on(screen, 'change', () => { if (screen.isExtended) log('MULTIPLE_DISPLAYS', 'high', { detail: 'display connected during test' }); });
  }

  return () => cleanups.forEach(fn => fn());
};

// Detects dictated answering: many answers in a very short time
export const createAnswerBurstDetector = (log) => {
  let times = [];
  return () => {
    const now = Date.now();
    times = [...times.filter(t => now - t < 10000), now];
    if (times.length >= 6) {
      log('ANSWER_BURST', 'low', { detail: `${times.length} answers in 10s` });
      times = [];
    }
  };
};
