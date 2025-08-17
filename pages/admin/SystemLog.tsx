import React, { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  user: string;
  action: string;
  details: string;
}

const initialLogs: LogEntry[] = [
  { id: 'log-1', timestamp: '2024-07-20T10:05:00Z', level: 'INFO', user: 'Admin Utama', action: 'LOGIN_SUCCESS', details: 'User logged in successfully from IP 192.168.1.1' },
  { id: 'log-2', timestamp: '2024-07-20T10:02:00Z', level: 'INFO', user: 'Andi', action: 'UPDATE_RAB', details: 'Updated RAB "RAB005"' },
  { id: 'log-3', timestamp: '2024-07-20T09:55:00Z', level: 'WARNING', user: 'System', action: 'API_TIMEOUT', details: 'Gemini API call timed out for AHS generation.' },
  { id: 'log-4', timestamp: '2024-07-20T09:40:00Z', level: 'ERROR', user: 'Citra', action: 'DELETE_PROJECT_FAILED', details: 'Permission denied for deleting project "PROJ001"' },
  { id: 'log-5', timestamp: '2024-07-19T15:00:00Z', level: 'INFO', user: 'Budi', action: 'CREATE_PROJECT', details: 'Created new project "Project X"' },
];

const LogLevelBadge = ({ level }: { level: LogEntry['level'] }) => {
    const levelClasses: Record<LogEntry['level'], string> = {
        INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${levelClasses[level]}`}>{level}</span>;
}

const SystemLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [filters, setFilters] = useState({ level: 'all', dateFrom: '', dateTo: '' });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchLevel = filters.level === 'all' || log.level === filters.level;
      const logDate = new Date(log.timestamp);
      const matchDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
      const matchDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo + 'T23:59:59');
      return matchLevel && matchDateFrom && matchDateTo;
    });
  }, [logs, filters]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
  }

  const selectClasses = "text-sm p-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const dateInputClasses = "text-sm p-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Log Aktivitas Sistem</h2>
        <div className='flex items-center gap-3 flex-wrap'>
            <Filter size={20} className="text-honda-red"/>
            <select name="level" value={filters.level} onChange={handleFilterChange} className={selectClasses}>
                <option value="all">Semua Level</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
            </select>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className={dateInputClasses} />
            <span className="text-gray-500">to</span>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className={dateInputClasses} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Timestamp</th>
              <th scope="col" className="px-6 py-3">Level</th>
              <th scope="col" className="px-6 py-3">User</th>
              <th scope="col" className="px-6 py-3">Aksi</th>
              <th scope="col" className="px-6 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                <td className="px-6 py-4"><LogLevelBadge level={log.level} /></td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{log.user}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.action}</td>
                <td className="px-6 py-4">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLog;
