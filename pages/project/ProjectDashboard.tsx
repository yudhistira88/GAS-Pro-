import React, { useMemo, useContext } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { type Project } from '../../types';
import StatCard from '../../components/StatCard';
import { Briefcase, CheckCircle, Clock, ListTodo } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ProjectDataContext {
  projects: Project[];
}

const ProjectDashboard = () => {
  const { projects } = useOutletContext<ProjectDataContext>();
  const { theme } = useContext(ThemeContext);

  const {
    totalProjects,
    completedProjects,
    inProgressProjects,
    notStartedProjects,
    projectStatusData,
  } = useMemo(() => {
    const completed = projects.filter(p => p.status === 'Completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const notStarted = projects.filter(p => p.status === 'Not Started').length;
    return {
      totalProjects: projects.length,
      completedProjects: completed,
      inProgressProjects: inProgress,
      notStartedProjects: notStarted,
      projectStatusData: [
        { name: 'Selesai', value: completed },
        { name: 'Berjalan', value: inProgress },
        { name: 'Belum Mulai', value: notStarted },
      ].filter(d => d.value > 0),
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Briefcase size={24} />} title="Total Proyek" value={totalProjects.toString()} />
        <StatCard icon={<CheckCircle size={24} />} title="Selesai" value={completedProjects.toString()} />
        <StatCard icon={<Clock size={24} />} title="Sedang Berjalan" value={inProgressProjects.toString()} />
        <StatCard icon={<ListTodo size={24} />} title="Belum Dimulai" value={notStartedProjects.toString()} />
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
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value" paddingAngle={5} stroke="hsl(var(--card))">
                  {projectStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />)}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} cursor={{fill: 'transparent'}}/>
                <Legend iconSize={10} wrapperStyle={legendWrapperStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
