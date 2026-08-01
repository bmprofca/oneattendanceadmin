import React, { useState, useEffect, useRef } from 'react';
import { Users, Briefcase, FileBox, IndianRupee, TrendingUp, TrendingDown, Activity, Wallet, Building2, UserCircle } from 'lucide-react';
import apiCall from '../utils/apiCall';
import RefreshButton from '../components/common/RefreshButton';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend, isPositive }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend}
        </div>
      )}
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState({
    kpis: {
      total_users: 0,
      total_companies: 0,
      total_employees: 0,
      active_subscriptions: 0
    },
    recent_companies: [],
    recent_subscriptions: []
  });
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchDashboard = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall('/dashboard');
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
  }, []);

  const stats = [
    { title: 'Total Users', value: data.kpis.total_users, icon: UserCircle },
    { title: 'Total Companies', value: data.kpis.total_companies, icon: Building2 },
    { title: 'Total Employees', value: data.kpis.total_employees, icon: Users },
    { title: 'Active Subscriptions', value: data.kpis.active_subscriptions, icon: Wallet },
  ];

  // Combine and sort recent activities
  const recentActivities = [
    ...(data.recent_companies || []).map(c => ({
      id: `c_${c.id}`,
      action: 'registered a new company',
      target: c.name,
      time: c.created_at,
      type: 'company'
    })),
    ...(data.recent_subscriptions || []).map(s => ({
      id: `s_${s.id}`,
      action: 'started a new subscription',
      target: s.package_name || 'Plan',
      time: s.created_at,
      type: 'subscription'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5); // Take top 5

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onClick={fetchDashboard} loading={loading} />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2 hidden sm:flex">
            <Activity className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
        <div className="space-y-6">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`w-2 h-2 mt-2 rounded-full ring-4 shrink-0 ${activity.type === 'company' ? 'bg-indigo-500 ring-indigo-50 dark:ring-indigo-900/20' : 'bg-emerald-500 ring-emerald-50 dark:ring-emerald-900/20'}`}></div>
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    System <span className="text-gray-500">{activity.action}</span> <span className="font-medium text-blue-600 dark:text-blue-400">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(activity.time).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
