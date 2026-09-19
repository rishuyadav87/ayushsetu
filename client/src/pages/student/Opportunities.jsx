import React, { useState, useEffect } from 'react';
import OpportunityCard from '../../components/common/OpportunityCard';
import SearchBar from '../../components/common/SearchBar';
import { Filter, AlertCircle, X, CheckCircle } from 'lucide-react';
import { opportunityAPI, applicationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const Opportunities = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);
  
  // Track applied opportunities locally
  const [appliedIds, setAppliedIds] = useState(new Set());

  const fallbackOpportunities = [
    { id: 1, title: 'Clinical Research Intern', company: 'Dabur Research Foundation', location: 'Delhi, NCR', type: 'internship', stipend: '₹15,000/mo', tags: ['Clinical', 'Research'] },
    { id: 2, title: 'Ayurvedic Consultant', company: 'Patanjali Wellness', location: 'Remote', type: 'job', stipend: '₹40,000/mo', tags: ['Consultation', 'Communication'] },
    { id: 3, title: 'Pharmacology Analyst', company: 'Himalaya Wellness', location: 'Bengaluru, KA', type: 'job', stipend: '₹50,000/mo', tags: ['Research', 'Data Analysis'] },
    { id: 4, title: 'Yoga Instructor', company: 'Art of Living', location: 'Mumbai, MH', type: 'part-time', stipend: '₹20,000/mo', tags: ['Yoga', 'Communication'] },
  ];

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filter !== 'all') params.type = filter;
        if (searchQuery) params.query = searchQuery;
        
        const response = await opportunityAPI.getAll(params);
        setOpportunities(response.data?.length ? response.data : fallbackOpportunities);
      } catch (err) {
        setError(t('common.error') + " - Could not load real opportunities. Showing fallback data.");
        setOpportunities(fallbackOpportunities);
      } finally {
        setLoading(false);
      }
    };
    
    // Add small delay for search debouncing effect
    const timeoutId = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timeoutId);
  }, [filter, searchQuery, t]);
  
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const openApplyModal = (opp) => {
    setSelectedOpp(opp);
    setIsModalOpen(true);
    setCoverLetter('');
    setApplyError(null);
    setApplySuccess(false);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedOpp(null);
      setApplySuccess(false);
      setApplyError(null);
    }, 300);
  };

  const handleApplySubmit = async () => {
    if (!selectedOpp) return;
    
    try {
      setSubmitting(true);
      setApplyError(null);
      
      await applicationAPI.create({ 
        opportunityId: selectedOpp.id || selectedOpp._id, 
        coverLetter 
      });
      
      setApplySuccess(true);
      setAppliedIds(prev => new Set(prev).add(selectedOpp.id || selectedOpp._id));
      
      // Close modal automatically after success
      setTimeout(() => {
        closeModal();
      }, 2000);
      
    } catch (err) {
      if (err.response?.status === 409 || err.message.includes('Already applied')) {
        setApplyError("You've already applied to this opportunity");
        setAppliedIds(prev => new Set(prev).add(selectedOpp.id || selectedOpp._id));
      } else {
        setApplyError(t('common.error') || "Failed to submit application");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">{t('nav.opportunities') || 'Opportunity Hub'}</h1>
          <p className="text-gray-500 text-sm mt-1">AI-curated internships, jobs, and projects</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="w-full relative">
            <SearchBar 
              placeholder={t('common.search') || "Search role or company..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${filter === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>All Matches</button>
        <button onClick={() => setFilter('internship')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${filter === 'internship' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('opportunity.internship') || 'Internships'}</button>
        <button onClick={() => setFilter('job')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${filter === 'job' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('opportunity.job') || 'Full-Time Jobs'}</button>
        <button onClick={() => setFilter('project')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${filter === 'project' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('opportunity.project') || 'Research Projects'}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {opportunities.filter(o => filter === 'all' || o.type === filter || (filter === 'project' && o.type === 'part-time')).map(o => {
            const oppId = o.id || o._id;
            const isApplied = appliedIds.has(oppId);
            return (
              <div key={oppId} className="relative">
                <OpportunityCard 
                  {...o} 
                  onApply={() => openApplyModal(o)} 
                />
                {isApplied && (
                  <div className="absolute bottom-4 right-4 bg-indigo-100 text-indigo-700 px-3 py-1 rounded font-medium text-sm flex items-center shadow">
                    <CheckCircle size={16} className="mr-1" />
                    {t('student.applied') || 'Applied ✓'}
                  </div>
                )}
                {/* Overlay to intercept clicks if applied - could be refined */}
                {isApplied && (
                  <div className="absolute inset-0 bg-white/40 cursor-not-allowed rounded-xl z-10" title="Already applied"></div>
                )}
              </div>
            );
          })}
          {opportunities.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500">
              No opportunities found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Apply for Role</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              {selectedOpp && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-800">{selectedOpp.title}</h4>
                  <p className="text-sm text-gray-600">{selectedOpp.company}</p>
                </div>
              )}
              
              {applySuccess ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 animate-bounce">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Applied Successfully!</h3>
                  <p className="text-gray-500 text-sm">Your application has been sent to the employer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applyError && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start">
                      <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <span>{applyError}</span>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter (Optional)
                    </label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-shadow"
                      rows="5"
                      placeholder="Why are you a good fit for this role?"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      disabled={submitting}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
            
            {!applySuccess && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handleApplySubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('common.submit') || 'Submitting...'}
                    </>
                  ) : (
                    t('common.submit') || 'Submit Application'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
