import React from 'react';

const SkillTaxonomy = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">NSQF Skill Taxonomy</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <p className="text-gray-500 mb-4">Manage skill categories, tags, and mapping to NSQF levels.</p>
         <div className="space-y-4">
           <div className="border p-4 rounded flex justify-between items-center">
             <div>
               <h3 className="font-bold">Clinical Diagnosis</h3>
               <p className="text-sm text-gray-500">Parent Category: Clinical Practice • NSQF Level: 4-7</p>
             </div>
             <button className="text-primary text-sm font-bold">Edit</button>
           </div>
           <div className="border p-4 rounded flex justify-between items-center">
             <div>
               <h3 className="font-bold">Herbal Formulations</h3>
               <p className="text-sm text-gray-500">Parent Category: Pharmacy • NSQF Level: 3-6</p>
             </div>
             <button className="text-primary text-sm font-bold">Edit</button>
           </div>
         </div>
         <button className="mt-4 bg-primary text-white px-4 py-2 rounded">Add New Skill</button>
      </div>
    </div>
  );
};

export default SkillTaxonomy;
