import React from 'react';
import { type Project } from '../types';
import { CheckCircle, Clock, Menu } from 'lucide-react';

const CircularProgress = ({ progress, size = 48, strokeWidth = 4 }: { progress: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const isApproaching = progress < 100 && progress > 75;
    const isCompleted = progress === 100;
    
    let colorClass = 'text-blue-500';
    if (isCompleted) colorClass = 'text-green-500';
    else if (isApproaching) colorClass = 'text-orange-500';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-gray-200 dark:text-gray-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <circle
                    className={`${colorClass} transition-all duration-500 ease-in-out`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <span className={`relative text-sm font-bold text-gray-700 dark:text-gray-200`}>{`${progress}%`}</span>
        </div>
    );
};

const ProjectDetailHeader = ({ project, onMenuClick }: { project: Project, onMenuClick: () => void }) => {
    const isDueSoon = () => {
        const today = new Date();
        const dueDate = new Date(project.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14 && diffDays > 0;
    };

    const getStatusInfo = () => {
        switch (project.status) {
            case 'Completed': return { text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: <CheckCircle size={14} /> };
            case 'In Progress': return { text: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: <Clock size={14} /> };
            default: return { text: 'Not Started', color: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: <Clock size={14} /> };
        }
    };
    
    const statusInfo = getStatusInfo();

    return (
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                     <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <Menu size={22} />
                    </button>
                    <div className="hidden lg:block">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate" title={project.name}>{project.name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                    <div className="text-center px-3">
                        <div className={`px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-2 ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.text}
                        </div>
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                    <div className="text-center px-3">
                       <CircularProgress progress={project.progress} />
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                    <div className="text-center px-3">
                         <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">TENGGAT</p>
                         <div className={`font-bold text-gray-800 dark:text-gray-100 text-sm ${isDueSoon() ? 'text-orange-500' : ''}`}>
                            {new Date(project.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ProjectDetailHeader;
