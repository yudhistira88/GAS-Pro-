import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';

interface RabLayoutProps {
    rabData: RabDocument[];
    setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
    priceDatabase: PriceDatabaseItem[];
    setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
    workItems: WorkItem[];
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
    priceCategories: string[];
    setPriceCategories: React.Dispatch<React.SetStateAction<string[]>>;
    workCategories: string[];
    setWorkCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const RabLayout = ({ rabData, setRabData, priceDatabase, setPriceDatabase, workItems, setWorkItems, priceCategories, setPriceCategories, workCategories, setWorkCategories }: RabLayoutProps) => {
    const tabClasses = ({ isActive }: { isActive: boolean }): string =>
        `px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${
        isActive
            ? 'border-b-2 border-honda-red text-honda-red'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Monitoring RAB</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Buat, lihat, dan kelola Rencana Anggaran Biaya proyek.</p>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <ReactRouterDOM.NavLink to="dashboard" className={tabClasses}>Dashboard RAB</ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="daftar" className={tabClasses}>Daftar RAB</ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink to="database" className={tabClasses}>Database Harga</ReactRouterDOM.NavLink>
        </div>
        <div>
            <ReactRouterDOM.Outlet context={{ rabData, setRabData, priceDatabase, setPriceDatabase, workItems, setWorkItems, priceCategories, setPriceCategories, workCategories, setWorkCategories }} />
        </div>
    </div>
  );
};

export default RabLayout;