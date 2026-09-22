import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Search, Filter, AlertCircle, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Local debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      
      const response = await adminAPI.getUsers(params);
      
      if (response.data?.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setUsers(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
      }
    } catch (err) {
      setError("Failed to fetch users. Please check your connection.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, roleFilter, page]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminAPI.updateUserStatus(id, !currentStatus);
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, isActive: !currentStatus } : u));
      toast.success('Status updated');
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await adminAPI.updateUserRole(id, newRole);
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'STUDENT': return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold">STUDENT</span>;
      case 'INDUSTRY': return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold">INDUSTRY</span>;
      case 'ACADEMICIAN': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">ACADEMICIAN</span>;
      case 'INSTITUTION': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">INSTITUTION</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage accounts, roles, and platform access.</p>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
          <div className="w-full sm:w-1/2 md:w-1/3">
            <SearchBar 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} className="text-gray-400" />
            <select 
              className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary outline-none"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="INDUSTRY">Industry</option>
              <option value="ACADEMICIAN">Academician</option>
              <option value="INSTITUTION">Institution</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.length > 0 ? users.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="text-sm border-gray-300 rounded focus:ring-primary focus:border-primary bg-transparent outline-none p-1 -ml-1 hover:bg-gray-100 transition-colors"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="INDUSTRY">Industry</option>
                        <option value="ACADEMICIAN">Academician</option>
                        <option value="INSTITUTION">Institution</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <div className="mt-1">{getRoleBadge(u.role)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(u._id || u.id, u.isActive)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          u.isActive 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {u.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toast.error('Admin feature disabled in demo mode')} className="text-gray-400 hover:text-primary transition-colors p-1">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination placeholder */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
