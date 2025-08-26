import React, { useMemo, useContext } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { type Project } from '../../types';
import StatCard from '../../components/StatCard';
import { Clock, TrendingUp, Users, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ProjectDataContext {
  projects: Project[];
}

const ProjectDashboard = () => {
  const { projects } = useOutletContext<ProjectDataContext>();
  const { theme } = useContext(ThemeContext);

  const {
    inProgressProjects,
    projectStatusData,
    atRiskProjectsCount,
    avgProgress,
    busiestMember,
    onTimeCompletionRate,
    onTimeCount,
    totalCompleted
  } = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'In Progress');
    const completed = projects.filter(p => p.status === 'Completed');
    
    const atRiskCount = inProgress.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30 && p.progress < 75;
    }).length;
    
    const avgProg = inProgress.length > 0 ? inProgress.reduce((sum, p) => sum + p.progress, 0) / inProgress.length : 0;
    
    const teamMemberCounts = inProgress.reduce((acc, p) => {
        p.team.forEach(member => {
            acc[member] = (acc[member] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);
    
    const busiest = Object.entries(teamMemberCounts).sort((a, b) => b[1] - a[1])[0];

    const onTimeProjects = completed.filter(p => p.finishDate && new Date(p.finishDate) <= new Date(p.dueDate)).length;
    const rate = completed.length > 0 ? (onTimeProjects / completed.length) * 100 : 0;
    
    const statusDistribution = [
      { name: 'Selesai', value: completed.length },
      { name: 'Berjalan', value: inProgress.length },
      { name: 'Belum Mulai', value: projects.filter(p => p.status === 'Not Started').length },
    ].filter(d => d.value > 0);

    return {
      inProgressProjects: inProgress.length,
      projectStatusData: statusDistribution,
      atRiskProjectsCount: atRiskCount,
      avgProgress: avgProg,
      busiestMember: busiest ? { name: busiest[0], count: busiest[1] } : { name: '-', count: 0 },
      onTimeCompletionRate: rate,
      onTimeCount: onTimeProjects,
      totalCompleted: completed.length,
    };
  }, [projects]);
  
  const statusColors: { [key: string]: string } = {
    'Selesai': 'hsl(var(--primary))',
    'Berjalan': 'hsl(var(--accent-foreground))',
    'Belum Mulai': 'hsl(var(--muted-foreground))',
  };

  const themeStyles = useMemo(() => ({
    tickColor: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    tooltipBackgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--popover))',
    legendColor: theme === 'dark' ? '#D1D5DB' : '#374151',
    tooltipForegroundColor: theme === 'dark' ? 'hsl(var(--popover-foreground))' : 'hsl(var(--popover-foreground))',
  }), [theme]);

  const tooltipContentStyle = { 
      backgroundColor: themeStyles.tooltipBackgroundColor, 
      border: '1px solid hsl(var(--border))', 
      color: themeStyles.tooltipForegroundColor, 
      borderRadius: 'var(--radius)' 
  };
  const legendWrapperStyle = { color: themeStyles.legendColor, fontSize: '12px' };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            icon={<Clock />} 
            title="Proyek Berjalan" 
            value={inProgressProjects.toString()} 
            subtitle={
                <span className={atRiskProjectsCount > 0 ? "text-orange-500 font-semibold" : ""}>
                    {atRiskProjectsCount > 0 ? `${atRiskProjectsCount} proyek berisiko terlambat` : 'Semua terpantau aman'}
                </span>
            }
        />
        <StatCard 
            icon={<TrendingUp />} 
            title="Rata-rata Progress" 
            value={`${avgProgress.toFixed(0)}%`} 
            subtitle={`dari ${inProgressProjects} proyek berjalan`}
            change={`${avgProgress >= 75 ? 'Baik' : 'Perlu Perhatian'}`}
            changeType={avgProgress >= 75 ? 'increase' : 'decrease'}
        />
        <StatCard 
            icon={<Users />} 
            title="Beban Kerja Tim" 
            value={busiestMember.name} 
            subtitle={`Menangani ${busiestMember.count} proyek`}
        />
        <StatCard 
            icon={<Target />} 
            title="Penyelesaian Tepat Waktu" 
            value={`${onTimeCompletionRate.toFixed(0)}%`} 
            subtitle={`${onTimeCount} dari ${totalCompleted} proyek selesai on-time`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Proyek Terbaru</h3>
          <div className="space-y-3">
            {projects.slice(0, 5).map(project => (
              <Link to={`/project/detail/${project.id}`} key={project.id} className="block p-3 rounded-md hover:bg-muted transition-colors duration-200 border">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">Tenggat: {new Date(project.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                    <div className="w-1/3 text-right">
                         <div className="w-full bg-secondary rounded-full h-2 mb-1">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                         </div>
                         <span className="text-xs font-semibold text-muted-foreground">{project.progress}%</span>
                    </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada proyek.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribusi Status Proyek</h3>
          <div className="relative w-full h-[250px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value" paddingAngle={5} stroke="hsl(var(--card))" labelLine={false} label={renderCustomizedLabel}>
                  {projectStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />)}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} cursor={{fill: 'transparent'}}/>
                <Legend iconSize={10} wrapperStyle={legendWrapperStyle} />
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

export default ProjectDashboard;