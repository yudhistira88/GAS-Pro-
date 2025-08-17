import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type Project } from '../../types';

interface ProjectLayoutProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectLayout = ({ projects, setProjects }: ProjectLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${
        isActive
            ? 'border-b-2 border-honda-red text-honda-red'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Monitoring Proyek</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Lacak kemajuan, tenggat waktu, dan status semua proyek Anda.</p>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <ReactRouterDOM.NavLink to="dashboard" className={tabClasses}>Dashboard Proyek</ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="daftar" className={tabClasses}>Daftar Proyek</ReactRouterDOM.NavLink>
        </div>
        <div>
            <ReactRouterDOM.Outlet context={{ projects, setProjects }} />
        </div>
    </div>
  );
};

export default ProjectLayout;