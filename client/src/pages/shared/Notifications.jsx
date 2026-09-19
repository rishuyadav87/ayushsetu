import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Megaphone, Award, ShieldAlert, FileText, Unlock, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TYPE_ICON = {
  NOTICE: <Megaphone size={18} className="text-primary" />,
  ASSESSMENT: <FileText size={18} className="text-blue-600" />,
  ASSESSMENT_RESULT: <Award size={18} className="text-amber-600" />,
  LEVEL_UNLOCK: <Unlock size={18} className="text-blue-600" />,
  PROCTORING: <ShieldAlert size={18} className="text-red-600" />,
};

const AUDIENCES = [
  { value: 'STUDENT', label: 'Students' },
  { value: 'INDUSTRY', label: 'Industry' },
  { value: 'ACADEMICIAN', label: 'Academicians' },
  { value: 'INSTITUTION', label: 'Institutions' },
];

const Notifications = () => {
  const { user } = useAuth();
  const canBroadcast = ['admin', 'institution'].includes(user?.role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState({ title: '', message: '', roles: ['STUDENT'] });
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await notificationAPI.getAll();
      setItems(data || []);
    } catch (_) {
      toast.error('Could not load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (n) => {
    if (n.isRead) return;
    setItems(list => list.map(x => (x.id === n.id ? { ...x, isRead: true } : x)));
    window.dispatchEvent(new Event('notifications:changed'));
    try { await notificationAPI.markAsRead(n.id); } catch (_) { /* ignore */ }
  };

  const markAll = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setItems(list => list.map(x => ({ ...x, isRead: true })));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (_) {
      toast.error('Could not update notices');
    }
  };

  const toggleRole = (role) =>
    setNotice(n => ({ ...n, roles: n.roles.includes(role) ? n.roles.filter(r => r !== role) : [...n.roles, role] }));

  const postNotice = async (e) => {
    e.preventDefault();
    try {
      setPosting(true);
      const { data } = await notificationAPI.broadcast(notice);
      toast.success(data.message);
      setNotice({ title: '', message: '', roles: ['STUDENT'] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post notice');
    } finally {
      setPosting(false);
    }
  };

  const unread = items.filter(i => !i.isRead).length;
  const visible = items.filter(i => (filter === 'unread' ? !i.isRead : filter === 'notices' ? i.type === 'NOTICE' : true));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2"><Bell size={24} /> Notices</h1>
          <p className="text-sm text-gray-500">Announcements, results, level unlocks and proctoring alerts · {unread} unread</p>
        </div>
        <button onClick={markAll} disabled={!unread} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {canBroadcast && (
        <form onSubmit={postNotice} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-dark flex items-center gap-2"><Megaphone size={18} /> Post a notice</h2>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Title" value={notice.title} onChange={e => setNotice(n => ({ ...n, title: e.target.value }))} required />
          <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3} placeholder="Message" value={notice.message} onChange={e => setNotice(n => ({ ...n, message: e.target.value }))} required />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Send to:</span>
            {AUDIENCES.map(a => (
              <button type="button" key={a.value} onClick={() => toggleRole(a.value)} className={`px-3 py-1 rounded-full text-xs font-medium border ${notice.roles.includes(a.value) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'}`}>
                {a.label}
              </button>
            ))}
            <button type="submit" disabled={posting || !notice.roles.length} className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Post
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {[['all', 'All'], ['unread', 'Unread'], ['notices', 'Announcements']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === k ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">No notices here.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {visible.map(n => (
            <button key={n.id} onClick={() => markRead(n)} className={`w-full text-left p-4 flex gap-3 hover:bg-gray-50 ${n.isRead ? '' : 'bg-primary/5'}`}>
              <div className="mt-0.5">{TYPE_ICON[n.type] || <Bell size={18} className="text-gray-500" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className={`text-sm ${n.isRead ? 'text-gray-700' : 'font-semibold text-dark'}`}>{n.title}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
