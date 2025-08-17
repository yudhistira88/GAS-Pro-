import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, ChevronDown } from 'lucide-react';

const Sidebar = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-white text-honda-red shadow-inner'
        : 'text-white hover:bg-red-700'
    }`;

  const subNavLinkClasses = ({ isActive }: { isActive: boolean }): string =>
  `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
    isActive
      ? 'bg-red-400/50 text-white'
      : 'text-red-200 hover:bg-red-700'
  }`;


  return (
    <div className="w-64 bg-honda-red text-white flex flex-col p-4 shadow-2xl">
      <div className="flex items-center justify-center py-4 mb-6">
         <h1 className="text-2xl font-bold tracking-wider">PROYEK-KU</h1>
      </div>
      <nav className="flex-1 flex flex-col space-y-2">
        <ReactRouterDOM.NavLink to="/dashboard" className={navLinkClasses}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </ReactRouterDOM.NavLink>
        
        <div>
            <ReactRouterDOM.NavLink to="/rab/dashboard" className={navLinkClasses}>
                <FileText className="mr-3 h-5 w-5" />
                RAB
            </ReactRouterDOM.NavLink>
            <div className="pl-6 mt-1 space-y-1">
                 <ReactRouterDOM.NavLink to="/rab/dashboard" className={subNavLinkClasses}>
                    Dashboard
                </ReactRouterDOM.NavLink>
                <ReactRouterDOM.NavLink to="/rab/daftar" className={subNavLinkClasses}>
                    Daftar RAB
                </ReactRouterDOM.NavLink>
            </div>
        </div>
        
         <div>
            <ReactRouterDOM.NavLink to="/project/dashboard" className={navLinkClasses}>
                <Briefcase className="mr-3 h-5 w-5" />
                Project
            </ReactRouterDOM.NavLink>
            <div className="pl-6 mt-1 space-y-1">
                 <ReactRouterDOM.NavLink to="/project/dashboard" className={subNavLinkClasses}>
                    Dashboard
                </ReactRouterDOM.NavLink>
                <ReactRouterDOM.NavLink to="/project/daftar" className={subNavLinkClasses}>
                    Daftar Project
                </ReactRouterDOM.NavLink>
            </div>
        </div>

      </nav>
      <div className="mt-auto text-center text-xs text-red-200">
        <p>&copy; {new Date().getFullYear()} Proyek-Ku Inc.</p>
      </div>
    </div>
  );
};

export default Sidebar;