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
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 relative ${ isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50' }`}>
        {isActive && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"></div>}
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

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border h-16">
                <div>
                     <h1 className="text-lg font-bold text-primary tracking-wider">GAS Pro!</h1>
                     <p className="text-xs text-muted-foreground">Project View</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
                    <X size={20}/>
                </button>
            </div>
            
            <div className="p-4 border-b border-border">
                <p className="text-sm font-bold text-foreground truncate">{project.name}</p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold text-foreground">{project.progress}%</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
                <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => handleNavigation('dashboard')} />
                <NavItem icon={<FileText size={18} />} label="Detail Proyek" isActive={activeTab === 'detail'} onClick={() => handleNavigation('detail')} />
                <NavItem icon={<TrendingUp size={18} />} label="Kurva S" isActive={activeTab === 'kurva-s'} onClick={() => handleNavigation('kurva-s')} />
                <NavItem icon={<BookOpen size={18} />} label="Laporan Proyek" isActive={activeTab === 'laporan'} onClick={() => handleNavigation('laporan')} />
                <NavItem icon={<Folder size={18} />} label="Dokumen" isActive={activeTab === 'dokumen'} onClick={() => handleNavigation('dokumen')} />
            </nav>

            <div className="p-4 border-t border-border">
                <button onClick={() => navigate('/project/daftar')} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-muted/50">
                    <ArrowLeft size={18} />
                    <span className="ml-3">Kembali ke Daftar Proyek</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-card text-card-foreground border-r border-border flex flex-col z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <SidebarContent />
            </aside>
        </>
    );
};

export default ProjectDetailSidebar;
