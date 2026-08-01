import React, { useState, useEffect, useRef } from 'react';
import { Search, Wallet, Activity, Plus, Eye, Edit2, Trash2, Calendar, FileText, Users as UsersIcon } from 'lucide-react';
import apiCall from '../utils/apiCall';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().substring(0, 16);
};

const initialFormData = {
  company_id: '',
  subscription_package_id: '',
  employee_limit: 100,
  subscription_type: 'monthly',
  amount_paid: 0,
  starts_at: '',
  expires_at: '',
  payment_reference: '',
  payment_order_id: '',
  payment_vpa: '',
  payment_utr: '',
  payment_status: 'pending',
  is_active: 1
};

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);
  
  // Modal state
  const [selectedSub, setSelectedSub] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchSubscriptions = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall('/subscriptions');
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch subscriptions');
      }
    } catch (error) {
      toast.error('Error fetching subscriptions');
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchDependencies = async () => {
    try {
      const [compRes, packRes] = await Promise.all([
        apiCall('/companies'),
        apiCall('/packages')
      ]);
      const compData = await compRes.json();
      const packData = await packRes.json();
      if (compData.success) setCompanies(compData.data || []);
      if (packData.success) setPackagesList(packData.data || []);
    } catch (error) {
      console.error("Error fetching dependencies", error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    setSelectedSub(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setSelectedSub(sub);
    setFormData({
      company_id: sub.company_id,
      subscription_package_id: sub.subscription_package_id,
      employee_limit: sub.employee_limit || 100,
      subscription_type: sub.subscription_type || 'monthly',
      amount_paid: sub.amount_paid || 0,
      starts_at: formatDateForInput(sub.starts_at),
      expires_at: formatDateForInput(sub.expires_at),
      payment_reference: sub.payment_reference || '',
      payment_order_id: sub.payment_order_id || '',
      payment_vpa: sub.payment_vpa || '',
      payment_utr: sub.payment_utr || '',
      payment_status: sub.payment_status || 'pending',
      is_active: sub.is_active ? 1 : 0
    });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const response = await apiCall(`/subscriptions/${deleteTargetId}`, 'DELETE');
      const data = await response.json();
      if (data.success) {
        toast.success('Subscription deleted successfully');
        fetchSubscriptions();
      } else {
        toast.error(data.message || 'Failed to delete subscription');
      }
    } catch (error) {
      toast.error('Error deleting subscription');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleToggleStatus = async (sub) => {
    try {
      const payload = { 
        is_active: sub.is_active ? 0 : 1,
        status: sub.is_active ? 'inactive' : 'active',
        payment_status: sub.payment_status,
        starts_at: sub.starts_at,
        expires_at: sub.expires_at
      };
      
      const response = await apiCall(`/subscriptions/${sub.id}/status`, 'PATCH', payload);
      const data = await response.json();
      if (data.success) {
        toast.success(`Subscription ${payload.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchSubscriptions();
      } else {
        toast.error(data.message || 'Failed to update subscription status');
      }
    } catch (error) {
      toast.error('Error updating subscription status');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = selectedSub ? `/subscriptions/${selectedSub.id}` : '/subscriptions';
      const method = selectedSub ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      payload.company_id = parseInt(payload.company_id);
      payload.subscription_package_id = parseInt(payload.subscription_package_id);
      payload.employee_limit = parseInt(payload.employee_limit);
      payload.amount_paid = parseFloat(payload.amount_paid);
      
      if (payload.starts_at) payload.starts_at = new Date(payload.starts_at).toISOString();
      if (payload.expires_at) payload.expires_at = new Date(payload.expires_at).toISOString();

      const response = await apiCall(url, method, payload);
      
      const data = await response.json();
      if (data.success) {
        toast.success(selectedSub ? 'Subscription updated successfully' : 'Subscription created successfully');
        setIsFormModalOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(data.message || 'Failed to save subscription');
      }
    } catch (error) {
      toast.error('Error saving subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
  };

  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sub.company_legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.company_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={row.company_legal_name}>{row.company_legal_name || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'package',
      label: 'Package',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{row.package_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.subscription_type}</div>
        </div>
      )
    },
    {
      key: 'limit',
      label: 'Employees',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {row.employee_limit} <span className="text-xs font-normal text-gray-400">max</span>
        </span>
      )
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">₹{row.amount_paid}</div>
          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-transparent ${getPaymentStatusColor(row.payment_status)}`}>
            {row.payment_status || 'Unknown'}
          </span>
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Validity',
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-xs text-gray-400 inline-block w-8">From:</span> {new Date(row.starts_at).toLocaleDateString()}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-xs text-gray-400 inline-block w-8">To:</span> {new Date(row.expires_at).toLocaleDateString()}
          </div>
        </div>
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
    }
  ];

  const getActions = (row) => [
    {
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        setSelectedSub(row);
        setIsViewModalOpen(true);
      }
    },
    {
      label: 'Edit Subscription',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => handleOpenEdit(row)
    },
    {
      label: row.is_active ? 'Deactivate' : 'Activate',
      icon: <Activity className="w-4 h-4" />,
      onClick: () => handleToggleStatus(row)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30',
      onClick: () => handleDeleteClick(row.id)
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage tenant subscription plans and payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={fetchSubscriptions} loading={loading} />
          <button onClick={handleOpenCreate} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
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
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none text-sm text-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        <ManagementTable
          rows={filteredSubscriptions}
          columns={columns}
          rowKey="id"
          getActions={getActions}
          onRowClick={(row) => {
            setSelectedSub(row);
            setIsViewModalOpen(true);
          }}
          accent="indigo"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading subscriptions...' : 'No subscriptions found.'}
            </div>
          }
        />
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
          <span>Showing {filteredSubscriptions.length > 0 ? 1 : 0} to {filteredSubscriptions.length} of {subscriptions.length} entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* View Subscription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Subscription Details"
        icon={Wallet}
        size="lg"
        closeText="Close"
      >
        {selectedSub && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSub.company_name}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                  {selectedSub.company_legal_name || 'No Legal Name'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(selectedSub.is_active)}`}>
                    {selectedSub.is_active ? 'Active Status' : 'Inactive Status'}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border border-transparent ${getPaymentStatusColor(selectedSub.payment_status)}`}>
                    Payment: {selectedSub.payment_status || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{selectedSub.amount_paid}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedSub.subscription_type} Plan</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Plan Name</div>
                  <FileText className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedSub.package_name}</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Employee Limit</div>
                  <UsersIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedSub.employee_limit} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">max</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Validity Period</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Starts At</div>
                    <div className="font-medium">{new Date(selectedSub.starts_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Expires At</div>
                    <div className="font-medium">{new Date(selectedSub.expires_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transaction Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Reference</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={selectedSub.payment_reference}>
                    {selectedSub.payment_reference || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={selectedSub.payment_order_id}>
                    {selectedSub.payment_order_id || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">VPA</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={selectedSub.payment_vpa}>
                    {selectedSub.payment_vpa || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">UTR</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={selectedSub.payment_utr}>
                    {selectedSub.payment_utr || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedSub ? 'Edit Subscription' : 'Create Subscription'}
        icon={Wallet}
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="subscription-form"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Activity className="w-4 h-4 animate-spin" />}
              {selectedSub ? 'Save Changes' : 'Create Subscription'}
            </button>
          </>
        }
      >
        <form id="subscription-form" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="">Select a company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package</label>
              <select
                required
                value={formData.subscription_package_id}
                onChange={(e) => setFormData({ ...formData, subscription_package_id: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="">Select a package</option>
                {packagesList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Period</label>
              <select
                required
                value={formData.subscription_type}
                onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white capitalize"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee Limit</label>
              <input
                type="number"
                min="1"
                required
                value={formData.employee_limit}
                onChange={(e) => setFormData({ ...formData, employee_limit: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
              <select
                required
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white capitalize"
              >
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Starts At</label>
              <input
                type="datetime-local"
                required
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expires At</label>
              <input
                type="datetime-local"
                required
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Reference</label>
              <input
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                placeholder="Optional"
              />
            </div>

            {selectedSub && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</label>
                  <input
                    type="text"
                    value={formData.payment_order_id}
                    onChange={(e) => setFormData({ ...formData, payment_order_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">VPA</label>
                  <input
                    type="text"
                    value={formData.payment_vpa}
                    onChange={(e) => setFormData({ ...formData, payment_vpa: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">UTR</label>
                  <input
                    type="text"
                    value={formData.payment_utr}
                    onChange={(e) => setFormData({ ...formData, payment_utr: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Active Subscription</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetId(null);
        }}
        title="Confirm Deletion"
        icon={Trash2}
        size="sm"
        onConfirm={confirmDelete}
        confirmText="Delete"
        closeText="Cancel"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this subscription? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Subscriptions;
