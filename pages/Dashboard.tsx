import React, { useContext, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Briefcase, FileText, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import { ThemeContext } from '../contexts/ThemeContext';
import { type Project, type RabDocument } from '../types';
import * as ReactRouterDOM from 'react-router-dom';

const statusColors: { [key: string]: string } = {
  'Completed': 'hsl(var(--primary))',
  'In Progress': 'hsl(var(--accent-foreground))',
  'Not Started': 'hsl(var(--muted-foreground))',
};

const TeamAvatars = ({ team, max = 3 }: { team: string[], max?: number }) => (
    <div className="flex -space-x-2">
        {team.slice(0, max).map(member => (
            <div key={member} title={member} className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center font-bold text-muted-foreground text-xs shadow-sm">
                {member.substring(0, 2).toUpperCase()}
            </div>
        ))}
        {team.length > max && (
            <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center font-bold text-secondary-foreground text-xs shadow-sm">
                +{team.length - max}
            </div>
        )}
    </div>
);

interface DashboardProps {
  projects: Project[];
  rabData: RabDocument[];
  bqData: RabDocument[];
}

// Helper functions for stat cards
const calculateTotalBudget = (doc: RabDocument) => doc.detailItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
const formatShortCurrency = (num: number) => {
    if (num >= 1e9) return 'Rp ' + (num / 1e9).toFixed(1).replace('.', ',') + ' M';
    if (num >= 1e6) return 'Rp ' + (num / 1e6).toFixed(1).replace('.', ',') + ' Jt';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
};


const Dashboard = ({ projects, rabData, bqData }: DashboardProps) => {
    const { theme } = useContext(ThemeContext);

    const projectStatusData = useMemo(() => {
        const counts = projects.reduce((acc, project) => {
            const status = project.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        return Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        }));
    }, [projects]);
    
    const dashboardStats = useMemo(() => {
        // Project Stats
        const activeProjects = projects.filter(p => p.status === 'In Progress');
        const nearingDeadlineCount = activeProjects.filter(p => {
            const dueDate = new Date(p.dueDate);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= 14;
        }).length;
        const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
        const completionRate = projects.length > 0 ? (completedProjectsCount / projects.length) * 100 : 0;

        // Document Stats
        const approvedRabData = rabData.filter(d => ['Approved', 'Completed'].includes(d.status));
        const totalRabValue = approvedRabData.reduce((sum, doc) => sum + calculateTotalBudget(doc), 0);
        const totalTenderValue = approvedRabData.reduce((sum, doc) => sum + (doc.tenderValue || 0), 0);

        const pendingBqCount = bqData.filter(d => ['Pending', 'Menunggu Approval'].includes(d.status)).length;
        const pendingRabCount = rabData.filter(d => ['Pending', 'Menunggu Approval'].includes(d.status)).length;
        const pendingDocsCount = pendingBqCount + pendingRabCount;

        return {
            activeProjectsCount: activeProjects.length,
            nearingDeadlineCount,
            completedProjectsCount,
            completionRate,
            totalRabValue,
            totalTenderValue,
            pendingBqCount,
            pendingRabCount,
            pendingDocsCount,
        };
    }, [projects, rabData, bqData]);

    const tickColor = useMemo(() => (theme === 'dark' ? '#94a3b8' : '#475569'), [theme]);
    
    const tooltipContentStyle = useMemo(() => ({
        backgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        color: 'hsl(var(--popover-foreground))'
    }), [theme]);

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.07) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas proyek, BQ, dan RAB Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Briefcase />} 
          title="Proyek Aktif" 
          value={dashboardStats.activeProjectsCount.toString()}
          subtitle={
            <span className={dashboardStats.nearingDeadlineCount > 0 ? "text-orange-500 font-semibold" : "text-green-500 font-semibold"}>
                {dashboardStats.nearingDeadlineCount > 0 
                    ? `${dashboardStats.nearingDeadlineCount} proyek mendekati tenggat`
                    : "Semua proyek sesuai jadwal"
                }
            </span>
          }
        />
        <StatCard 
          icon={<FileText />} 
          title="Nilai Total RAB Disetujui" 
          value={formatShortCurrency(dashboardStats.totalRabValue)}
          subtitle={
            <span>
                vs. {formatShortCurrency(dashboardStats.totalTenderValue)} Nilai Tender
            </span>
          }
        />
        <StatCard 
          icon={<Clock />} 
          title="Menunggu Persetujuan" 
          value={dashboardStats.pendingDocsCount.toString()} 
          subtitle={
            <span className="text-blue-500 font-semibold">
                {`${dashboardStats.pendingBqCount} BQ & ${dashboardStats.pendingRabCount} RAB`}
            </span>
          }
        />
        <StatCard 
          icon={<CheckCircle />} 
          title="Tingkat Penyelesaian" 
          value={`${dashboardStats.completionRate.toFixed(0)}%`}
          subtitle={
             <span>
                {`${dashboardStats.completedProjectsCount} dari ${projects.length} proyek selesai`}
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Proyek Berjalan</h2>
          <div className="space-y-3">
            {projects.filter(p => p.status === 'In Progress').slice(0, 4).map(project => (
              <ReactRouterDOM.Link to={`/project/detail/${project.id}`} key={project.id} className="block p-4 rounded-md hover:bg-muted transition-colors duration-200 border">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground truncate pr-4">{project.name}</p>
                      <p className="text-sm text-muted-foreground">Tenggat: {new Date(project.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                    </div>
                    <TeamAvatars team={project.team} />
                </div>
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Progress</span>
                        <span className="text-xs font-semibold text-primary">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
              </ReactRouterDOM.Link>
            ))}
             {projects.filter(p => p.status === 'In Progress').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada proyek yang sedang berjalan.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Status Proyek</h2>
          <div className="relative w-full h-[250px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--card))"
                  paddingAngle={5}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipContentStyle} 
                  cursor={{fill: 'transparent'}}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: '12px', color: tickColor}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">
                    {projects.length}
                </span>
                <span className="text-sm text-muted-foreground">Total Proyek</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;