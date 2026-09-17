import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { chatbotAPI } from '../../services/api';
import { getPagesForRole, matchNavigation } from '../../utils/navigationCatalog';

const SUGGESTIONS = {
  student: ['Open level-wise tests', 'Create an AI practice test', 'How do NSQF levels unlock?', 'What is Pitta dosha?'],
  industry: ['Generate an AI test', 'Open live proctoring', 'Open candidate search', 'Open notices'],
  academician: ['Upload a question set', 'Open mentoring', 'What is NSQF?', 'Open notices'],
  institution: ['Open live proctoring', 'Show flagged attempts', 'Open readiness analytics', 'Open notices'],
  admin: ['Open live proctoring', 'Show flagged attempts', 'Generate an AI test', 'Open user management'],
};

// Minimal, safe formatter: **bold**, bullet lines and line breaks (no HTML injection)
const FormattedText = ({ text }) => {
  const renderInline = (line, key) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
        : <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>
    );
  return (
    <div className="space-y-1">
      {String(text).split('\n').filter((l, i, arr) => l.trim() || (i > 0 && arr[i - 1].trim())).map((line, idx) => {
        const bullet = line.match(/^\s*([-*•]|\d+\.)\s+(.*)/);
        return bullet
          ? <div key={idx} className="flex gap-2"><span className="text-primary">•</span><span>{renderInline(bullet[2], idx)}</span></div>
          : <div key={idx}>{renderInline(line, idx)}</div>;
      })}
    </div>
  );
};

const ChatbotWidget = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role;
  const pages = getPagesForRole(role);

  const greeting = () => ({
    role: 'assistant',
    content: language === 'hi'
      ? `नमस्ते ${user?.name?.split(' ')[0] || ''}! मैं **सेतु सहायक** हूँ। मैं आपको किसी भी फ़ीचर तक ले जा सकता हूँ और आपके सवालों के जवाब दे सकता हूँ।`
      : `Namaste ${user?.name?.split(' ')[0] || ''}! I'm **Setu Sahayak**. Ask me where something is (tests, notices, opportunities…) and I'll take you there — or ask me any doubt about AYUSH, NSQF or this platform.`,
    actions: [],
  });

  useEffect(() => {
    if (open && messages.length === 0) setMessages([greeting()]);
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Never available during a test (anti-cheating)
  if (!user || location.pathname.includes('/assessments/take/')) return null;

  const goTo = (path) => {
    navigate(path);
    if (window.innerWidth < 768) setOpen(false);
  };

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;
    setInput('');
    const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // 1) Instant local navigation for clear "open / go to / where is" requests
    const match = matchNavigation(text, role);
    if (match && match.isNavRequest) {
      const { page } = match;
      const onPage = location.pathname === page.path;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: onPage
          ? `You're already on **${page.label}** — ${page.description}.`
          : language === 'hi'
            ? `**${page.label}** — ${page.description}.${match.autoNavigate ? ' वहाँ ले जा रहा हूँ…' : ''}`
            : `**${page.label}** — ${page.description}.${match.autoNavigate ? ' Taking you there now…' : ''}`,
        actions: onPage ? [] : [{ label: page.label, path: page.path }],
      }]);
      if (match.autoNavigate && !onPage) setTimeout(() => goTo(page.path), 400);
      return;
    }

    // 2) Doubts and everything else → backend assistant (LLM or offline knowledge base)
    try {
      setSending(true);
      const { data } = await chatbotAPI.send({
        message: text,
        history,
        language,
        currentPath: location.pathname,
        pages: pages.map(({ label, path, description, keywords }) => ({ label, path, description, keywords })),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, actions: data.actions || [] }]);
    } catch (err) {
      const fallback = match
        ? { content: `I couldn't reach the assistant service, but this may help: **${match.page.label}** — ${match.page.description}.`, actions: [{ label: match.page.label, path: match.page.path }] }
        : { content: err.response?.data?.message || 'Sorry, I could not reach the assistant service. Please try again in a moment.', actions: [] };
      setMessages(prev => [...prev, { role: 'assistant', ...fallback }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full shadow-lg shadow-primary/30 pl-4 pr-5 py-3 flex items-center gap-2 hover:bg-primary/90 transition-transform hover:scale-105"
          aria-label="Open assistant"
        >
          <MessageCircle size={22} />
          <span className="font-semibold text-sm hidden sm:inline">Ask Setu Sahayak</span>
        </button>
      )}

      {open && (
        <div className="fixed z-40 bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[560px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1.5"><Bot size={20} /></div>
              <div>
                <div className="font-semibold leading-tight">Setu Sahayak</div>
                <div className="text-[11px] text-white/70 capitalize">Assistant · {role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMessages([greeting()])} className="p-1.5 hover:bg-white/10 rounded" title="New chat"><RotateCcw size={16} /></button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded" aria-label="Close"><X size={20} /></button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                  {m.role === 'user' ? m.content : <FormattedText text={m.content} />}
                  {m.actions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.actions.map(a => (
                        <button key={a.path} onClick={() => goTo(a.path)} className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors">
                          {a.label} <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {(SUGGESTIONS[role] || []).map(s => (
                  <button key={s} onClick={() => send(s)} className="text-xs bg-white border border-gray-200 hover:border-primary text-gray-700 px-3 py-1.5 rounded-full">{s}</button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-gray-200 flex gap-2 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={language === 'hi' ? 'अपना सवाल लिखें…' : 'Ask a doubt or where to find something…'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button type="submit" disabled={!input.trim() || sending} className="bg-primary text-white rounded-full p-2.5 disabled:opacity-50" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
