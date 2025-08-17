import React, { useContext, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Briefcase, FileText, CheckCircle, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import { ThemeContext } from '../contexts/ThemeContext';
import { type Project, type RabDocument } from '../types';

const statusColors: { [key: string]: string } = {
  'Completed': '#22C55E',
  'In Progress': '#3B82F6',
  'Not Started': '#A8A29E',
};

interface DashboardProps {
  projects: Project[];
  rabData: RabDocument[];
}

const Dashboard = ({ projects, rabData }: DashboardProps) => {
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

    const tickColor = useMemo(() => (theme === 'dark' ? '#E5E7EB' : '#1F2937'), [theme]);
    const tooltipBackgroundColor = useMemo(() => (theme === 'dark' ? '#1F2937' : '#FFFFFF'), [theme]);

    const tooltipContentStyle = useMemo(() => ({
        backgroundColor: tooltipBackgroundColor,
        border: '1px solid #374151',
        color: tickColor
    }), [tooltipBackgroundColor, tickColor]);

    const tooltipLabelStyle = useMemo(() => ({ color: tickColor }), [tickColor]);
    const legendWrapperStyle = useMemo(() => ({ color: tickColor }), [tickColor]);

    const renderPieLabel = useCallback((props: { name: string; percent?: number }) => {
        const { name, percent } = props;
        if (typeof percent === 'number' && percent > 0.05) { // Only show label if slice is > 5%
            return `${(percent * 100).toFixed(0)}%`;
        }
        return null;
    }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard Utama</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Selamat datang kembali, Admin! Ini ringkasan proyek Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Briefcase size={24} />} 
          title="Total Proyek" 
          value={projects.length.toString()} 
        />
        <StatCard 
          icon={<FileText size={24} />} 
          title="Total RAB" 
          value={rabData.length.toString()} 
        />
        <StatCard 
          icon={<CheckCircle size={24} />} 
          title="Proyek Selesai" 
          value={completedTasks.toString()}
        />
        <StatCard 
          icon={<Activity size={24} />} 
          title="Aktivitas Tim" 
          value="Aktif" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Proyek Terbaru</h2>
          <div className="space-y-4">
            {projects.slice(0, 4).map(project => (
              <div key={project.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">{project.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due: {new Date(project.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                </div>
                <div className="w-1/3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Status Proyek</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={renderPieLabel}
                  stroke={tooltipBackgroundColor}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipContentStyle} 
                  labelStyle={tooltipLabelStyle}
                />
                <Legend wrapperStyle={legendWrapperStyle}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;