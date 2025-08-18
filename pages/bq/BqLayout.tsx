import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';

interface BqLayoutProps {
    bqData: RabDocument[];
    setBqData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
    priceDatabase: PriceDatabaseItem[];
    setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
    workItems: WorkItem[];
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
    priceCategories: string[];
    setPriceCategories: React.Dispatch<React.SetStateAction<string[]>>;
    workCategories: string[];
    setWorkCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const BqLayout = (props: BqLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `px-4 py-2 font-semibold text-sm rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-foreground">Monitoring BQ</h1>
            <p className="text-muted-foreground mt-1">Buat, lihat, dan kelola Bill of Quantity proyek.</p>
        </div>
        <div className="flex space-x-2 p-1 bg-muted rounded-lg">
            <ReactRouterDOM.NavLink to="dashboard" className={tabClasses}>Dashboard BQ</ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="daftar" className={tabClasses}>Daftar BQ</ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="database" className={tabClasses}>Database Pekerjaan</ReactRouterDOM.NavLink>
        </div>
        <div>
            <ReactRouterDOM.Outlet context={{ ...props }} />
        </div>
    </div>
  );
};

export default BqLayout;