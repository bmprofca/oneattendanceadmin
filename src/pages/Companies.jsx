import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Activity, Plus, Clock, Eye, Edit2, Trash2, Mail, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { API_BASE } from '../utils/config';
import ManagementTable from '../components/common/ManagementTable';
import ActionCard from '../components/common/ActionCard';
import Modal from '../components/common/Modal';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/companies');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch companies');
      }
    } catch (error) {
      toast.error('Error fetching companies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
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

  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    company.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.legal_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo_url ? (
            <img 
              src={getImageUrl(row.logo_url)}
              alt={row.name}
              className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-100 dark:border-gray-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.name || 'C') + '&background=random';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {row.name ? row.name.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={row.legal_name}>{row.legal_name || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{row.owner_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.owner_email}</div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {[row.city, row.state, row.country].filter(Boolean).join(', ') || 'N/A'}
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
      key: 'created_at',
      label: 'Created',
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
        setSelectedCompany(row);
        setIsViewModalOpen(true);
      }
    },
    {
      label: 'Edit Company',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => toast.success('Edit action clicked')
    },
    {
      label: row.is_active ? 'Deactivate' : 'Activate',
      icon: <Activity className="w-4 h-4" />,
      onClick: () => toast.success('Status toggle action clicked')
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30',
      onClick: () => toast.success('Delete action clicked')
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage tenant companies and their subscriptions.</p>
        </div>
        <RefreshButton onClick={fetchCompanies} loading={loading} />
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
              placeholder="Search companies..."
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
        <ManagementTable
          rows={filteredCompanies}
          columns={columns}
          rowKey="id"
          getActions={getActions}
          accent="indigo"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading companies...' : 'No companies found.'}
            </div>
          }
        />
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
          <span>Showing {filteredCompanies.length > 0 ? 1 : 0} to {filteredCompanies.length} of {companies.length} entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* View Company Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Company Details"
        icon={Briefcase}
        size="md"
        closeText="Close"
      >
        {selectedCompany && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {selectedCompany.logo_url ? (
                 <img 
                 src={getImageUrl(selectedCompany.logo_url)}
                 alt={selectedCompany.name}
                 className="w-20 h-20 rounded-xl object-cover shadow-md border-2 border-gray-100 dark:border-gray-700"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedCompany.name || 'C') + '&size=128&background=random';
                 }}
               />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-gray-100 dark:border-gray-700">
                  {selectedCompany.name ? selectedCompany.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                  {selectedCompany.legal_name || 'No Legal Name'}
                </p>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(selectedCompany.is_active)}`}>
                  {selectedCompany.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Owner Information</h4>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedCompany.owner_name || 'Owner'}</div>
                  <div className="font-medium">{selectedCompany.owner_email || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Phone Number</div>
                  <div className="font-medium">{selectedCompany.owner_phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company Details</h4>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">GST Number</div>
                  <div className="font-medium">{selectedCompany.gst_no || 'Not Provided'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                  <div className="font-medium">
                    {[selectedCompany.address_line1, selectedCompany.address_line2].filter(Boolean).join(', ')}<br />
                    {[selectedCompany.city, selectedCompany.state, selectedCompany.postal_code, selectedCompany.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Created Date</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedCompany.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Last Updated</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedCompany.updated_at).toLocaleDateString()}
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

export default Companies;
