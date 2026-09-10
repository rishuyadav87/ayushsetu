import React, { useState } from 'react';
import { Save, Send, AlertCircle } from 'lucide-react';
import { opportunityAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'internship', // default matches api model if needed
    location: '',
    skills: '', // will split by comma
    nsqfLevel: 'Any Level',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError("Title and Description are required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        title: formData.title,
        type: formData.type.toLowerCase(),
        location: formData.location,
        description: formData.description,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        status: isDraft ? 'draft' : 'open',
      };
      
      await opportunityAPI.create(payload);
      setSuccess(true);
      setTimeout(() => navigate('/industry/opportunities'), 1500);
    } catch (err) {
      console.error("Failed to post opportunity", err);
      setError("Failed to create opportunity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Post New Opportunity</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center mb-6">
          Opportunity created successfully! Redirecting...
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Title *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Clinical Research Intern" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary" 
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary"
              >
                <option value="internship">Internship</option>
                <option value="job">Full-time Job</option>
                <option value="part-time">Part-time Job</option>
                <option value="project">Research Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Mumbai or Remote" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills (Comma separated)</label>
              <input 
                type="text" 
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., Clinical Diagnosis, Data Analysis, Communication" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum NSQF Level</label>
              <select 
                name="nsqfLevel"
                value={formData.nsqfLevel}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary"
              >
                <option>Any Level</option>
                <option>Level 4</option>
                <option>Level 5</option>
                <option>Level 6</option>
                <option>Level 7+</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5} 
                placeholder="Describe the responsibilities and requirements..." 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary"
                required
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || success}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> Save Draft
            </button>
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading || success}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} /> 
              )}
              {loading ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostOpportunity;
