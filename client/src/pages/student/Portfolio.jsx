import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, ExternalLink, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import SkillBadge from '../../components/common/SkillBadge';
import { useAuth } from '../../context/AuthContext';
import { profileAPI, badgeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Portfolio = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showCertModal, setShowCertModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  
  // Form states
  const [certForm, setCertForm] = useState({ title: '', issuer: '', issueDate: '', url: '', description: '' });
  const [projForm, setProjForm] = useState({ title: '', description: '', technologies: '', url: '', startDate: '', endDate: '' });

  const fetchProfileAndBadges = async () => {
    try {
      setLoading(true);
      const [profileRes, badgeRes] = await Promise.all([
        profileAPI.getMyProfile().catch(() => null),
        badgeAPI.getAll().catch(() => null)
      ]);
      
      if (profileRes?.data) setProfile(profileRes.data);
      if (badgeRes?.data) setBadges(badgeRes.data);
      
    } catch (err) {
      setError("Could not load real profile data. Showing default data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndBadges();
  }, []);

  // --- Handlers ---
  const handleAddCert = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...certForm, verificationUrl: certForm.url };
      delete payload.url;
      await profileAPI.addCertificate(payload);
      setShowCertModal(false);
      setCertForm({ title: '', issuer: '', issueDate: '', url: '', description: '' });
      toast.success('Certificate added successfully');
      fetchProfileAndBadges();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add certificate.");
    }
  };

  const handleAddProj = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...projForm, 
        projectUrl: projForm.url,
        technologies: projForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
      };
      delete payload.url;
      await profileAPI.addProject(payload);
      setShowProjModal(false);
      setProjForm({ title: '', description: '', technologies: '', url: '', startDate: '', endDate: '' });
      toast.success('Project added successfully');
      fetchProfileAndBadges();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add project.");
    }
  };

  const handleDeleteCert = async (id) => {
    try {
      await profileAPI.deleteCertificate(id);
      toast.success('Certificate removed');
      fetchProfileAndBadges();
    } catch(err) {
      toast.error('Failed to delete certificate');
    }
  };

  const handleDeleteProj = async (id) => {
    try {
      await profileAPI.deleteProject(id);
      toast.success('Project removed');
      fetchProfileAndBadges();
    } catch(err) {
      toast.error('Failed to delete project');
    }
  };

  const fallbackData = {
    name: user?.name || 'Student',
    education: '',
    institution: '',
    skills: [],
    projects: [],
    certifications: []
  };

  const displayData = profile || fallbackData;
  const initials = displayData.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  const displayBadges = badges;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Digital Portfolio</h1>
        <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          <ExternalLink size={16} /> Share Public Link
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-dark">{displayData.name}</h2>
              <p className="text-gray-500 text-sm">{displayData.education}</p>
              <p className="text-gray-600 mt-2">{displayData.institution}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
                <Award size={18} className="text-primary" /> Verified Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(displayData.skills || fallbackData.skills).map((skill, idx) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name;
                  const skillLevel = typeof skill === 'object' ? skill.level : 'intermediate';
                  return <SkillBadge key={idx} skill={skillName} level={skillLevel} />;
                })}
              </div>
            </div>
            
            {/* Badges Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
                <Award size={18} className="text-primary" /> Earned Badges
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {displayBadges.map((badge, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-center shadow-sm">
                    <div className="text-3xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-bold text-amber-900 leading-tight">{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-dark flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Academic Projects
                </h3>
                <button 
                  onClick={() => setShowProjModal(true)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <Plus size={16} /> Add Project
                </button>
              </div>
              
              <div className="space-y-4">
                {(displayData.projects || fallbackData.projects).map((proj, idx) => (
                  <div key={proj.id || proj._id || idx} className={`relative group border-l-2 ${idx === 0 ? 'border-primary' : 'border-gray-200'} pl-4 pb-4`}>
                    <button 
                      onClick={() => handleDeleteProj(proj.id || proj._id)}
                      className="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <h4 className="font-bold text-gray-800 pr-6">{proj.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-2">
                      {proj.subtitle || `${proj.startDate} - ${proj.endDate}`}
                    </p>
                    <p className="text-sm text-gray-600">{proj.description}</p>
                    {proj.technologies && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Array.isArray(proj.technologies) ? proj.technologies.map((t, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</span>
                        )) : <span className="text-xs bg-gray-100 px-2 py-1 rounded">{proj.technologies}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {(!displayData.projects || displayData.projects.length === 0) && (
                  <p className="text-gray-500 text-sm">No projects added yet.</p>
                )}
              </div>
            </div>

            {/* Certifications Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-dark flex items-center gap-2">
                  <Award size={18} className="text-primary" /> Certifications
                </h3>
                <button 
                  onClick={() => setShowCertModal(true)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <Plus size={16} /> Add Certificate
                </button>
              </div>
              
              <ul className="space-y-3">
                {(displayData.certifications || fallbackData.certifications).map((cert, idx) => (
                  <li key={cert.id || cert._id || idx} className="relative group flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1 text-primary"><CheckCircle size={16} /></div>
                    <div className="flex-1 pr-6">
                      <div className="font-medium text-gray-800">{cert.title}</div>
                      <div className="text-xs text-gray-500">{cert.issuer} {cert.issueDate && `| ${cert.issueDate}`}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCert(cert.id || cert._id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
                {(!displayData.certifications || displayData.certifications.length === 0) && (
                  <p className="text-gray-500 text-sm">No certifications added yet.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCertModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Certificate</h3>
              <button onClick={() => setShowCertModal(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddCert} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title</label><input required className="w-full border rounded p-2" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Issuer</label><input required className="w-full border rounded p-2" value={certForm.issuer} onChange={e => setCertForm({...certForm, issuer: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Issue Date</label><input type="date" required className="w-full border rounded p-2" value={certForm.issueDate} onChange={e => setCertForm({...certForm, issueDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">URL (Optional)</label><input className="w-full border rounded p-2" value={certForm.url} onChange={e => setCertForm({...certForm, url: e.target.value})} /></div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded">Save Certificate</button>
            </form>
          </div>
        </div>
      )}

      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProjModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Project</h3>
              <button onClick={() => setShowProjModal(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddProj} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div><label className="block text-sm font-medium mb-1">Project Title</label><input required className="w-full border rounded p-2" value={projForm.title} onChange={e => setProjForm({...projForm, title: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea required rows="3" className="w-full border rounded p-2" value={projForm.description} onChange={e => setProjForm({...projForm, description: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Technologies (comma separated)</label><input className="w-full border rounded p-2" value={projForm.technologies} onChange={e => setProjForm({...projForm, technologies: e.target.value})} placeholder="React, Node.js" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="month" required className="w-full border rounded p-2" value={projForm.startDate} onChange={e => setProjForm({...projForm, startDate: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">End Date</label><input type="month" className="w-full border rounded p-2" value={projForm.endDate} onChange={e => setProjForm({...projForm, endDate: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded">Save Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
