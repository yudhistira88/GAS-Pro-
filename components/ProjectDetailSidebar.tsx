import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type Project } from '../types';
import { ArrowLeft, LayoutDashboard, FileText, TrendingUp, BookOpen, Folder, X, ShieldCheck } from 'lucide-react';

interface ProjectDetailSidebarProps {
    project: Project;
    activeTab: string;
    setActiveTab: (tab: 'dashboard' | 'detail' | 'kurva-s' | 'laporan' | 'dokumen') => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${ isActive ? 'bg-honda-red/10 text-honda-red font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50' }`}>
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

const ProjectDetailSidebar = ({ project, activeTab, setActiveTab, isOpen, setIsOpen }: ProjectDetailSidebarProps) => {
    const navigate = useNavigate();

    const handleNavigation = (tab: 'dashboard' | 'detail' | 'kurva-s' | 'laporan' | 'dokumen') => {
        setActiveTab(tab);
        setIsOpen(false); // Close sidebar on mobile after navigation
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <div>
                         <h1 className="text-lg font-bold text-honda-red tracking-wider">GAS Pro!</h1>
                         <p className="text-xs text-gray-500">Project View</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{project.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {project.id}</p>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => handleNavigation('dashboard')} />
                    <NavItem icon={<FileText size={18} />} label="Detail Proyek" isActive={activeTab === 'detail'} onClick={() => handleNavigation('detail')} />
                    <NavItem icon={<TrendingUp size={18} />} label="Kurva S" isActive={activeTab === 'kurva-s'} onClick={() => handleNavigation('kurva-s')} />
                    <NavItem icon={<BookOpen size={18} />} label="Laporan Proyek" isActive={activeTab === 'laporan'} onClick={() => handleNavigation('laporan')} />
                    <NavItem icon={<Folder size={18} />} label="Dokumen" isActive={activeTab === 'dokumen'} onClick={() => handleNavigation('dokumen')} />
                </nav>

                <div className="p-4 border-t dark:border-gray-700">
                    <button onClick={() => navigate('/project/daftar')} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50">
                        <ArrowLeft size={18} />
                        <span className="ml-3">Kembali ke Daftar</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default ProjectDetailSidebar;