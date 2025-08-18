import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type Project } from '../../types';

interface ProjectLayoutProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectLayout = ({ projects, setProjects }: ProjectLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `px-4 py-2 font-semibold text-sm rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-foreground">Monitoring Proyek</h1>
            <p className="text-muted-foreground mt-1">Lacak kemajuan, tenggat waktu, dan status semua proyek Anda.</p>
        </div>
        <div className="flex space-x-2 p-1 bg-muted rounded-lg">
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