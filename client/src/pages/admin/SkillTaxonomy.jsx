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
    return <div className="p-6 text-gray-500">Loading taxonomy...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('Skill Taxonomy')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">NSQF Aligned Roles</h2>
        <div className="space-y-6">
          {taxonomies.map(tax => (
            <div key={tax.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-semibold text-lg text-primary">{tax.name}</h3>
              <p className="text-sm text-gray-600 mb-2">QP Code: {tax.id} | NSQF Level: {tax.nsqfLevel}</p>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-500">Assessments linked: {tax.assessmentCount}</span>
                <span className="text-blue-600 font-medium">Avg Readiness: {tax.avgScore}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
