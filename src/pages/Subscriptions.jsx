import React, { useState, useEffect, useRef } from 'react';
import { Search, Wallet, Activity, Plus, Eye, Edit2, Trash2, Calendar, FileText, Users as UsersIcon, Lock, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import apiCall from '../utils/apiCall';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import RefreshButton from '../components/common/RefreshButton';
import SelectField from '../components/common/SelectField';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';
import { toast } from 'react-hot-toast';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().substring(0, 16);
};

// Convert YYYY-MM-DD (from AdvancedDateFilter) → ISO datetime string at noon UTC
const isoDateToDatetime = (isoDate) => {
  if (!isoDate) return '';
  // Use noon local time so timezone offsets don't shift the date
  const d = new Date(`${isoDate}T12:00:00`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
};

// Extract YYYY-MM-DD from an ISO datetime string for the picker's value object
const datetimeToPickerValue = (datetimeStr) => {
  if (!datetimeStr) return { date: '', month: '', year: '', from_date: '', to_date: '' };
  const d = new Date(datetimeStr);
  if (isNaN(d.getTime())) return { date: '', month: '', year: '', from_date: '', to_date: '' };
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { date: `${y}-${m}-${day}`, month: '', year: '', from_date: '', to_date: '' };
};

// Map subscription_type → package price field key
const PERIOD_PRICE_KEY = {
  monthly:     'monthly_price',
  quarterly:   'quarterly_price',
  half_yearly: 'half_yearly_price',
  yearly:      'yearly_price',
};

const BILLING_PERIOD_OPTIONS = [
  { value: 'monthly',     label: 'Monthly' },
  { value: 'quarterly',   label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'yearly',      label: 'Yearly' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed',  label: 'Failed' },
];

const initialFormData = {
  company_id: '',
  subscription_package_id: '',
  employee_limit: '',
  subscription_type: 'monthly',
  amount_paid: '',
  starts_at: '',
  expires_at: '',
  payment_reference: '',
  payment_order_id: '',
  payment_vpa: '',
  payment_utr: '',
  payment_status: 'pending',
  is_active: 1
};

const inputClass =
  'w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-colors';

const readonlyClass =
  'w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-500 dark:text-gray-400 cursor-not-allowed select-none';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);
  const dependenciesLoadedRef = useRef(false);
  const isFetchingDepsRef = useRef(false);

  // Modal state
  const [selectedSub, setSelectedSub] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notify Modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);
  const [isNotifying, setIsNotifying] = useState(false);

  // ─── Derived: selected package object ────────────────────────────────────
  const selectedPackage = packagesList.find(
    (p) => String(p.id) === String(formData.subscription_package_id)
  ) || null;

  // Auto-derive employee_limit and amount_paid from package + billing period
  const derivedEmployeeLimit = selectedPackage
    ? selectedPackage.max_employee_count
    : '';
  const derivedAmountPaid = selectedPackage && formData.subscription_type
    ? (selectedPackage[PERIOD_PRICE_KEY[formData.subscription_type]] ?? '')
    : '';

  // ─── API helpers ─────────────────────────────────────────────────────────
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
    if (isFetchingDepsRef.current) return;
    isFetchingDepsRef.current = true;
    try {
      const [compRes, packRes] = await Promise.all([
        apiCall('/companies'),
        apiCall('/packages')
      ]);
      const compData = await compRes.json();
      const packData = await packRes.json();
      if (compData.success) setCompanies(compData.data || []);
      if (packData.success) setPackagesList(packData.data || []);
      dependenciesLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching dependencies', error);
    } finally {
      isFetchingDepsRef.current = false;
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Lazily load companies + packages only when the form modal needs them
  const ensureDependenciesLoaded = async () => {
    if (dependenciesLoadedRef.current || isFetchingDepsRef.current) return;
    await fetchDependencies();
  };

  // ─── Modal handlers ───────────────────────────────────────────────────────
  const handleOpenCreate = async () => {
    setSelectedSub(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
    await ensureDependenciesLoaded();
  };

  const handleOpenEdit = async (sub) => {
    setSelectedSub(sub);
    setFormData({
      company_id: sub.company_id,
      subscription_package_id: sub.subscription_package_id,
      employee_limit: sub.employee_limit ?? '',
      subscription_type: sub.subscription_type || 'monthly',
      amount_paid: sub.amount_paid ?? '',
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
    await ensureDependenciesLoaded();
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

  const handleNotify = async (sub) => {
    setIsNotifying(true);
    try {
      const response = await apiCall(`/subscriptions/${sub.id}/notify`, 'POST');
      const data = await response.json();
      if (data.success) {
        setNotifyResult(data.data);
        setIsNotifyModalOpen(true);
        toast.success(data.message || 'WhatsApp notification sent successfully');
      } else {
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      toast.error('Error sending WhatsApp notification');
    } finally {
      setIsNotifying(false);
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
      // Use derived values for read-only fields
      payload.employee_limit = parseInt(derivedEmployeeLimit) || parseInt(formData.employee_limit) || 0;
      payload.amount_paid    = parseFloat(derivedAmountPaid)  || parseFloat(formData.amount_paid)  || 0;
      payload.company_id                = parseInt(payload.company_id);
      payload.subscription_package_id   = parseInt(payload.subscription_package_id);

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

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getStatusColor = (isActive) =>
    isActive
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'failed':  return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default:        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // react-select option arrays
  const companyOptions  = companies.map((c) => ({ value: c.id, label: c.name }));
  const packageOptions  = packagesList.map((p) => ({ value: p.id, label: p.name }));

  // Allowed billing periods for the selected package (only those in accept_periods)
  const allowedBillingOptions = selectedPackage
    ? BILLING_PERIOD_OPTIONS.filter((opt) =>
        selectedPackage.accept_periods?.includes(opt.value)
      )
    : BILLING_PERIOD_OPTIONS;

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.company_legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.company_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={row.company_legal_name}>
            {row.company_legal_name || 'N/A'}
          </div>
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
            <span className="text-xs text-gray-400 inline-block w-8">From:</span>{' '}
            {new Date(row.starts_at).toLocaleDateString()}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-xs text-gray-400 inline-block w-8">To:</span>{' '}
            {new Date(row.expires_at).toLocaleDateString()}
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
      onClick: () => { setSelectedSub(row); setIsViewModalOpen(true); }
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
      label: 'Send WhatsApp Notification',
      icon: <Bell className="w-4 h-4 text-green-500" />,
      onClick: () => handleNotify(row)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30',
      onClick: () => handleDeleteClick(row.id)
    }
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage tenant subscription plans and payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={fetchSubscriptions} loading={loading} />
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
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
          onRowClick={(row) => { setSelectedSub(row); setIsViewModalOpen(true); }}
          accent="indigo"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading subscriptions...' : 'No subscriptions found.'}
            </div>
          }
        />

        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
          <span>
            Showing {filteredSubscriptions.length > 0 ? 1 : 0} to {filteredSubscriptions.length} of {subscriptions.length} entries
          </span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* ── View Subscription Modal ── */}
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
                {[
                  { label: 'Payment Reference', val: selectedSub.payment_reference },
                  { label: 'Order ID',           val: selectedSub.payment_order_id },
                  { label: 'VPA',                val: selectedSub.payment_vpa },
                  { label: 'UTR',                val: selectedSub.payment_utr },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={val}>
                      {val || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Form Modal (Create / Edit) ── */}
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

            {/* Company */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
              <SelectField
                options={companyOptions}
                value={companyOptions.find((o) => String(o.value) === String(formData.company_id)) || null}
                onChange={(opt) => setFormData({ ...formData, company_id: opt ? opt.value : '' })}
                placeholder="Select a company"
                isClearable
              />
            </div>

            {/* Package */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package</label>
              <SelectField
                options={packageOptions}
                value={packageOptions.find((o) => String(o.value) === String(formData.subscription_package_id)) || null}
                onChange={(opt) => {
                  const newPkgId = opt ? opt.value : '';
                  // When package changes, reset billing type to first allowed period of new package
                  const newPkg = packagesList.find((p) => String(p.id) === String(newPkgId));
                  const firstPeriod = newPkg?.accept_periods?.[0] || 'monthly';
                  setFormData({
                    ...formData,
                    subscription_package_id: newPkgId,
                    subscription_type: firstPeriod,
                  });
                }}
                placeholder="Select a package"
                isClearable
              />
            </div>

            {/* Billing Period — only shows periods the package accepts */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Period</label>
              <SelectField
                options={allowedBillingOptions}
                value={BILLING_PERIOD_OPTIONS.find((o) => o.value === formData.subscription_type) || null}
                onChange={(opt) =>
                  setFormData({ ...formData, subscription_type: opt ? opt.value : 'monthly' })
                }
                placeholder="Select billing period"
                isDisabled={!selectedPackage}
              />
            </div>

            {/* Employee Limit — read-only, auto-filled from package */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                Employee Limit
                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">(auto from package)</span>
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedEmployeeLimit !== '' ? `${derivedEmployeeLimit} employees max` : '—'}
                className={readonlyClass}
              />
            </div>

            {/* Amount Paid — read-only, auto-filled from package + billing period */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                Amount (₹)
                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">(auto from package &amp; period)</span>
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedAmountPaid !== '' ? `₹ ${derivedAmountPaid}` : '—'}
                className={readonlyClass}
              />
            </div>

            {/* Payment Status */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
              <SelectField
                options={PAYMENT_STATUS_OPTIONS}
                value={PAYMENT_STATUS_OPTIONS.find((o) => o.value === formData.payment_status) || null}
                onChange={(opt) =>
                  setFormData({ ...formData, payment_status: opt ? opt.value : 'pending' })
                }
                placeholder="Select status"
              />
            </div>

            {/* Starts At */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Starts At</label>
              <div className={`rounded-lg border border-gray-200 dark:border-gray-700 ${inputClass} !px-0 !py-0 overflow-hidden`}>
                <AdvancedDateFilter
                  value={datetimeToPickerValue(formData.starts_at)}
                  onChange={(val) =>
                    setFormData({ ...formData, starts_at: isoDateToDatetime(val.date) })
                  }
                  placeholder="Select start date"
                  tabOptions={['date']}
                  buttonClassName="w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none"
                />
              </div>
            </div>

            {/* Expires At */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expires At</label>
              <div className={`rounded-lg border border-gray-200 dark:border-gray-700 ${inputClass} !px-0 !py-0 overflow-hidden`}>
                <AdvancedDateFilter
                  value={datetimeToPickerValue(formData.expires_at)}
                  onChange={(val) =>
                    setFormData({ ...formData, expires_at: isoDateToDatetime(val.date) })
                  }
                  placeholder="Select expiry date"
                  tabOptions={['date']}
                  buttonClassName="w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none"
                />
              </div>
            </div>

            {/* Payment Reference */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Reference</label>
              <input
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                className={inputClass}
                placeholder="Optional"
              />
            </div>

            {/* Edit-only fields */}
            {selectedSub && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</label>
                  <input
                    type="text"
                    value={formData.payment_order_id}
                    onChange={(e) => setFormData({ ...formData, payment_order_id: e.target.value })}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">VPA</label>
                  <input
                    type="text"
                    value={formData.payment_vpa}
                    onChange={(e) => setFormData({ ...formData, payment_vpa: e.target.value })}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">UTR</label>
                  <input
                    type="text"
                    value={formData.payment_utr}
                    onChange={(e) => setFormData({ ...formData, payment_utr: e.target.value })}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            {/* Active toggle */}
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

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
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

      {/* ── Notify Result Modal ── */}
      <Modal
        isOpen={isNotifyModalOpen}
        onClose={() => { setIsNotifyModalOpen(false); setNotifyResult(null); }}
        title="WhatsApp Notification Sent"
        icon={Bell}
        size="sm"
        closeText="Close"
      >
        {notifyResult && (
          <div className="space-y-4">
            {notifyResult.type === 'expiry_alert' ? (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">Expiry Alert Sent</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Subscription is still active</p>
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Company</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Package</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Starts At</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.starts_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Expires At</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.expires_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Days Remaining</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{notifyResult.days_remaining} days</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Sent To</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.mobile_sent_to}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">Renewal Request Sent</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Subscription has already expired</p>
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Company</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Package</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Expired On</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{notifyResult.expired_on}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Sent To</span>
                    <span className="font-medium text-gray-900 dark:text-white">{notifyResult.mobile_sent_to}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subscriptions;
