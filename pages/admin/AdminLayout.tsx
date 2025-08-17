import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Database, Users, BarChart } from 'lucide-react';
import { type Project, type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';

// The props are kept for now to avoid breaking changes if they are needed for other purposes,
// but the component primarily uses context for data.
interface AdminLayoutProps {
  projects: Project[];
  rabData: RabDocument[];
  priceDatabase: PriceDatabaseItem[];
  workItems: WorkItem[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
  setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  initialData: {
    initialProjects: Project[];
    initialRabData: RabDocument[];
    initialPriceDatabase: PriceDatabaseItem[];
    initialWorkItems: WorkItem[];
  };
}

const AdminLayout = (props: AdminLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${
        isActive
            ? 'border-b-2 border-honda-red text-honda-red'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Panel Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data aplikasi, pengguna, dan pengaturan sistem.</p>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <ReactRouterDOM.NavLink to="data" className={tabClasses}>
                <Database size={16}/> Manajemen Data
            </ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="users" className={tabClasses}>
                <Users size={16}/> Manajemen Pengguna
            </ReactRouterDOM.NavLink>
             <ReactRouterDOM.NavLink to="logs" className={tabClasses}>
                <BarChart size={16}/> Log Sistem
            </ReactRouterDOM.NavLink>
        </div>
        <div>
            {/* The Outlet now gets context from the providers wrapping the app */}
            <ReactRouterDOM.Outlet context={{ ...props }} />
        </div>
    </div>
  );
};

export default AdminLayout;