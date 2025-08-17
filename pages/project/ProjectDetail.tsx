import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Project, type ProjectPhase } from '../../types';
import { ArrowLeft, Users, FileText, LayoutDashboard, TrendingUp, BookOpen, Folder, Menu, X } from 'lucide-react';
import SingleProjectDashboard from './SingleProjectDashboard';
import ProjectDetailSidebar from '../../components/ProjectDetailSidebar';
import ProjectDetailHeader from '../../components/ProjectDetailHeader';
import KurvaS from './KurvaS';
import ProjectReport from './ProjectReport';

interface ProjectDetailProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const DetailView = ({ project }: { project: Project }) => (
    <div className="animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Users size={20}/> Anggota Tim</h3>
                <ul className="space-y-3">
                    {project.team.map((member, index) => (
                        <li key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-200 text-sm">
                                {member.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-700 dark:text-gray-200">{member}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Informasi Proyek</h3>
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Halaman ini akan berisi deskripsi lengkap proyek, tujuan, ruang lingkup, dan informasi detail lainnya. 
                        Data spesifik seperti file desain, notulen rapat, atau milestone penting akan ditampilkan di sini.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const ProjectDetail = ({ projects, setProjects }: ProjectDetailProps) => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const project = projects.find(p => p.id === projectId);
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'detail' | 'kurva-s' | 'laporan' | 'dokumen'>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Proyek Tidak Ditemukan</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Proyek yang Anda cari tidak ada atau telah dihapus.</p>
                <button onClick={() => navigate('/project/daftar')} className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                    <ArrowLeft size={16} />
                    Kembali ke Daftar Proyek
                </button>
            </div>
        );
    }
    
    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <SingleProjectDashboard project={project} />;
            case 'detail':
                return <DetailView project={project} />;
            case 'kurva-s':
                return <KurvaS />;
            case 'laporan':
                 return <ProjectReport project={project} setProjects={setProjects} />;
            case 'dokumen':
                return <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up"><h2 className="text-xl font-bold">Dokumen Proyek</h2><p className="mt-4 text-gray-500">Area ini untuk manajemen file dan dokumen proyek.</p></div>;
            default:
                return null;
        }
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
            <ProjectDetailSidebar 
                project={project} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <div className="lg:ml-64 flex flex-col h-screen">
                <ProjectDetailHeader project={project} onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default ProjectDetail;