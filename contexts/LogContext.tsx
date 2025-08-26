import React, { createContext, useState, useEffect } from 'react';
import { type LogEntry, type LogLevel, type LogAction } from '../types';

// Some initial logs to populate the view
export const initialLogs: LogEntry[] = [
  { id: 'log-1', timestamp: '2024-07-20T10:05:00Z', level: 'INFO', user: 'Admin Utama', action: 'LOGIN_SUCCESS', details: 'User logged in successfully from IP 192.168.1.1' },
  { id: 'log-2', timestamp: '2024-07-20T10:02:00Z', level: 'INFO', user: 'Andi', action: 'UPDATE_RAB', details: 'Updated RAB "RAB005"' },
  { id: 'log-3', timestamp: '2024-07-20T09:55:00Z', level: 'WARNING', user: 'System', action: 'API_TIMEOUT', details: 'Gemini API call timed out for AHS generation.' },
];

interface AddLogPayload {
    level: LogLevel;
    user: string;
    action: LogAction | string;
    details: string;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (payload: AddLogPayload) => void;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

export const LogContext = createContext<LogContextType>({
  logs: [],
  addLog: () => {},
  setLogs: () => {},
});

export const LogProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
     try {
      const storedLogs = localStorage.getItem('app_logs');
      return storedLogs ? JSON.parse(storedLogs) : initialLogs;
    } catch {
      return initialLogs;
    }
  });

  useEffect(() => {
    localStorage.setItem('app_logs', JSON.stringify(logs));
  }, [logs]);
  
  const addLog = (payload: AddLogPayload) => {
      const newLog: LogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...payload,
      };
      setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  return (
    <LogContext.Provider value={{ logs, addLog, setLogs }}>
      {children}
    </LogContext.Provider>
  );
};
