import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ResearchHub = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('ayush_research');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Standardization of Ayurvedic Formulations', partner: 'Patanjali Research Institute', desc: 'Looking for academic partners to conduct clinical trials on specific multi-herb formulations.', funding: 'Available', duration: '12 Months' }
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', partner: 'Your Institute', desc: '', funding: 'TBD', duration: '6 Months' });

  useEffect(() => {
    localStorage.setItem('ayush_research', JSON.stringify(projects));
  }, [projects]);

  const handlePropose = () => {
    setProjects([{ id: Date.now(), ...form }, ...projects]);
    setShowModal(false);
    toast.success('Research project proposed successfully!');
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Research Hub</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <PlusCircle size={18} /> Propose Project
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Open Collaborations</h2>
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-5 hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-dark text-lg">{p.title}</h3>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Seeking Partners</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{p.desc}</p>
              <div className="flex gap-4 text-sm text-gray-500 font-medium">
                <span>By: {p.partner}</span>
                <span>Funding: {p.funding}</span>
                <span>Duration: {p.duration}</span>
              </div>
              <button onClick={() => toast.success('Interest sent to project coordinator!')} className="mt-4 text-primary hover:underline font-medium text-sm">Express Interest</button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark">Propose Research Project</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Project Title" className="w-full border rounded p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea placeholder="Description" rows={3} className="w-full border rounded p-2" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}></textarea>
              <div className="flex gap-2">
                <input type="text" placeholder="Funding" className="w-full border rounded p-2" value={form.funding} onChange={e => setForm({...form, funding: e.target.value})} />
                <input type="text" placeholder="Duration" className="w-full border rounded p-2" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handlePropose} className="px-4 py-2 bg-primary text-white rounded-lg">Propose</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchHub;
