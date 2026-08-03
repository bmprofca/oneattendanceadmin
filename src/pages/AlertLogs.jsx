import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { toast } from 'react-hot-toast';
import ManagementTable from '../components/common/ManagementTable';
import Pagination from '../components/common/PaginationComponent';
import RefreshButton from '../components/common/RefreshButton';
import { useNavigate } from 'react-router-dom';

const AlertLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const fetchLogs = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiCall(`/subscriptions/alert-logs?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data || []);
        if (data.meta) {
          setTotalItems(data.meta.total || 0);
        }
      } else {
        toast.error(data.message || 'Failed to fetch alert logs');
      }
    } catch (error) {
      toast.error('Error fetching alert logs');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">{row.company_name}</span>
      )
    },
    {
      key: 'alert_type',
      label: 'Alert Type',
      render: (row) => (
        <span className="capitalize text-gray-800 dark:text-gray-200">
          {row.alert_type?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'mobile',
      label: 'Sent To',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">{row.mobile}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-transparent ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
          {row.error_message && (
            <span className="text-xs text-red-500 max-w-[150px] truncate" title={row.error_message}>
              {row.error_message}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'sent_at',
      label: 'Sent At',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {new Date(row.sent_at).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <button onClick={() => navigate('/subscriptions')} className="hover:text-blue-600 transition-colors">Subscriptions</button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Alert Logs</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Alert Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View the history of subscription alerts sent via WhatsApp.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={fetchLogs} loading={loading} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <ManagementTable
          rows={logs}
          columns={columns}
          rowKey="id"
          accent="slate"
          showActionsColumn={false}
          emptyState={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading logs...' : 'No alert logs found.'}
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

export default AlertLogs;
