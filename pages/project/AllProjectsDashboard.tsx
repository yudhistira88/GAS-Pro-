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

const AllProjectsDashboard = () => {
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
    'Selesai': '#22C55E',
    'Berjalan': '#3B82F6',
    'Belum Mulai': '#A8A29E',
  };

  const themeStyles = useMemo(() => ({
    tickColor: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    tooltipBackgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    legendColor: theme === 'dark' ? '#D1D5DB' : '#374151',
  }), [theme]);

  const tooltipContentStyle = { backgroundColor: themeStyles.tooltipBackgroundColor, border: '1px solid #374151', color: themeStyles.tickColor, borderRadius: '0.5rem' };
  const tooltipLabelStyle = { color: themeStyles.tickColor };
  const legendWrapperStyle = { color: themeStyles.legendColor };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Briefcase size={24} />} title="Total Proyek" value={totalProjects.toString()} />
        <StatCard icon={<CheckCircle size={24} />} title="Selesai" value={completedProjects.toString()} />
        <StatCard icon={<Clock size={24} />} title="Sedang Berjalan" value={inProgressProjects.toString()} />
        <StatCard icon={<ListTodo size={24} />} title="Belum Dimulai" value={notStartedProjects.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Proyek Terbaru</h3>
          <div className="space-y-4">
            {projects.slice(0, 5).map(project => (
              <Link to={`/project/detail/${project.id}`} key={project.id} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{project.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tenggat: {new Date(project.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                    <div className="w-1/3 text-right">
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                         </div>
                         <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{project.progress}%</span>
                    </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Distribusi Status Proyek</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value" paddingAngle={5} stroke={themeStyles.tooltipBackgroundColor}>
                  {projectStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />)}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Legend wrapperStyle={legendWrapperStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProjectsDashboard;
