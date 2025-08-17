import React, { useContext, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { ArrowDown, ArrowUp, Check, RefreshCw, Briefcase } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { type Project } from '../../types';

interface SingleProjectDashboardProps {
  project: Project | null;
}

const StatCard = ({ title, value, bgColor, textColor = 'text-white' }: { title: string, value: string, bgColor: string, textColor?: string }) => (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg shadow-md flex flex-col justify-between`}>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
);

const budgetData = [
    { name: 'Payment Progress', value: 2450000, color: '#a7f3d0' },
    { name: 'Forecast Final Cost', value: 4281000, color: '#3b82f6' },
    { name: 'Variance excl. Risk & Contingency', value: -2319950, color: '#16a34a' },
    { name: 'Variance', value: -2268950, color: '#16a34a' },
    { name: 'Budget', value: 6550000, color: '#f59e0b' },
];

const cashFlowData = [
    { name: 'Dec \'23', bar: 0, line: 0 }, { name: 'Jan \'24', bar: 0, line: 0 }, { name: 'Feb \'24', bar: 0, line: 0 }, { name: 'Mar \'24', bar: 0, line: 0 }, { name: 'Apr \'24', bar: 0, line: 0 }, { name: 'May \'24', bar: 0, line: 0 }, { name: 'Jun \'24', bar: 0, line: 0 }, { name: 'Jul \'24', bar: 0, line: 0 },
    { name: 'Aug \'24', bar: 180000, line: 180000 }, { name: 'Sep \'24', bar: 220000, line: 400000 }, { name: 'Oct \'24', bar: 150000, line: 550000 }, { name: 'Nov \'24', bar: 180000, line: 730000 }, { name: 'Dec \'24', bar: 160000, line: 890000 },
    { name: 'Jan \'25', bar: 500000, line: 1390000 }, { name: 'Feb \'25', bar: 500000, line: 1890000 }, { name: 'Mar \'25', bar: 500000, line: 2390000 }, { name: 'Apr \'25', bar: 500000, line: 2890000 }, { name: 'May \'25', bar: 500000, line: 3390000 }, { name: 'Jun \'25', bar: 500000, line: 3890000 },
    { name: 'Jul \'25', bar: 500000, line: 4390000 }, { name: 'Aug \'25', bar: 455000, line: 4845000 }
];

const HealthCompareItem = ({ label, date, status, arrow }: { label: string, date?: string, status: 'green' | 'amber' | 'red', arrow: 'up' | 'down' | 'stable' }) => {
    const statusColors = { green: 'bg-green-500', amber: 'bg-yellow-500', red: 'bg-red-500' };
    const arrowIcon = {
        up: <ArrowUp className="text-yellow-500" size={20} />,
        down: <ArrowDown className="text-green-500" size={20} />,
        stable: <div className="w-5 h-0.5 bg-gray-400" />,
    };
    return (
        <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{date || 'N/A'}</span>
                {arrowIcon[arrow]}
                <div className={`w-4 h-4 rounded-full ${statusColors[status]}`}></div>
            </div>
        </div>
    );
};

const SingleProjectDashboard = ({ project }: SingleProjectDashboardProps) => {
    const { theme } = useContext(ThemeContext);

    const themeStyles = useMemo(() => ({
        tickColor: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        gridStrokeColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        tooltipBackgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    }), [theme]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US').format(value);
    const formatShortCurrency = (num: number) => {
        if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
        if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
        return num.toString();
    };
  
    if (!project) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <Briefcase size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-200">Proyek tidak valid</h3>
                <p className="mt-1 text-sm text-gray-500">Data proyek tidak dapat dimuat.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Budget" value="5.8m" bgColor="bg-teal-500" />
                <StatCard title="Committed to Date" value="4.0m" bgColor="bg-cyan-500" />
                <StatCard title="Project FFC" value="4.3m" bgColor="bg-amber-400" textColor="text-gray-800" />
                <StatCard title="Paid" value="2.3m" bgColor="bg-green-500" />
                <StatCard title="Completion Date" value="1 Jan 2025" bgColor="bg-pink-500" />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md"><img src="https://placehold.co/800x600/E4002B/white?text=Project+Site" alt="Project" className="rounded-md object-cover h-full w-full" /></div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md"><img src="https://storage.googleapis.com/gweb-cloud-storage-bucket/images/Google-Maps-Platform-All-Products.png" alt="Map" className="rounded-md object-cover h-full w-full" /></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Cash Flow</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} />
                                <XAxis dataKey="name" tick={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                                <YAxis yAxisId="left" tickFormatter={formatShortCurrency} tick={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={formatShortCurrency} tick={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: themeStyles.tooltipBackgroundColor, border: `1px solid ${themeStyles.gridStrokeColor}` }} formatter={(value: number) => formatCurrency(value)}/>
                                <Legend />
                                <Bar yAxisId="left" dataKey="bar" fill="#88ddf8" name="$ Bar" />
                                <Line yAxisId="right" type="monotone" dataKey="line" stroke="#ffc658" strokeWidth={2} name="$ Cum. Line Overlay" dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Budget vs FFC Chart</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={budgetData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeStyles.gridStrokeColor}/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fill: themeStyles.tickColor, fontSize: 12 }} tickLine={false} axisLine={false}/>
                                <Tooltip formatter={(value) => formatCurrency(value as number)}/>
                                <Bar dataKey="value" barSize={20}>{budgetData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.color} />))}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">Health Compare</h3>
                        <div className="space-y-2">
                            <HealthCompareItem label="Scope" date="4 Jul 2024" status="green" arrow="down" />
                            <HealthCompareItem label="Time" status="amber" arrow="up" />
                            <HealthCompareItem label="Cost" status="green" arrow="down" />
                            <HealthCompareItem label="Risk" status="red" arrow="up" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleProjectDashboard;