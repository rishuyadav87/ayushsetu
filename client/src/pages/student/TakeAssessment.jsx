import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, AlertTriangle, AlertCircle, CheckCircle, Award, ArrowRight, Camera, CameraOff, Mic, Monitor,
  ShieldCheck, Maximize, Lock, Loader2, XCircle, ChevronLeft, ChevronRight, Send, ScanLine, Cpu,
  Smartphone, Users, Eye, Ban, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assessmentAPI, attemptAPI, badgeAPI, submitAttemptOnUnload } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useProctoring from '../../proctoring/useProctoring';
import { isScreenShareSupported } from '../../proctoring/screen';
import { ScreenSyncMarker, Watermark, AudioMeter } from '../../components/proctoring/ProctorOverlays';

const MAX_VIOLATIONS = 5;
const HEARTBEAT_MS = 15000;

const formatTime = (seconds) => {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const REASON_LABEL = {
  MANUAL: 'Submitted by you',
  TIME_UP: 'Auto-submitted: time up',
  MAX_VIOLATIONS: 'Auto-submitted: too many proctoring violations',
  PAGE_CLOSED: 'Auto-submitted: test window closed',
  ABANDONED: 'Closed automatically: attempt abandoned',
  TERMINATED: 'Terminated by a proctor',
};

const StepRow = ({ state, icon: Icon, title, hint, action }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="mt-0.5 flex-shrink-0">
      {state === 'pending' ? <Loader2 size={18} className="animate-spin text-gray-400" />
        : state === 'ok' ? <CheckCircle size={18} className="text-green-600" />
          : state === 'warn' ? <AlertTriangle size={18} className="text-amber-500" />
            : state === 'todo' ? <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
              : <XCircle size={18} className="text-red-500" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Icon size={14} className="text-gray-400" /> {title}</div>
      {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
    </div>
    {action}
  </div>
);

const TakeAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState('loading'); // loading | locked | error | instructions | starting | test | submitting | result | terminated
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [submitError, setSubmitError] = useState(null);

  const answersRef = useRef({});
  const attemptRef = useRef(null);
  const endAtRef = useRef(null);
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const proctored = assessment ? assessment.proctored !== false : true;
  const submitRef = useRef(() => {});

  const proctor = useProctoring({
    enabled: proctored,
    maxViolations: MAX_VIOLATIONS,
    onAutoSubmit: (reason) => submitRef.current(reason),
    onPageClose: () => {
      if (submittedRef.current || phaseRef.current !== 'test' || !attemptRef.current) return;
      submittedRef.current = true;
      const report = proctor.getReport(false);
      submitAttemptOnUnload(attemptRef.current.attemptId, {
        answers: answersRef.current,
        submitReason: 'PAGE_CLOSED',
        proctoring: { ...report, events: report.events.slice(-120) },
      });
    },
  });

  // ---------- load ----------
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await assessmentAPI.getById(id);
        setAssessment(data);
        setPhase('instructions');
      } catch (err) {
        const res = err.response;
        setMessage(res?.data?.message || 'Failed to load this assessment. Please try again.');
        setPhase(res?.status === 403 && res.data?.locked ? 'locked' : 'error');
      }
    };
    load();
  }, [id]);

  // Start camera + microphone as soon as the system check is shown
  useEffect(() => {
    if (phase === 'instructions' && proctored && proctor.cameraStatus === 'idle') proctor.startMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, proctored]);

  // ---------- submission ----------
  const finishWithResult = useCallback(async (data) => {
    await proctor.stopMonitoring();
    setResult(data);
    setPhase('result');
    try {
      const badgeRes = await badgeAPI.checkAndAward();
      setNewBadges(badgeRes.data?.newBadges || []);
    } catch (_) { /* optional */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctor.stopMonitoring]);

  const submit = useCallback(async (reason = 'MANUAL') => {
    if (submittedRef.current || !attemptRef.current) return;
    submittedRef.current = true;
    setConfirmOpen(false);
    setSubmitError(null);
    setPhase('submitting');
    try {
      const { data } = await attemptAPI.submit(attemptRef.current.attemptId, {
        answers: answersRef.current,
        submitReason: reason,
        timeTakenSec: startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : null,
        proctoring: proctored ? proctor.getReport(true) : { events: [], violationCount: 0 },
      });
      await finishWithResult(data);
    } catch (err) {
      console.error('Submission failed', err);
      submittedRef.current = false;
      setSubmitError(err.response?.data?.message || 'Could not submit. Check your internet connection and try again.');
      setPhase('test');
      toast.error('Submission failed — please retry.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishWithResult, proctor.getReport, proctored]);
  submitRef.current = submit;

  // ---------- timer ----------
  useEffect(() => {
    if (phase !== 'test') return undefined;
    const tick = () => {
      const left = Math.round((endAtRef.current - Date.now()) / 1000);
      setTimeLeft(left);
      if (left <= 0) submitRef.current('TIME_UP');
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // ---------- heartbeat: autosave + live monitoring + server-authoritative timer ----------
  useEffect(() => {
    if (phase !== 'test' || !attemptRef.current) return undefined;
    const beat = async () => {
      if (submittedRef.current) return;
      const newEvents = proctored ? proctor.drainNewEvents() : [];
      try {
        const { data } = await attemptAPI.heartbeat(attemptRef.current.attemptId, {
          answers: answersRef.current,
          events: newEvents,
          ...(proctored ? proctor.getLiveStats() : {}),
          snapshot: proctored ? proctor.captureThumbnail() : null,
        });
        if (data.status === 'IN_PROGRESS' && typeof data.remainingSec === 'number') {
          endAtRef.current = Date.now() + data.remainingSec * 1000;
        } else if (data.status && data.status !== 'IN_PROGRESS') {
          submittedRef.current = true;
          await proctor.stopMonitoring();
          if (data.terminated) {
            setPhase('terminated');
          } else if (data.result) {
            await finishWithResult(data.result);
          } else {
            setMessage('This attempt has already been closed.');
            setPhase('terminated');
          }
        }
      } catch (_) {
        // offline: keep the events for the next heartbeat
        if (newEvents.length) proctor.requeueEvents(newEvents);
      }
    };
    const timer = setInterval(beat, HEARTBEAT_MS);
    const first = setTimeout(beat, 3000); // first beat once the camera has a frame
    return () => { clearInterval(timer); clearTimeout(first); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---------- readiness ----------
  const env = proctor.environment;
  const envBlocked = env.status === 'blocked';
  const screenSupported = isScreenShareSupported();
  const aiReady = proctor.aiStatus === 'ready';
  const faceOk = proctor.aiStatus === 'unavailable' || (proctor.faceCount === 1 && proctor.faceInfo.identityReady);
  const displaysOk = !proctor.displays.checked || proctor.displays.count <= 1;
  const checks = {
    env: env.status === 'pending' ? 'pending' : envBlocked ? 'fail' : env.status === 'warn' ? 'warn' : 'ok',
    media: proctor.cameraStatus === 'requesting' ? 'pending' : proctor.cameraStatus === 'active' && ['active', 'calibrating'].includes(proctor.micStatus) ? (proctor.micStatus === 'calibrating' ? 'pending' : 'ok') : proctor.cameraStatus === 'idle' ? 'pending' : 'fail',
    face: proctor.aiStatus === 'loading' || (proctor.cameraStatus === 'active' && proctor.faceCount < 0) ? 'pending' : faceOk ? (aiReady ? 'ok' : 'warn') : 'fail',
    screen: !screenSupported ? 'fail' : proctor.screenStatus === 'active' ? (displaysOk ? 'ok' : 'fail') : proctor.screenStatus === 'requesting' ? 'pending' : proctor.screenStatus === 'idle' ? 'todo' : 'fail',
    room: proctor.roomScan.status === 'done' ? (proctor.roomScan.issues.length ? 'warn' : 'ok') : proctor.roomScan.status === 'scanning' ? 'pending' : 'todo',
  };
  const canStart = agreed && (!proctored || (
    !envBlocked && checks.media === 'ok' && ['ok', 'warn'].includes(checks.face) && checks.screen === 'ok' && ['ok', 'warn'].includes(checks.room)
  ));

  // ---------- start ----------
  const handleStart = async () => {
    if (!canStart || phase === 'starting') return;
    setPhase('starting');
    try {
      if (proctored) {
        const fs = await proctor.enterFullscreen();
        if (!fs) {
          toast.error('Full-screen mode is required. Please allow full screen and try again.');
          setPhase('instructions');
          return;
        }
      }
      const { data } = await assessmentAPI.start(id, proctored ? env.report : null);
      attemptRef.current = data;
      setAttempt(data);
      setQuestions(data.questions);
      answersRef.current = data.answers || {};
      setAnswers(answersRef.current);
      startedAtRef.current = new Date(data.startedAt).getTime();
      endAtRef.current = Date.now() + (new Date(data.expiresAt).getTime() - new Date(data.serverNow).getTime());
      setTimeLeft(Math.round((endAtRef.current - Date.now()) / 1000));
      if (proctored) {
        proctor.seedViolations(data.violationCount);
        proctor.startMonitoring({ startedAt: data.startedAt });
      }
      if (data.resumed) toast('Your previous attempt was resumed with the remaining time. This has been recorded.', { icon: '⚠️', duration: 6000 });
      setPhase('test');
    } catch (err) {
      await proctor.stopMonitoring().catch(() => {});
      toast.error(err.response?.data?.message || 'Could not start the test');
      if (proctored) proctor.startMedia();
      setPhase('instructions');
    }
  };

  const selectAnswer = (questionId, optionId) => {
    answersRef.current = { ...answersRef.current, [questionId]: optionId };
    setAnswers(answersRef.current);
    if (proctored) proctor.recordAnswer();
  };

  const answeredCount = Object.keys(answers).length;

  // ================= RENDER =================

  if (phase === 'loading') {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (phase === 'locked' || phase === 'error' || phase === 'terminated') {
    const terminated = phase === 'terminated';
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${phase === 'locked' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>
          {phase === 'locked' ? <Lock size={40} /> : terminated ? <Ban size={40} /> : <AlertCircle size={40} />}
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">{phase === 'locked' ? 'Level Locked' : terminated ? 'Attempt Terminated' : 'Something went wrong'}</h1>
        <p className="text-gray-600 mb-8">{terminated ? (message || 'A proctor ended this attempt after reviewing the live monitoring feed. Your result has been recorded and flagged for review.') : message}</p>
        <button onClick={() => navigate('/student/assessments')} className="px-6 py-3 bg-primary text-white rounded-lg font-medium">Back to Assessments</button>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (phase === 'result' && result) {
    const summary = proctor.events.reduce((acc, e) => {
      if (e.severity === 'high') acc[e.message] = (acc[e.message] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-center p-10">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {result.passed ? <CheckCircle size={48} /> : <AlertTriangle size={48} />}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{result.passed ? 'Assessment Passed!' : 'Assessment Finished'}</h1>
          <p className="text-gray-500 mb-1">{assessment?.title}</p>
          <p className="text-xs text-gray-400 mb-8">{REASON_LABEL[result.submitReason] || ''}</p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-gray-50 p-5 rounded-2xl w-40 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1 font-medium uppercase">Correct</div>
              <div className="text-3xl font-bold text-gray-800">{result.correct} / {result.total}</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl w-40 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1 font-medium uppercase">Marks</div>
              <div className="text-3xl font-bold text-gray-800">{result.score} / {result.maxScore}</div>
            </div>
            <div className={`p-5 rounded-2xl w-40 border ${result.passed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-sm mb-1 font-medium uppercase ${result.passed ? 'text-green-600' : 'text-red-600'}`}>Percentage</div>
              <div className={`text-3xl font-bold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>{result.percentage}%</div>
              <div className="text-xs text-gray-500 mt-1">Pass mark {result.passingPercent}%</div>
            </div>
          </div>

          {result.levelUnlocked && (
            <div className="mb-6 p-4 bg-primary/10 text-primary rounded-xl font-semibold flex items-center justify-center gap-2">
              <Award size={20} /> NSQF Level {result.levelUnlocked} unlocked!
            </div>
          )}

          {proctored && (
            <div className={`mb-8 p-5 rounded-xl border text-left ${result.flagged ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`font-bold flex items-center gap-2 mb-2 ${result.flagged ? 'text-red-800' : 'text-blue-800'}`}>
                <ShieldCheck size={20} /> AI Proctoring Report — {result.flagged ? 'Flagged for review' : 'No integrity concerns'}
              </div>
              <p className="text-sm text-gray-700 mb-2">{result.violationCount} serious violation(s) recorded.</p>
              {Object.keys(summary).length > 0 && (
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  {Object.entries(summary).map(([msg, n]) => <li key={msg}>{msg} × {n}</li>)}
                </ul>
              )}
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-xl max-w-lg mx-auto">
              <h3 className="font-bold text-amber-800 flex items-center justify-center gap-2 mb-4"><Award size={24} /> New Badges Unlocked!</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {newBadges.map((badge, idx) => (
                  <div key={idx} className="bg-white px-4 py-3 rounded-lg shadow-sm text-left">
                    <div className="font-bold text-sm text-gray-800">{badge.name}</div>
                    <div className="text-xs text-gray-500">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/student/level-tests')} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Level-wise Tests</button>
            <button onClick={() => navigate('/student/skills')} className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2">
              View My Skill Profile <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- INSTRUCTIONS / SYSTEM CHECK ----------
  if (phase === 'instructions' || phase === 'starting') {
    const faceHint = proctor.aiStatus === 'loading' ? 'Loading AI models (first time may take a few seconds)…'
      : proctor.aiStatus === 'unavailable' ? 'AI models could not load on this device — other checks still apply and this will be recorded'
        : proctor.faceCount === 1 ? (proctor.faceInfo.identityReady ? 'Face verified — this face will be matched for the whole test' : 'Hold still, capturing your reference face…')
          : proctor.faceCount === 0 ? 'No face detected — sit facing the camera in good light'
            : proctor.faceCount > 1 ? `${proctor.faceCount} faces detected — only you may be visible` : 'Waiting for camera…';

    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-6">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{assessment.levelTitle || `NSQF Level ${assessment.nsqfLevel}`}</span>
          {assessment.source === 'AI' && <span className="ml-2 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">AI generated</span>}
          <h1 className="text-2xl font-bold text-dark mt-2">{assessment.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{assessment.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
            <span className="flex items-center gap-1"><Clock size={16} /> {assessment.duration} minutes</span>
            <span className="flex items-center gap-1"><Award size={16} /> {assessment.questionCount} questions · {assessment.totalMarks} marks</span>
            <span>Pass mark {assessment.passingPercent}%</span>
          </div>
          {assessment.activeAttempt && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg">
              You already have this test in progress. Complete the checks to resume — the timer kept running and the resume will be recorded.
            </div>
          )}
        </div>

        {proctored ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-dark mb-1 flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> System & integrity check</h2>
              <p className="text-xs text-gray-500 mb-2">All steps are required. Nothing is recorded or uploaded except violation evidence for your attempt.</p>
              <div className="divide-y divide-gray-100">
                <StepRow state={checks.env} icon={Cpu} title="Device & browser integrity"
                  hint={env.status === 'pending' ? 'Scanning for remote-desktop tools, virtual machines, automation and extensions…'
                    : env.risks.length ? env.risks.map(r => r.message).join(' ') : 'Laptop/desktop browser, no remote-desktop, VM, automation or developer tools detected'}
                  action={env.status !== 'pending' && env.risks.length > 0 && <button onClick={proctor.runEnvironmentScan} className="text-xs text-primary font-medium flex items-center gap-1"><RefreshCw size={12} /> Re-scan</button>} />
                <StepRow state={checks.media} icon={Mic} title="Camera & microphone"
                  hint={proctor.mediaError || (proctor.micStatus === 'calibrating' ? 'Measuring room noise — please stay quiet for 3 seconds…' : proctor.cameraStatus === 'active' ? 'Camera and microphone are on. Background voices will be detected.' : 'Requesting permission…')}
                  action={['denied', 'error', 'ended'].includes(proctor.cameraStatus) ? <button onClick={proctor.startMedia} className="text-xs text-primary font-medium">Retry</button> : proctor.cameraStatus === 'active' ? <AudioMeter level={proctor.voice.level} speaking={proctor.voice.speaking} /> : null} />
                <StepRow state={checks.face} icon={Eye} title="Face verification & anti-spoofing" hint={faceHint} />
                <StepRow state={checks.screen} icon={Monitor} title="Share your entire screen (single display)"
                  hint={!screenSupported ? 'Screen sharing is not supported here — use Chrome, Edge or Firefox on a laptop/desktop.'
                    : proctor.screenError || (proctor.screenStatus === 'active'
                      ? (displaysOk ? 'Entire screen shared. The test will verify the shared screen shows this test (blocks remote desktops & extra monitors).' : `${proctor.displays.count} displays detected — disconnect extra monitors and share again.`)
                      : 'Click Share and pick "Entire screen". Tabs or windows are not accepted.')}
                  action={screenSupported && proctor.screenStatus !== 'requesting' && <button onClick={proctor.requestScreen} disabled={proctor.cameraStatus !== 'active'} className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg disabled:opacity-40">{proctor.screenStatus === 'active' ? 'Re-share' : 'Share'}</button>} />
                <StepRow state={checks.room} icon={ScanLine} title="Room scan"
                  hint={proctor.roomScan.status === 'scanning' ? 'Slowly turn your laptop/webcam to show your desk and the whole room…'
                    : proctor.roomScan.status === 'done' ? (proctor.roomScan.issues.length ? `Found: ${proctor.roomScan.issues.join(', ')}. Remove them and scan again, otherwise this will be flagged.` : 'Room looks clear.')
                    : 'Show your desk and surroundings: no phone, notes, books or other people.'}
                  action={proctor.roomScan.status !== 'scanning' && <button onClick={proctor.runRoomScan} disabled={proctor.cameraStatus !== 'active'} className="px-3 py-1.5 text-xs font-semibold border border-primary text-primary rounded-lg disabled:opacity-40">{proctor.roomScan.status === 'done' ? 'Scan again' : 'Start scan'}</button>} />
              </div>
              {proctor.roomScan.shots.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {proctor.roomScan.shots.map((s, i) => (
                    <figure key={i}>
                      <img src={s.image} alt={`Room scan ${i + 1}`} className="rounded border border-gray-200 w-full" />
                      {s.objects.length > 0 && <figcaption className="text-[10px] text-red-600 leading-tight mt-0.5">{s.objects.join(', ')}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video ref={proctor.attachVideo} autoPlay muted playsInline disablePictureInPicture className="w-full h-full object-cover -scale-x-100" />
                  {proctor.cameraStatus !== 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 text-sm gap-2 p-4 text-center">
                      {proctor.cameraStatus === 'requesting' ? <Loader2 className="animate-spin" /> : <CameraOff />}
                      {proctor.cameraStatus === 'requesting' ? 'Requesting camera & microphone…' : proctor.mediaError || 'Camera is off'}
                    </div>
                  )}
                  {proctor.cameraStatus === 'active' && proctor.faceCount >= 0 && (
                    <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded ${proctor.faceCount === 1 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                      {proctor.faceCount} face{proctor.faceCount === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mt-3">
                  <video ref={proctor.attachScreenVideo} autoPlay muted playsInline disablePictureInPicture className="w-full h-full object-contain" />
                  {proctor.screenStatus !== 'active' && <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 gap-1"><Monitor size={14} /> Screen preview</div>}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700">
                <div className="font-semibold mb-2">During the test</div>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex gap-2"><Maximize size={14} className="text-primary flex-shrink-0" /> Full screen until you submit; tabs, apps and background windows are tracked.</li>
                  <li className="flex gap-2"><Smartphone size={14} className="text-primary flex-shrink-0" /> Phones, books, extra screens and other people are detected by the camera AI.</li>
                  <li className="flex gap-2"><Users size={14} className="text-primary flex-shrink-0" /> Voices are matched with your lip movement to catch outside help.</li>
                  <li className="flex gap-2"><Monitor size={14} className="text-primary flex-shrink-0" /> Remote access (AnyDesk/TeamViewer-style control), second displays and scripts are flagged.</li>
                  <li className="flex gap-2"><AlertTriangle size={14} className="text-secondary flex-shrink-0" /> {MAX_VIOLATIONS} serious violations = automatic submission and review.</li>
                </ul>
                <label className="flex items-start gap-2 mt-4 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4" />
                  <span className="text-xs">I agree to AI proctoring (camera, microphone and screen) for this assessment.</span>
                </label>
                <button onClick={handleStart} disabled={!canStart || phase === 'starting'} className="mt-4 w-full py-3 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {phase === 'starting' ? <Loader2 size={18} className="animate-spin" /> : <Maximize size={18} />}
                  {assessment.activeAttempt ? 'Resume Test in Full Screen' : 'Start Test in Full Screen'}
                </button>
                <button onClick={() => navigate(-1)} className="mt-2 w-full py-2 text-gray-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
            <p className="text-sm text-gray-600 mb-4">This practice set is not proctored. The timer still applies.</p>
            <label className="flex items-center gap-2 mb-4 text-sm"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I'm ready to start</label>
            <button onClick={handleStart} disabled={!canStart || phase === 'starting'} className="w-full py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">Start Test</button>
          </div>
        )}
      </div>
    );
  }

  // ---------- TEST (full-screen) ----------
  const q = questions[currentQ];
  const lowTime = timeLeft <= 60;
  const hardBlock = proctored && (!proctor.isFullscreen || proctor.cameraStatus !== 'active' || proctor.screenStatus !== 'active' || proctor.micStatus === 'ended');
  const hidden = hardBlock || (proctored && proctor.focusLost);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col select-none">
      {proctored && <ScreenSyncMarker code={proctor.syncCode} />}
      <header className="bg-primary text-white pl-10 pr-4 md:pr-6 py-3 flex items-center justify-between gap-4 shadow">
        <div className="min-w-0">
          <div className="text-xs text-white/70">NSQF Level {assessment.nsqfLevel} · {assessment.category}</div>
          <h1 className="font-bold truncate">{assessment.title}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {proctored && (
            <>
              <div className="hidden md:flex items-center gap-2 bg-white/10 px-2 py-1.5 rounded-lg" title="Microphone"><Mic size={14} /><AudioMeter level={proctor.voice.level} speaking={proctor.voice.speaking} /></div>
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${proctor.violationCount ? 'bg-red-500/30' : 'bg-white/10'}`}>
                <ShieldCheck size={16} /> Warnings {proctor.violationCount}/{MAX_VIOLATIONS}
              </div>
            </>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg ${lowTime ? 'bg-red-600 animate-pulse' : 'bg-white/10'}`}>
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <main className={`relative flex-1 overflow-y-auto p-4 md:p-8 ${hidden ? 'blur-xl pointer-events-none' : ''}`}>
          {proctored && <Watermark name={user?.name} email={user?.email} attemptId={attempt?.attemptId} />}
          <div className="relative z-10 max-w-3xl mx-auto bg-white/95 rounded-xl shadow-sm border border-gray-100">
            {submitError && (
              <div className="m-6 mb-0 bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center justify-between gap-2">
                <span>{submitError}</span>
                <button onClick={() => submit('MANUAL')} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
              </div>
            )}
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 gap-4">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Question {currentQ + 1} of {questions.length}</span>
                <div className="w-40 md:w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}></div>
                </div>
              </div>
              <h2 className="text-xl font-medium text-dark mb-6">{q?.text}</h2>
              <div className="space-y-3">
                {q?.options.map((opt, idx) => (
                  <label key={opt.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-primary/5 hover:border-primary/30'}`}>
                    <input type="radio" name={`answer-${q.id}`} checked={answers[q.id] === opt.id} onChange={() => selectAnswer(q.id, opt.id)} className="w-5 h-5 text-primary" />
                    <span className="ml-3 text-gray-700"><b className="mr-2 text-gray-400">{String.fromCharCode(65 + idx)}.</b>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-6 md:px-8 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
              <button disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={18} /> Previous</button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(c => c + 1)} className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-1">Next <ChevronRight size={18} /></button>
              ) : (
                <button onClick={() => setConfirmOpen(true)} className="px-5 py-2 bg-secondary text-white rounded-lg font-medium flex items-center gap-2"><Send size={16} /> Submit Test</button>
              )}
            </div>
          </div>
        </main>

        <aside className="lg:w-72 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 flex lg:flex-col gap-4 overflow-y-auto">
          {proctored && (
            <div className="w-40 lg:w-full flex-shrink-0 space-y-2">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={proctor.attachVideo} autoPlay muted playsInline disablePictureInPicture className="w-full h-full object-cover -scale-x-100" />
                <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE</div>
                {proctor.faceCount >= 0 && (
                  <div className={`absolute bottom-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${proctor.faceCount === 1 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    {proctor.faceCount === 1 ? 'Face OK' : proctor.faceCount === 0 ? 'No face' : `${proctor.faceCount} faces`}
                  </div>
                )}
              </div>
              <video ref={proctor.attachScreenVideo} autoPlay muted playsInline disablePictureInPicture className="absolute w-px h-px opacity-0 pointer-events-none" />
              <p className="text-[11px] text-gray-500 hidden lg:block">Camera, microphone and screen are being monitored by the AI proctor.</p>
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-700 mb-2">Questions · {answeredCount}/{questions.length} answered</div>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((qq, idx) => (
                <button key={qq.id} onClick={() => setCurrentQ(idx)}
                  className={`h-9 rounded-md text-sm font-semibold border ${idx === currentQ ? 'ring-2 ring-primary' : ''} ${answers[qq.id] !== undefined ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setConfirmOpen(true)} className="hidden lg:flex mt-6 w-full py-2 bg-secondary text-white rounded-lg font-medium items-center justify-center gap-2"><Send size={16} /> Submit Test</button>
          </div>
        </aside>
      </div>

      {/* Blocking overlays */}
      {phase === 'test' && hardBlock && (
        <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            {proctor.cameraStatus !== 'active' || proctor.micStatus === 'ended' ? (
              <>
                <CameraOff size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Camera or microphone turned off</h2>
                <p className="text-gray-600 text-sm mb-6">Both must stay on during the test. This has been recorded.</p>
                <button onClick={proctor.startMedia} className="px-6 py-3 bg-primary text-white rounded-lg font-semibold">Turn them back on</button>
              </>
            ) : proctor.screenStatus !== 'active' ? (
              <>
                <Monitor size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Screen sharing stopped</h2>
                <p className="text-gray-600 text-sm mb-6">Share your entire screen again to continue. This has been recorded ({proctor.violationCount}/{MAX_VIOLATIONS}).</p>
                <button onClick={async () => { if (await proctor.requestScreen()) proctor.enterFullscreen(); }} className="px-6 py-3 bg-primary text-white rounded-lg font-semibold">Share entire screen</button>
              </>
            ) : (
              <>
                <Maximize size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">You left full-screen mode</h2>
                <p className="text-gray-600 text-sm mb-6">This has been recorded ({proctor.violationCount}/{MAX_VIOLATIONS} warnings). Return to full screen to continue — the timer is still running.</p>
                <button onClick={proctor.enterFullscreen} className="px-6 py-3 bg-primary text-white rounded-lg font-semibold">Return to full screen</button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'test' && !hardBlock && proctored && proctor.focusLost && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center p-4" onClick={() => window.focus()}>
          <div className="bg-white rounded-xl p-6 max-w-sm text-center">
            <Eye size={40} className="mx-auto text-amber-500 mb-3" />
            <h2 className="text-lg font-bold mb-1">Test hidden</h2>
            <p className="text-sm text-gray-600">Another window or app took focus. Questions stay hidden until you click here.</p>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Submit your test?</h2>
            <p className="text-sm text-gray-600 mb-1">You have answered {answeredCount} of {questions.length} questions.</p>
            {answeredCount < questions.length && <p className="text-sm text-secondary mb-1">{questions.length - answeredCount} question(s) are unanswered.</p>}
            <p className="text-sm text-gray-600 mb-6">You cannot change your answers after submitting.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Keep working</button>
              <button onClick={() => submit('MANUAL')} className="flex-1 py-2 bg-secondary text-white rounded-lg font-semibold">Submit</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'submitting' && (
        <div className="absolute inset-0 z-[60] bg-white/80 flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="animate-spin text-primary" />
          <div className="font-semibold text-gray-700">Submitting your test…</div>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;
