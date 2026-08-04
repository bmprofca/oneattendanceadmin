import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building2, UserCircle, Wallet, CalendarCheck, CalendarX, 
  Calendar, Clock, CreditCard, DollarSign, Settings, Shield, 
  Package, Briefcase, Activity, TrendingUp, TrendingDown, 
  BarChart3, MoreVertical, ArrowUp, ArrowDown, RefreshCw,
  PieChart, LineChart, ChevronRight, Plus, Star
} from 'lucide-react';
import apiCall from '../utils/apiCall';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SelectField from '../components/common/SelectField';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('period'); // period, custom_date, month_year
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customDate, setCustomDate] = useState({ from: '', to: '' });
  const [monthYear, setMonthYear] = useState({ year: new Date().getFullYear().toString(), month: '' });
  const isFetchingRef = useRef(false);

  const compactSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '32px',
      height: '32px',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '4px',
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '4px',
    }),
  };

  const fetchDashboard = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      
      if (filterMode === 'period') {
        const today = new Date();
        const formatDate = (date) => {
          const d = new Date(date);
          const month = '' + (d.getMonth() + 1);
          const day = '' + d.getDate();
          const year = d.getFullYear();
          return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
        };

        if (selectedPeriod === 'today') {
          const todayStr = formatDate(today);
          queryParams.append('from_date', todayStr);
          queryParams.append('to_date', todayStr);
        } else if (selectedPeriod === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          queryParams.append('from_date', formatDate(weekAgo));
          queryParams.append('to_date', formatDate(today));
        } else if (selectedPeriod === 'month') {
          queryParams.append('year', today.getFullYear());
          queryParams.append('month', today.getMonth() + 1);
        } else if (selectedPeriod === 'year') {
          queryParams.append('year', today.getFullYear());
        }
      } else if (filterMode === 'custom_date') {
        if (customDate.from) queryParams.append('from_date', customDate.from);
        if (customDate.to) queryParams.append('to_date', customDate.to);
      } else if (filterMode === 'month_year') {
        if (monthYear.year) queryParams.append('year', monthYear.year);
        if (monthYear.month) queryParams.append('month', monthYear.month);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/dashboard?${queryString}` : '/dashboard';

      const response = await apiCall(endpoint);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filterMode, selectedPeriod, customDate.from, customDate.to, monthYear.year, monthYear.month]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Data Available</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Unable to load dashboard information</p>
        </div>
      </div>
    );
  }

  const kpis = data.kpis;

  // Quick stats for the top bar
  const quickStats = [
    { label: 'Users', value: kpis.total_users, icon: Users, change: '+12%', up: true },
    { label: 'Companies', value: kpis.total_companies, icon: Building2, change: '+5%', up: true },
    { label: 'Revenue', value: '₹0', icon: Wallet, change: '-2%', up: false },
    { label: 'Active Now', value: '0', icon: Activity, change: '+8%', up: true },
  ];

  // Prepare activity data
  const activities = [
    ...(data.recent_users || []).map(u => ({
      type: 'user',
      title: `${u.name} joined`,
      subtitle: u.email || 'No email provided',
      time: new Date(u.created_at),
      icon: UserCircle,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    })),
    ...(data.recent_companies || []).map(c => ({
      type: 'company',
      title: `${c.name} registered`,
      subtitle: 'New company onboarded',
      time: new Date(c.created_at),
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
    })),
    ...(data.recent_subscriptions || []).map(s => ({
      type: 'subscription',
      title: `${s.company_name} subscribed`,
      subtitle: `${s.package_name} - ${s.is_active ? 'Active' : 'Inactive'}`,
      time: new Date(s.created_at),
      icon: Package,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    }))
  ].sort((a, b) => b.time - a.time).slice(0, 8);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, Admin 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Here's what's happening with your platform based on selected filters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48 z-20">
            <SelectField
              options={[
                { value: 'period', label: 'Quick Periods' },
                { value: 'custom_date', label: 'Custom Date Range' },
                { value: 'month_year', label: 'Month & Year' }
              ]}
              value={[
                { value: 'period', label: 'Quick Periods' },
                { value: 'custom_date', label: 'Custom Date Range' },
                { value: 'month_year', label: 'Month & Year' }
              ].find(opt => opt.value === filterMode)}
              onChange={(selected) => setFilterMode(selected.value)}
              isSearchable={false}
              styles={compactSelectStyles}
            />
          </div>

          {filterMode === 'period' && (
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {['Today', 'Week', 'Month', 'Year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period.toLowerCase())}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedPeriod === period.toLowerCase()
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}

          {filterMode === 'custom_date' && (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg z-20 w-36">
                <AdvancedDateFilter
                  value={{ date: customDate.from }}
                  onChange={(val) => setCustomDate(p => ({ ...p, from: val.date }))}
                  placeholder="Start Date"
                  tabOptions={['date']}
                  buttonClassName="w-full px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none bg-transparent border-none"
                />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg z-20 w-36">
                <AdvancedDateFilter
                  value={{ date: customDate.to }}
                  onChange={(val) => setCustomDate(p => ({ ...p, to: val.date }))}
                  placeholder="End Date"
                  tabOptions={['date']}
                  buttonClassName="w-full px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none bg-transparent border-none"
                />
              </div>
            </>
          )}

          {filterMode === 'month_year' && (
            <div className="flex items-center gap-2 z-20">
              <div className="w-36">
                <SelectField
                  options={[
                    { value: '', label: 'All Months' },
                    ...Array.from({ length: 12 }, (_, i) => ({
                      value: String(i + 1),
                      label: new Date(0, i).toLocaleString('default', { month: 'long' })
                    }))
                  ]}
                  value={{
                    value: monthYear.month,
                    label: monthYear.month === '' ? 'All Months' : new Date(0, parseInt(monthYear.month) - 1).toLocaleString('default', { month: 'long' })
                  }}
                  onChange={(selected) => setMonthYear(p => ({ ...p, month: selected.value }))}
                  isSearchable={false}
                  styles={compactSelectStyles}
                />
              </div>
              <div className="w-28">
                <SelectField
                  options={Array.from({ length: 5 }, (_, i) => {
                    const year = String(new Date().getFullYear() - i);
                    return { value: year, label: year };
                  })}
                  value={{ value: monthYear.year, label: monthYear.year }}
                  onChange={(selected) => setMonthYear(p => ({ ...p, year: selected.value }))}
                  isSearchable={false}
                  styles={compactSelectStyles}
                />
              </div>
            </div>
          )}

          <RefreshButton onClick={fetchDashboard} loading={loading} />
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                stat.up 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Overview</h2>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Employees', value: kpis.total_employees, icon: Users, color: 'blue' },
                { label: 'Attendance', value: kpis.total_attendance, icon: CalendarCheck, color: 'emerald' },
                { label: 'On Leave', value: kpis.total_leaves, icon: CalendarX, color: 'orange' },
                { label: 'Holidays', value: kpis.total_holidays, icon: Calendar, color: 'purple' },
              ].map((item, idx) => (
                <div key={idx} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Subscriptions</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{kpis.active_subscriptions}/{kpis.total_subscription_packages + kpis.total_custom_packages}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(kpis.active_subscriptions / (kpis.total_subscription_packages + kpis.total_custom_packages)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payroll Processed</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{kpis.total_payroll_entries}/{kpis.total_employees}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: kpis.total_employees > 0 ? `${(kpis.total_payroll_entries / kpis.total_employees) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Permission Packages Used</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{kpis.total_permission_packages} Total</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((kpis.total_permission_packages / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* HR & Finance Quick View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HR Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">HR Management</h3>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Total Shifts', value: kpis.total_shifts, icon: Clock, color: 'cyan' },
                  { label: 'Leave Requests', value: kpis.total_leaves, icon: CalendarX, color: 'rose' },
                  { label: 'Attendance Today', value: kpis.total_attendance, icon: CalendarCheck, color: 'emerald' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                        <item.icon className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Finance Overview</h3>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Transactions', value: kpis.total_transactions, icon: CreditCard, color: 'emerald' },
                  { label: 'Payroll Entries', value: kpis.total_payroll_entries, icon: DollarSign, color: 'blue' },
                  { label: 'Salary Components', value: kpis.total_salary_components, icon: Settings, color: 'violet' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                        <item.icon className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Users', icon: UserCircle, color: 'blue', link: '/clients' },
                { label: 'Manage Companies', icon: Building2, color: 'indigo', link: '/companies' },
                { label: 'Manage Subscriptions', icon: Package, color: 'emerald', link: '/subscriptions' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-4 h-4 text-${action.color}-600 dark:text-${action.color}-400`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Package Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Packages</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Standard</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{kpis.total_subscription_packages}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Custom</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{kpis.total_custom_packages}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Permissions</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{kpis.total_permission_packages}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center shrink-0`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activity.subtitle}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {getTimeAgo(activity.time)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;