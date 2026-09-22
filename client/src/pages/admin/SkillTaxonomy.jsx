import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function SkillTaxonomy() {
  const { t } = useLanguage();
  const [taxonomies, setTaxonomies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const { data } = await api.get('/analytics/skills'); // BUG-003: was '/api/analytics/skills' — double prefix
        setTaxonomies(data);
      } catch (err) {
        setError('Failed to load skill taxonomy. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchTaxonomy();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('Skill Taxonomy')}</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          Import Taxonomy
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center border border-red-100">
          <span className="font-medium">{error}</span>
        </div>
      ) : taxonomies.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No NSQF Roles Mapped</h3>
          <p className="text-gray-500 mb-6">Import taxonomy data from the master registry to populate this view.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft card-hover p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">NSQF Aligned Roles</h2>
          <div className="space-y-6">
            {taxonomies.map(tax => (
              <div key={tax.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-semibold text-lg text-primary">{tax.name}</h3>
                <p className="text-sm text-gray-600 mb-2">QP Code: {tax.id} | NSQF Level: {tax.nsqfLevel}</p>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-500">Assessments linked: {tax.assessmentCount}</span>
                  <span className="text-indigo-600 font-medium">Avg Readiness: {tax.avgScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
