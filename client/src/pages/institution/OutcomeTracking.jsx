import React from 'react';

const OutcomeTracking = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Outcome Tracking</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Batch Year</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total Students</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Placed</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Higher Ed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-6 py-4 font-bold">2023</td>
              <td className="px-6 py-4">120</td>
              <td className="px-6 py-4">85 (70%)</td>
              <td className="px-6 py-4">20 (16%)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-bold">2022</td>
              <td className="px-6 py-4">110</td>
              <td className="px-6 py-4">75 (68%)</td>
              <td className="px-6 py-4">25 (22%)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutcomeTracking;
