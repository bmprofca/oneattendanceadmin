import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Briefcase, Activity, Plus, Clock, Eye, Edit2, Trash2, Mail, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { API_BASE } from '../utils/config';
import ManagementTable from '../components/common/ManagementTable';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';
import Pagination from '../components/common/PaginationComponent';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const isFetchingRef = useRef(false);

  const fetchCompanies = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall(`/companies?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data || []);
        if (data.meta) {
          setTotalItems(data.meta.total || 0);
        }
      } else {
        toast.error(data.message || 'Failed to fetch companies');
      }
    } catch (error) {
      toast.error('Error fetching companies');
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, searchTerm]);

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
      onClick: () => navigate(`/companies/${row.id}`)
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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

        </div>

        {/* Table */}
        <ManagementTable
          rows={companies}
          columns={columns}
          rowKey="id"
          getActions={getActions}
          onRowClick={(row) => navigate(`/companies/${row.id}`)}
          accent="indigo"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading companies...' : 'No companies found.'}
            </div>
          }
        />

        <Pagination
          currentPage={page}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
};

export default Companies;
