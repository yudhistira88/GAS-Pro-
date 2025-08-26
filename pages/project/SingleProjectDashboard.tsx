import React, { useMemo } from 'react';
import { type Project, type ProjectPhase } from '../../types';
import { CheckCircle, Clock, Users, TrendingUp, Briefcase } from 'lucide-react';

interface SingleProjectDashboardProps {
  project: Project | null;
}

const DashboardStatCard = ({ icon, title, value, subValue, iconBgColor }: { icon: React.ReactNode, title: string, value: string, subValue: string, iconBgColor: string }) => (
    <div className="bg-card p-5 rounded-xl shadow-md flex items-center gap-4 border transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${iconBgColor}`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-card-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{subValue}</p>
            </div>
        </div>
    </div>
);

const PhaseTimelineCard = ({ phase, isLast }: { phase: ProjectPhase, isLast: boolean }) => {
    const today = new Date();
    const planStart = phase.plan.start ? new Date(phase.plan.start) : null;
    const planEnd = phase.plan.end ? new Date(phase.plan.end) : null;
    const actualStart = phase.actual.start ? new Date(phase.actual.start) : null;
    const actualEnd = phase.actual.end ? new Date(phase.actual.end) : null;

    let status: 'completed' | 'inProgress' | 'notStarted' | 'delayed' = 'notStarted';
    let progress = 0;

    if (actualEnd) {
        status = 'completed';
        progress = 100;
    } else if (actualStart) {
        status = 'inProgress';
        if (planEnd && today > planEnd) {
            status = 'delayed';
        }
        // Simple progress calculation based on time elapsed
        if (planStart && planEnd) {
            const totalDuration = planEnd.getTime() - planStart.getTime();
            if (totalDuration > 0) {
                const elapsed = today.getTime() - actualStart.getTime();
                progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            }
        }
    }

    const statusInfo = {
        completed: { text: 'Selesai', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
        inProgress: { text: 'Berjalan', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
        notStarted: { text: 'Belum Mulai', color: 'text-muted-foreground', bgColor: 'bg-muted' },
        delayed: { text: 'Terlambat', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
    };

    const formatDate = (date: Date | null) => date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center" style={{ color: phase.color }}>
                   {status === 'completed' && <CheckCircle size={10} className="text-current"/>}
                   {status === 'inProgress' && <div className="w-2 h-2 rounded-full bg-current"></div>}
                </div>
                {!isLast && <div className="w-0.5 flex-grow bg-border my-1" style={{minHeight: '5rem'}}></div>}
            </div>
            <div className="flex-1 pb-8 group transition-all">
                <div className="p-4 rounded-lg bg-secondary/50 dark:bg-secondary/50 border border-transparent group-hover:border-border group-hover:bg-card">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-card-foreground">{phase.name}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                                <span>Plan: {formatDate(planStart)} - {formatDate(planEnd)}</span>
                                <span className="mx-2">|</span>
                                <span>Aktual: {formatDate(actualStart)} - {formatDate(actualEnd)}</span>
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusInfo[status].bgColor} ${statusInfo[status].color}`}>
                            {statusInfo[status].text}
                        </div>
                    </div>
                    {(status === 'inProgress' || status === 'completed' || status === 'delayed') && (
                         <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                                <span className="text-xs font-semibold" style={{color: phase.color}}>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: phase.color }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SingleProjectDashboard = ({ project }: SingleProjectDashboardProps) => {
    
    const { daysRemaining, isOverdue } = useMemo(() => {
        if (!project) return { daysRemaining: 0, isOverdue: false };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(project.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { daysRemaining: diffDays, isOverdue: diffDays < 0 };
    }, [project]);
    
    if (!project) {
        return (
            <div className="text-center py-20 bg-card rounded-xl shadow-md">
                <Briefcase size={48} className="mx-auto text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-card-foreground">Proyek tidak valid</h3>
                <p className="mt-1 text-sm text-muted-foreground">Data proyek tidak dapat dimuat.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <DashboardStatCard
                    icon={<CheckCircle size={24} className="text-white"/>}
                    title="Status Proyek"
                    value={project.status}
                    subValue="Status saat ini"
                    iconBgColor="bg-blue-500"
                />
                <DashboardStatCard
                    icon={<TrendingUp size={24} className="text-white"/>}
                    title="Progress Fisik"
                    value={`${project.progress}%`}
                    subValue="Pekerjaan selesai"
                    iconBgColor="bg-green-500"
                />
                <DashboardStatCard
                    icon={<Clock size={24} className="text-white"/>}
                    title="Sisa Waktu"
                    value={isOverdue ? `${Math.abs(daysRemaining)} Hari` : `${daysRemaining} Hari`}
                    subValue={isOverdue ? 'Terlambat' : 'Menuju tenggat'}
                    iconBgColor={isOverdue ? 'bg-red-500' : 'bg-yellow-500'}
                />
                 <DashboardStatCard
                    icon={<Users size={24} className="text-white"/>}
                    title="Ukuran Tim"
                    value={project.team.length.toString()}
                    subValue="Anggota aktif"
                    iconBgColor="bg-indigo-500"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-card p-6 rounded-xl shadow-md border">
                        <h3 className="font-bold text-lg text-card-foreground mb-4">Linimasa Fase Proyek</h3>
                        <div className="space-y-0">
                            {project.phases && project.phases.length > 0 ? (
                                project.phases.map((phase, index) => (
                                    <PhaseTimelineCard key={phase.id} phase={phase} isLast={index === project.phases!.length - 1} />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">Data fase tidak tersedia untuk proyek ini.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-card p-6 rounded-xl shadow-md border">
                        <h3 className="font-bold text-lg text-card-foreground mb-4">Tim Proyek</h3>
                        <ul className="space-y-3">
                            {project.team.map((member, index) => (
                                <li key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm ring-2 ring-background">
                                        {member.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-sm text-card-foreground">{member}</span>
                                        <p className="text-xs text-muted-foreground">Anggota Proyek</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleProjectDashboard;
