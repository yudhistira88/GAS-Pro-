import React, { useContext, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Briefcase, FileText, CheckCircle } from 'lucide-react';
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
    
    const completedTasks = useMemo(() => projects.filter(p => p.status === 'Completed').length, [projects]);

    const tickColor = useMemo(() => (theme === 'dark' ? '#94a3b8' : '#475569'), [theme]);
    
    const tooltipContentStyle = useMemo(() => ({
        backgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        color: 'hsl(var(--popover-foreground))'
    }), [theme]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas proyek, BQ, dan RAB Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Briefcase />} 
          title="Total Proyek" 
          value={projects.length.toString()}
        />
        <StatCard 
          icon={<FileText />} 
          title="Total BQ" 
          value={bqData.length.toString()} 
        />
        <StatCard 
          icon={<FileText />} 
          title="Total RAB" 
          value={rabData.length.toString()} 
        />
        <StatCard 
          icon={<CheckCircle />} 
          title="Proyek Selesai" 
          value={completedTasks.toString()}
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
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;