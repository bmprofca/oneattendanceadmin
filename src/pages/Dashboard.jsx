import React from 'react';
import { Users, Briefcase, FileBox, IndianRupee, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, isPositive }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {trend}
      </div>
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const Dashboard = () => {
  const stats = [
    { title: 'Total Clients', value: '1,248', icon: Users, trend: '+12.5%', isPositive: true },
    { title: 'Active Staffs', value: '45', icon: Briefcase, trend: '+4.2%', isPositive: true },
    { title: 'Pending Orders', value: '12', icon: FileBox, trend: '-2.4%', isPositive: false },
    { title: 'Revenue', value: '₹4,52,000', icon: IndianRupee, trend: '+18.2%', isPositive: true },
  ];

  const recentActivities = [
    { id: 1, user: 'Rahul Kumar', action: 'completed order', target: '#ORD-1024', time: '2 hours ago' },
    { id: 2, user: 'Priya Singh', action: 'added new client', target: 'Tech Corp', time: '4 hours ago' },
    { id: 3, user: 'Amit Patel', action: 'updated service pricing', target: 'GST Registration', time: '5 hours ago' },
    { id: 4, user: 'Sneha Gupta', action: 'withdrew funds', target: '₹12,000', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Chart (Dummy)</h2>
          <div className="h-64 flex items-end justify-between gap-2 pb-4">
            {/* Dummy bars for a chart */}
            {[40, 70, 45, 90, 65, 85, 120].map((height, i) => (
              <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 w-full bg-blue-500 dark:bg-blue-600 rounded-t-lg transition-all duration-500 group-hover:bg-blue-400"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20"></div>
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium text-blue-600 dark:text-blue-400">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
