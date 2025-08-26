import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Database, Users, BarChart } from 'lucide-react';
import { type Project, type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';

// The props are kept for now to avoid breaking changes if they are needed for other purposes,
// but the component primarily uses context for data.
interface AdminLayoutProps {
  projects: Project[];
  rabData: RabDocument[];
  bqData: RabDocument[];
  priceDatabase: PriceDatabaseItem[];
  workItems: WorkItem[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
  setBqData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
  setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  initialData: {
    initialProjects: Project[];
    initialRabData: RabDocument[];
    initialBqData: RabDocument[];
    initialPriceDatabase: PriceDatabaseItem[];
    initialWorkItems: WorkItem[];
  };
}

const AdminLayout = (props: AdminLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-foreground">Panel Admin</h1>
            <p className="text-muted-foreground mt-1">Kelola data aplikasi, pengguna, dan pengaturan sistem.</p>
        </div>
        <div className="flex space-x-2 p-1 bg-muted rounded-lg">
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