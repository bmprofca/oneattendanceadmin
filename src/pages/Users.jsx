import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Users as UsersIcon, Activity, UserPlus, Eye, Edit2, Trash2, Mail, Phone, Calendar, Clock, Shield } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { API_BASE } from '../utils/config';
import ManagementTable from '../components/common/ManagementTable';
import ActionCard from '../components/common/ActionCard';
import Modal from '../components/common/Modal';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchUsers = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall('/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE.replace(/\/admin\/?$/, '');
    return `${baseUrl}${path}`;
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profile_picture ? (
            <img 
              src={getImageUrl(row.profile_picture)}
              alt={row.name}
              className="w-10 h-10 rounded-full object-cover shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.name || 'U');
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {row.profession || (row.is_system_admin ? 'System Admin' : 'User')}
        </span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.phone || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border border-transparent ${getStatusColor(row.is_active)}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    }
  ];

  const getActions = (row) => [
    {
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        setSelectedUser(row);
        setIsViewModalOpen(true);
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage system users and their roles.</p>
        </div>
        <RefreshButton onClick={fetchUsers} loading={loading} />
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none text-sm text-gray-800 dark:text-white"
            />
          </div>
          
        </div>

        {/* Table */}
        <ManagementTable
          rows={filteredUsers}
          columns={columns}
          rowKey="id"
          getActions={getActions}
          onRowClick={(row) => {
            setSelectedUser(row);
            setIsViewModalOpen(true);
          }}
          accent="blue"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading users...' : 'No users found.'}
            </div>
          }
        />
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
          <span>Showing {filteredUsers.length > 0 ? 1 : 0} to {filteredUsers.length} of {users.length} entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
        icon={UsersIcon}
        size="lg"
        closeText="Close"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {selectedUser.profile_picture ? (
                 <img 
                 src={getImageUrl(selectedUser.profile_picture)}
                 alt={selectedUser.name}
                 className="w-20 h-20 rounded-full object-cover shadow-md border-4 border-white dark:border-gray-700"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedUser.name || 'U') + '&size=128';
                 }}
               />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-md border-4 border-white dark:border-gray-700">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {selectedUser.profession || (selectedUser.is_system_admin ? 'System Admin' : 'User')}
                </p>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(selectedUser.is_active)}`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Email Address</div>
                  <div className="font-medium">{selectedUser.email || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Phone Number</div>
                  <div className="font-medium">{selectedUser.phone || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Shield className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">System Admin</div>
                  <div className="font-medium">{selectedUser.is_system_admin ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Joined Date</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Last Login</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
