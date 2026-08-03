import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, Shield, Building2,
  CreditCard, Package, Landmark, Users, MessageCircle, Briefcase,
  Hash, MapPin, FileText, IndianRupee, CheckCircle2, XCircle,
  Crown, Globe, ChevronRight
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
    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
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
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
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
  { key: 'overview', label: 'Overview', icon: Users },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'subscriptions', label: 'Subscriptions', icon: Package },
  { key: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
];

/* ──────────────────── Tab content components ──────────────────── */

const OverviewTab = ({ user }) => {
  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Contact Information
        </h3>
        <div className="space-y-4">
          <InfoRow icon={Mail} color="from-blue-500 to-blue-600" label="Email Address" value={user.email} />
          <InfoRow icon={Phone} color="from-green-500 to-emerald-600" label="Phone Number" value={user.phone} />
          <InfoRow icon={MessageCircle} color="from-emerald-500 to-teal-600" label="WhatsApp" value={user.whatsapp} />
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Account Information
        </h3>
        <div className="space-y-4">
          <InfoRow icon={Briefcase} color="from-violet-500 to-purple-600" label="Profession" value={user.profession} />
          <InfoRow icon={Shield} color="from-amber-500 to-orange-600" label="System Admin" value={user.is_system_admin ? 'Yes' : 'No'} />
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Account Status</div>
              <StatusBadge active={user.is_active} />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Created At</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{fmt.dateTime(user.created_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Updated</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{fmt.dateTime(user.updated_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Login</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{fmt.dateTime(user.last_login)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────── Paginated tab wrapper ──────────── */

const usePaginatedTab = (userId, endpoint) => {
  const [data, setData] = useState([]);
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
      const res = await apiCall(`/users/${userId}/${endpoint}?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
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
  }, [userId, endpoint, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, page, setPage, limit, setLimit, total };
};

/* ──────────── Companies tab ──────────── */

const CompaniesTab = ({ userId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(userId, 'companies');

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo_url ? (
            <img src={getImageUrl(row.logo_url)} alt={row.name} className="w-9 h-9 rounded-lg object-cover shadow-sm"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'C')}&background=6366f1&color=fff`; }} />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {(row.name || 'C').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1.5">
              {row.name}
              {row.is_owner ? <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Owner" /> : null}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.legal_name || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{[row.city, row.state].filter(Boolean).join(', ') || '—'}</span>
        </div>
      ),
    },
    {
      key: 'gst',
      label: 'GST No',
      render: (row) => <span className="text-gray-600 dark:text-gray-400 text-sm font-mono">{row.gst_no || '—'}</span>,
    },
    {
      key: 'employees',
      label: 'Employees',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-sm font-medium">
          <Users className="w-3.5 h-3.5" /> {row.employee_count ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge active={row.is_active} />,
    },
    {
      key: 'created',
      label: 'Created',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{fmt.date(row.created_at)}</span>,
    },
  ];

  if (loading && !data.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <ManagementTable rows={data} columns={columns} rowKey="id" accent="indigo"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading companies...' : 'No companies found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Payments tab ──────────── */

const PaymentsTab = ({ userId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(userId, 'payments');

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
      key: 'company',
      label: 'Company',
      render: (row) => <span className="text-gray-700 dark:text-gray-300 font-medium">{row.company_name || '—'}</span>,
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

  if (loading && !data.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <ManagementTable rows={data} columns={columns} rowKey="id" accent="blue"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading payments...' : 'No payments found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Subscriptions tab ──────────── */

const SubscriptionsTab = ({ userId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(userId, 'subscriptions');

  const paymentStatusMap = {
    '0': { label: 'Pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    '1': { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    '2': { label: 'Failed', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  };

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => <span className="text-gray-900 dark:text-white font-medium">{row.company_name || '—'}</span>,
    },
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

  if (loading && !data.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <ManagementTable rows={data} columns={columns} rowKey="id" accent="violet"
          emptyState={<div className="p-8 text-center text-gray-500 dark:text-gray-400">{loading ? 'Loading subscriptions...' : 'No subscriptions found.'}</div>}
        />
        <Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </div>
    </div>
  );
};

/* ──────────── Bank Accounts tab ──────────── */

const BankAccountsTab = ({ userId }) => {
  const { data, loading, page, setPage, limit, setLimit, total } = usePaginatedTab(userId, 'bank-accounts');

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => <span className="text-gray-900 dark:text-white font-medium">{row.company_name || '—'}</span>,
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

  if (loading && !data.length) return <TableSkeleton />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <ManagementTable rows={data} columns={columns} rowKey="id" accent="emerald"
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

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview']));

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await apiCall(`/users/${id}`);
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
        } else {
          toast.error(json.message || 'Failed to fetch user');
          navigate('/clients');
        }
      } catch {
        toast.error('Error fetching user details');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setLoadedTabs((prev) => new Set(prev).add(key));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Users
      </button>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-60" />
        </div>

        <div className="px-5 pb-5 -mt-8 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            {user.profile_picture ? (
              <img
                src={getImageUrl(user.profile_picture)}
                alt={user.name}
                className="w-16 h-16 rounded-xl object-cover shadow-lg border-4 border-white dark:border-gray-800 ring-1 ring-indigo-100 dark:ring-indigo-900 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&size=128&background=6366f1&color=fff`;
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-800 ring-1 ring-indigo-100 dark:ring-indigo-900 flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {/* Name & meta */}
            <div className="flex-1 min-w-0 sm:pt-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{user.name}</h1>
                    <StatusBadge active={user.is_active} />
                    {user.is_system_admin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {user.profession && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{user.profession}</span>
                    )}
                    {user.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                    )}
                    {user.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>
                    )}
                  </div>
                </div>

                {/* Stat cards next to header on very large screens, below otherwise */}
                <div className="flex flex-wrap items-center gap-3">
                  <StatCard icon={Building2} color="from-indigo-500 to-blue-600" label="Companies" value={user.owned_companies_count ?? 0} />
                  <StatCard icon={Users} color="from-emerald-500 to-teal-600" label="Memberships" value={user.employee_memberships_count ?? 0} />
                  <StatCard icon={Clock} color="from-amber-500 to-orange-600" label="Last Login" value={user.last_login ? fmt.date(user.last_login) : 'Never'} />
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
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'companies' && loadedTabs.has('companies') && <CompaniesTab userId={id} />}
          {activeTab === 'payments' && loadedTabs.has('payments') && <PaymentsTab userId={id} />}
          {activeTab === 'subscriptions' && loadedTabs.has('subscriptions') && <SubscriptionsTab userId={id} />}
          {activeTab === 'bank-accounts' && loadedTabs.has('bank-accounts') && <BankAccountsTab userId={id} />}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
