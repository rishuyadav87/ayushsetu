import React from 'react';
import SearchBar from '../../components/common/SearchBar';

const StudentManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Student Management</h1>
        <SearchBar placeholder="Search students by name or ID..." />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <p className="text-gray-500">Student list goes here.</p>
         <ul className="mt-4 space-y-2">
            <li className="p-3 border rounded flex justify-between">
              <span>John Doe (ID: 1001) - 4th Year</span>
              <span className="text-blue-600 font-bold">Readiness: 78%</span>
            </li>
            <li className="p-3 border rounded flex justify-between">
              <span>Aarav Sharma (ID: 1002) - 3rd Year</span>
              <span className="text-yellow-600 font-bold">Readiness: 62%</span>
            </li>
         </ul>
      </div>
    </div>
  );
};

export default StudentManagement;
