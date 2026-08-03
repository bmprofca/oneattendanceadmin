import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, Shield, Building2,
  CreditCard, Package, Landmark, Users, Briefcase, MapPin,
  FileText, CheckCircle2, XCircle, Crown, ChevronRight, Activity
} from 'lucide-react';
import apiCall from '../utils/apiCall';
import { API_BASE } from '../utils/config';
import ManagementTable from '../components/common/ManagementTable';
import Pagination from '../components/common/PaginationComponent';
import { toast } from 'react-hot-toast';

/* ──────────────────── helpers ──────────────────── */

const fmt = {
  date: (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
  dateTime: (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'),
  currency: (v) => (v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—'),
  mask: (v) => (v ? '••••' + v.slice(-4) : '—'),
};

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE.replace(/\/admin\/?$/, '');
  return `${baseUrl}${path}`;
};

const StatusBadge = ({ active, trueLabel = 'Active', falseLabel = 'Inactive' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${active
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    }`}>
    {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {active ? trueLabel : falseLabel}
  </span>
);

const InfoRow = ({ icon: Icon, color, label, value }) => (
  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-medium truncate">{value || '—'}</div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, color, label, value }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{label}</div>
    </div>
  </div>
);

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-5">
      <Skeleton className="w-16 h-16 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-3 p-6">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

/* ──────────────────── tabs config ──────────────────── */

const TABS = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'subscriptions', label: 'Subscriptions', icon: Package },
  { key: 'transactions', label: 'Transactions', icon: CreditCard },
  { key: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
];

/* ──────────────────── Tab content components ──────────────────── */

const OverviewTab = ({ company, companyId }) => {
  const [attendance, setAttendance] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingAtt(true);
      try {
        const res = await apiCall(`/companies/${companyId}/attendance-overview`);
        const json = await res.json();
        if (json.success) {
          setAttendance(json.data);
        }
      } catch (e) {
        console.error("Failed to load attendance", e);
      } finally {
        setLoadingAtt(false);
      }
    };
    fetchAttendance();
  }, [companyId]);

  if (!company) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Owner Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Crown className="w-4 h-4" /> Owner Information
        </h3>
        <div className="flex items-center gap-4 mb-4">
          {company.owner_profile_picture ? (
            <img src={getImageUrl(company.owner_profile_picture)} alt={company.owner_name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {company.owner_name ? company.owner_name.charAt(0).toUpperCase() : 'O'}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-900 dark:text-white">{company.owner_name || '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Company Owner</div>
          </div>
        </div>
        <div className="space-y-4">
          <InfoRow icon={Mail} color="from-blue-500 to-blue-600" label="Email Address" value={company.owner_email} />
          <InfoRow icon={Phone} color="from-green-500 to-emerald-600" label="Phone Number" value={company.owner_phone} />
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Company Details
        </h3>
        <div className="space-y-4">
          <InfoRow icon={FileText} color="from-orange-500 to-red-600" label="GST Number" value={company.gst_no} />
          <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0`}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
              <div className="font-medium">
                {[company.address_line1, company.address_line2].filter(Boolean).join(', ')}
                {company.address_line1 && <br />}
                {[company.city, company.state, company.postal_code, company.country].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
          <InfoRow icon={Briefcase} color="from-cyan-500 to-blue-600" label="Attendance Methods" value={company.attendance_methods} />
        </div>
      </div>

      {/* Active Subscription */}
      {company.active_subscription && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
            <Package className="w-4 h-4" /> Active Subscription
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
              <div className="text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-wider font-semibold mb-1">Plan</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {company.active_subscription.package_name}
                {company.active_subscription.package_type === 'custom' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Custom</span>
                )}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 capitalize mt-0.5">{company.active_subscription.subscription_type}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
               <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Employee Limit</div>
               <div className="text-lg font-bold text-gray-900 dark:text-white">{company.active_subscription.employee_limit} <span className="text-sm font-normal text-gray-500">Max</span></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
               <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Expires On</div>
               <div className="text-lg font-bold text-gray-900 dark:text-white">{fmt.date(company.active_subscription.expires_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Overview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Attendance Overview (Current Month)
        </h3>
        {loadingAtt ? (
          <Skeleton className="h-24" />
        ) : attendance ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">Unique Employees</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{attendance.time_summary?.unique_employees ?? 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Shifts</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{attendance.time_summary?.total_shifts ?? 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Leaves</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{attendance.leave_summary?.total_leaves ?? 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">Late Minutes</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{attendance.time_summary?.total_late_minutes ?? 0}m</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">No attendance data available.</div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Created At</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{fmt.dateTime(company.created_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Updated</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{fmt.dateTime(company.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────── Paginated tab wrapper ──────────── */

const usePaginatedTab = (companyId, endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await apiCall(`/companies/${companyId}/${endpoint}?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.meta) setTotal(json.meta.total || 0);
      } else {
        toast.error(json.message || `Failed to fetch ${endpoint}`);
      }
    } catch {
      toast.error(`Error fetching ${endpoint}`);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [companyId, endpoint, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, page, setPage, limit, setLimit, total };
};

/* ──────────── Employees tab ──────────── */

const EmployeesTab = ({ companyId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(companyId, 'employees');

  const rows = data || [];

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profile_picture ? (
            <img src={getImageUrl(row.profile_picture)} alt={row.name} className="w-9 h-9 rounded-full object-cover shadow-sm"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'E')}&background=6366f1&color=fff`; }} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {(row.name || 'E').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.employee_code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role & Type',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{row.designation || '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.employment_type?.replace('_', ' ') || '—'}</div>
        </div>
      ),
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.shift_start} - {row.shift_end}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge active={row.is_active} />,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{fmt.date(row.joining_date)}</span>,
    },
  ];

  if (loading && !rows.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <ManagementTable rows={rows} columns={columns} rowKey="id" accent="indigo"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading employees...' : 'No employees found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Subscriptions tab ──────────── */

const SubscriptionsTab = ({ companyId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(companyId, 'subscriptions');
  const rows = data || [];

  const paymentStatusMap = {
    '0': { label: 'Pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    '1': { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    '2': { label: 'Failed', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  };

  const columns = [
    {
      key: 'package',
      label: 'Package',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 dark:text-white">{row.package_name || '—'}</div>
            {row.package_type === 'custom' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Custom</span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.subscription_type} • Up to {row.employee_limit} employees</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{fmt.currency(row.amount_paid)}</span>,
    },
    {
      key: 'period',
      label: 'Period',
      render: (row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">{fmt.date(row.starts_at)}</div>
          <div className="flex items-center gap-1 text-xs">
            <ChevronRight className="w-3 h-3" /> {fmt.date(row.expires_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (row) => {
        const s = paymentStatusMap[row.payment_status] || { label: row.payment_status, cls: 'bg-gray-100 text-gray-600' };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${s.cls}`}>{s.label}</span>;
      },
    },
    {
      key: 'active',
      label: 'Active',
      render: (row) => <StatusBadge active={row.is_active} />,
    },
  ];

  if (loading && !rows.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <ManagementTable rows={rows} columns={columns} rowKey="id" accent="violet"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading subscriptions...' : 'No subscriptions found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Transactions tab ──────────── */

const TransactionsTab = ({ companyId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(companyId, 'transactions');

  const transactions = data?.transactions || [];
  const summary = data?.summary || { total_credit: 0, total_debit: 0 };

  const typeColors = {
    payment: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    refund: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  };
  const entryColors = {
    debit: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    credit: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  };

  const columns = [
    {
      key: 'txn_id',
      label: 'Transaction ID',
      render: (row) => <span className="font-mono text-sm text-gray-900 dark:text-white">{row.transaction_id || '—'}</span>,
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-700 dark:text-gray-300 font-medium">{row.employee_name || '—'}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full w-fit capitalize ${typeColors[row.transaction_type] || 'bg-gray-100 text-gray-600'}`}>
            {row.transaction_type}
          </span>
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full w-fit capitalize ${entryColors[row.entry_type] || 'bg-gray-100 text-gray-600'}`}>
            {row.entry_type}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className={`font-semibold text-sm ${row.entry_type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.entry_type === 'credit' ? '+' : '-'}{fmt.currency(row.amount)}
        </span>
      ),
    },
    {
      key: 'remark',
      label: 'Remark',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-sm truncate block max-w-[180px]">{row.remark || '—'}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{fmt.date(row.transaction_date)}</span>,
    },
  ];

  if (loading && !transactions.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Credit</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{fmt.currency(summary.total_credit)}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Debit</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{fmt.currency(summary.total_debit)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <ManagementTable rows={transactions} columns={columns} rowKey="id" accent="blue"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading transactions...' : 'No transactions found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Bank Accounts tab ──────────── */

const BankAccountsTab = ({ companyId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(companyId, 'bank-accounts');
  const rows = data || [];

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-900 dark:text-white font-medium">{row.employee_name || '—'}</span>,
    },
    {
      key: 'bank',
      label: 'Bank',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.bank_name || '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.branch_name || ''}</div>
        </div>
      ),
    },
    {
      key: 'holder',
      label: 'Account Holder',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.account_holder_name || '—'}</span>,
    },
    {
      key: 'account',
      label: 'Account No.',
      render: (row) => (
        <div className="font-mono text-sm">
          <div className="text-gray-900 dark:text-white">{fmt.mask(row.account_number)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.ifsc_code || ''}</div>
        </div>
      ),
    },
    {
      key: 'upi',
      label: 'UPI',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{row.upi_id || '—'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full capitalize bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {row.account_type || '—'}
        </span>
      ),
    },
    {
      key: 'primary',
      label: 'Primary',
      render: (row) => row.is_primary ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          <Crown className="w-3 h-3" /> Primary
        </span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge active={row.is_active} />,
    },
  ];

  if (loading && !rows.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <ManagementTable rows={rows} columns={columns} rowKey="id" accent="emerald"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading bank accounts...' : 'No bank accounts found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview']));

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const res = await apiCall(`/companies/${id}`);
        const json = await res.json();
        if (json.success) {
          setCompany(json.data);
        } else {
          toast.error(json.message || 'Failed to fetch company');
          navigate('/companies');
        }
      } catch {
        toast.error('Error fetching company details');
        navigate('/companies');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id, navigate]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setLoadedTabs((prev) => new Set(prev).add(key));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => navigate('/companies')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </button>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <button onClick={() => navigate('/companies')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Companies
      </button>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-60" />
        </div>

        <div className="px-5 pb-5 -mt-8 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Logo */}
            {company.logo_url ? (
              <img
                src={getImageUrl(company.logo_url)}
                alt={company.name}
                className="w-16 h-16 rounded-xl object-cover shadow-lg border-4 border-white dark:border-gray-800 ring-1 ring-indigo-100 dark:ring-indigo-900 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name || 'C')}&size=128&background=6366f1&color=fff`;
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-800 ring-1 ring-indigo-100 dark:ring-indigo-900 flex-shrink-0">
                {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}

            {/* Name & meta */}
            <div className="flex-1 min-w-0 sm:pt-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{company.name}</h1>
                    <StatusBadge active={company.is_active} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {company.legal_name && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{company.legal_name}</span>
                    )}
                    {company.owner_name && (
                      <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /> {company.owner_name}</span>
                    )}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="flex flex-wrap items-center gap-3">
                  <StatCard icon={Users} color="from-indigo-500 to-blue-600" label="Employees" value={company.total_employees ?? 0} />
                  <StatCard icon={Package} color="from-emerald-500 to-teal-600" label="Subscriptions" value={company.total_subscriptions ?? 0} />
                  <StatCard icon={Landmark} color="from-amber-500 to-orange-600" label="Bank Acc." value={company.total_bank_accounts ?? 0} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1 min-w-max" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="py-4 px-2">
          {activeTab === 'overview' && <OverviewTab company={company} companyId={id} />}
          {activeTab === 'employees' && loadedTabs.has('employees') && <EmployeesTab companyId={id} />}
          {activeTab === 'subscriptions' && loadedTabs.has('subscriptions') && <SubscriptionsTab companyId={id} />}
          {activeTab === 'transactions' && loadedTabs.has('transactions') && <TransactionsTab companyId={id} />}
          {activeTab === 'bank-accounts' && loadedTabs.has('bank-accounts') && <BankAccountsTab companyId={id} />}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
