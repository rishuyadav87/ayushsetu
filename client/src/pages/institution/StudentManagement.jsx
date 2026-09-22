import React from 'react';
import SearchBar from '../../components/common/SearchBar';

const StudentManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Student Management</h1>
        <SearchBar placeholder="Search students by name or ID..." />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
           </svg>
         </div>
         <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
         <p className="text-gray-500 max-w-sm mx-auto">
           Once students enroll in your institution and register on the platform, they will appear here.
         </p>
      </div>
    </div>
  );
};

export default StudentManagement;
