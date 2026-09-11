import React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ResearchHub = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Research Hub</h1>
        <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <PlusCircle size={18} /> Propose Project
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Open Collaborations from Industry</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-5 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-dark text-lg">Standardization of Ayurvedic Formulations</h3>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Seeking Academicians</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">Patanjali Research Institute is looking for academic partners to conduct clinical trials on specific multi-herb formulations.</p>
            <div className="flex gap-4 text-sm text-gray-500 font-medium">
              <span>Funding: Available</span>
              <span>Duration: 12 Months</span>
            </div>
            <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="mt-4 text-primary hover:underline font-medium text-sm">Express Interest</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchHub;
