import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Activity, Plus, Eye, Edit2, Trash2, Calendar, Users as UsersIcon } from 'lucide-react';
import apiCall from '../utils/apiCall';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';
import Pagination from '../components/common/PaginationComponent';

const initialFormData = {
  name: '',
  min_employee_count: 1,
  max_employee_count: 50,
  monthly_price: '',
  quarterly_price: '',
  half_yearly_price: '',
  yearly_price: '',
  accept_periods: ['monthly'],
  is_active: 1
};

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const isFetchingRef = useRef(false);

  // Modal state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchPackages = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall(`/packages?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.success) {
        setPackages(data.data || []);
        if (data.meta) {
          setTotalItems(data.meta.total || 0);
        }
      } else {
        toast.error(data.message || 'Failed to fetch packages');
      }
    } catch (error) {
      toast.error('Error fetching packages');
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
      fetchPackages();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedPackage(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      min_employee_count: pkg.min_employee_count,
      max_employee_count: pkg.max_employee_count,
      monthly_price: pkg.monthly_price,
      quarterly_price: pkg.quarterly_price,
      half_yearly_price: pkg.half_yearly_price,
      yearly_price: pkg.yearly_price,
      accept_periods: pkg.accept_periods || [],
      is_active: pkg.is_active
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
      const response = await apiCall(`/packages/${deleteTargetId}`, 'DELETE');
      const data = await response.json();
      if (data.success) {
        toast.success('Package deleted successfully');
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to delete package');
      }
    } catch (error) {
      toast.error('Error deleting package');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleToggleStatus = async (pkg) => {
    try {
      const payload = { ...pkg, is_active: pkg.is_active ? 0 : 1 };
      // we need to remove some fields that shouldn't be sent or might cause issues, but based on API schema we can send full body for PUT
      const response = await apiCall(`/packages/${pkg.id}`, 'PUT', {
        name: pkg.name,
        min_employee_count: pkg.min_employee_count,
        max_employee_count: pkg.max_employee_count,
        monthly_price: pkg.monthly_price,
        quarterly_price: pkg.quarterly_price,
        half_yearly_price: pkg.half_yearly_price,
        yearly_price: pkg.yearly_price,
        accept_periods: pkg.accept_periods,
        is_active: payload.is_active
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Package ${payload.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to update package status');
      }
    } catch (error) {
      toast.error('Error updating package status');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = selectedPackage ? `/packages/${selectedPackage.id}` : '/packages';
      const method = selectedPackage ? 'PUT' : 'POST';

      const payload = { ...formData };
      payload.min_employee_count = parseInt(payload.min_employee_count);
      payload.max_employee_count = parseInt(payload.max_employee_count);
      payload.monthly_price = parseFloat(payload.monthly_price || 0);
      payload.quarterly_price = parseFloat(payload.quarterly_price || 0);
      payload.half_yearly_price = parseFloat(payload.half_yearly_price || 0);
      payload.yearly_price = parseFloat(payload.yearly_price || 0);

      const response = await apiCall(url, method, payload);

      const data = await response.json();
      if (data.success) {
        toast.success(selectedPackage ? 'Package updated successfully' : 'Package created successfully');
        setIsFormModalOpen(false);
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to save package');
      }
    } catch (error) {
      toast.error('Error saving package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePeriodToggle = (period) => {
    setFormData(prev => {
      const current = prev.accept_periods || [];
      if (current.includes(period)) {
        return { ...prev, accept_periods: current.filter(p => p !== period) };
      }
      return { ...prev, accept_periods: [...current, period] };
    });
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
  };

  const columns = [
    {
      key: 'name',
      label: 'Package Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
        </div>
      )
    },
    {
      key: 'employees',
      label: 'Employee Limit',
      render: (row) => (
        <div className="text-gray-700 dark:text-gray-300 font-medium">
          {row.min_employee_count} - {row.max_employee_count}
        </div>
      )
    },
    {
      key: 'pricing',
      label: 'Monthly Price',
      render: (row) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          ₹{row.monthly_price}
        </div>
      )
    },
    {
      key: 'periods',
      label: 'Billing Periods',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.accept_periods?.map(period => (
            <span key={period} className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              {period.replace('_', ' ')}
            </span>
          ))}
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
        setSelectedPackage(row);
        setIsViewModalOpen(true);
      }
    },
    {
      label: 'Edit Package',
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Packages</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage pricing tiers and limits.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={fetchPackages} loading={loading} />
          <button onClick={handleOpenCreate} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
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
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none text-sm text-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        <ManagementTable
          rows={packages}
          columns={columns}
          rowKey="id"
          getActions={getActions}
          onRowClick={(row) => {
            setSelectedPackage(row);
            setIsViewModalOpen(true);
          }}
          accent="purple"
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading packages...' : 'No packages found.'}
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

      {/* View Package Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Package Details"
        icon={Package}
        size="lg"
        closeText="Close"
      >
        {selectedPackage && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPackage.name}</h3>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(selectedPackage.is_active)}`}>
                    {selectedPackage.is_active ? 'Active Package' : 'Inactive Package'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{selectedPackage.monthly_price}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">per month</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Employee Constraints</h4>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedPackage.min_employee_count} <span className="text-gray-500 font-medium">to</span> {selectedPackage.max_employee_count} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">employees allowed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing Breakdown</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{selectedPackage.monthly_price}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quarterly</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{selectedPackage.quarterly_price}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Half-Yearly</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{selectedPackage.half_yearly_price}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Yearly</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{selectedPackage.yearly_price}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accepted Billing Periods</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPackage.accept_periods?.map(period => (
                  <span key={period} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                    {period.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {selectedPackage.created_at && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-4">
                <Calendar className="w-3 h-3" />
                <span>Created on {new Date(selectedPackage.created_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedPackage ? 'Edit Package' : 'Create Package'}
        icon={Package}
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
              form="package-form"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Activity className="w-4 h-4 animate-spin" />}
              {selectedPackage ? 'Save Changes' : 'Create Package'}
            </button>
          </>
        }
      >
        <form id="package-form" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                placeholder="e.g. Pro Tier"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Employees</label>
              <input
                type="number"
                min="1"
                required
                value={formData.min_employee_count}
                onChange={(e) => setFormData({ ...formData, min_employee_count: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Employees</label>
              <input
                type="number"
                min="1"
                required
                value={formData.max_employee_count}
                onChange={(e) => setFormData({ ...formData, max_employee_count: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quarterly Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.quarterly_price}
                onChange={(e) => setFormData({ ...formData, quarterly_price: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Half-Yearly Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.half_yearly_price}
                onChange={(e) => setFormData({ ...formData, half_yearly_price: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yearly Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.yearly_price}
                onChange={(e) => setFormData({ ...formData, yearly_price: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2 mt-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Accepted Billing Periods</label>
              <div className="flex flex-wrap gap-3">
                {['monthly', 'quarterly', 'half_yearly', 'yearly'].map(period => (
                  <label key={period} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border ${formData.accept_periods.includes(period) ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 group-hover:border-blue-500'} flex items-center justify-center transition-colors`}>
                      {formData.accept_periods.includes(period) && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{period.replace('_', '-')}</span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.accept_periods.includes(period)}
                      onChange={() => handlePeriodToggle(period)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Active Package</span>
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
          Are you sure you want to delete this package? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Packages;
