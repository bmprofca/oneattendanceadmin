import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Plus, UserPlus } from 'lucide-react';

const dummyUsers = [
  { id: 1, name: 'Rahul Kumar', email: 'rahul@example.com', role: 'Staff', status: 'Active', joined: 'Oct 24, 2023', avatar: 'RK' },
  { id: 2, name: 'Priya Singh', email: 'priya@example.com', role: 'Manager', status: 'Active', joined: 'Nov 12, 2023', avatar: 'PS' },
  { id: 3, name: 'Amit Patel', email: 'amit@example.com', role: 'Staff', status: 'Offline', joined: 'Jan 05, 2024', avatar: 'AP' },
  { id: 4, name: 'Sneha Gupta', email: 'sneha@example.com', role: 'Admin', status: 'Active', joined: 'Feb 18, 2024', avatar: 'SG' },
  { id: 5, name: 'Vikram Sharma', email: 'vikram@example.com', role: 'Staff', status: 'Suspended', joined: 'Mar 30, 2024', avatar: 'VS' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'Offline': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    case 'Suspended': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
    default: return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
  }
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your team members and their roles.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none text-sm text-gray-800 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/80 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">User</th>
                <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold">Joined</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {dummyUsers.map((user) => (
                <tr key={user.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border border-transparent ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.joined}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
          <span>Showing 1 to 5 of 5 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
