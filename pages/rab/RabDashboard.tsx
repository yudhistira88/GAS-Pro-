import React, { useMemo, useContext, useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { FileText, DollarSign, Target, CheckCircle, PieChart as PieChartIcon, Clock, TrendingUp, TrendingDown, Filter, Plus, Download, X as XIcon, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { type RabDocument } from '../../types';
import CreateRabModal from '../../components/CreateRabModal';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RabDataContext {
  rabData: RabDocument[];
  setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
}

// Helper functions
const calculateTotalBudget = (doc: RabDocument) => doc.detailItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatShortCurrency = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace('.', ',') + ' M';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace('.', ',') + ' Jt';
    return new Intl.NumberFormat('id-ID').format(num);
};
const holidays = [
  "2023-01-01", "2023-01-22", "2023-01-23", "2023-02-18", "2023-03-22", "2023-03-23", "2023-04-07", "2023-04-22", "2023-04-23", "2023-04-19", "2023-04-20", "2023-04-21", "2023-04-24", "2023-04-25", "2023-05-01", "2023-05-18", "2023-06-01", "2023-06-2", "2023-06-04", "2023-06-29", "2023-07-19", "2023-08-17", "2023-09-28", "2023-12-25", "2023-12-26",
  "2024-01-01", "2024-02-08", "2024-02-09", "2024-02-10", "2024-03-11", "2024-03-12", "2024-03-29", "2024-03-31", "2024-04-10", "2024-04-11", "2024-04-08", "2024-04-09", "2024-04-12", "2024-04-15", "2024-05-01", "2024-05-09", "2024-05-10", "2024-05-23", "2024-05-24", "2024-06-01", "2024-06-17", "2024-06-18", "2024-07-07", "2024-08-17", "2024-09-16", "2024-12-25", "2024-12-26"
].map(d => new Date(d).toISOString().split('T')[0]);

const calculateSla = (approvedDateStr: string | null, finishDateStr: string | null): number | null => {
    if (!approvedDateStr || !finishDateStr) return null;
    const startDate = new Date(approvedDateStr);
    const endDate = new Date(finishDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return null;

    let workdays = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateString = currentDate.toISOString().split('T')[0];
        const isHoliday = holidays.includes(dateString);
        if (!isWeekend && !isHoliday) workdays++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const slaValue = workdays - 1;
    return slaValue >= 0 ? slaValue : 0;
};

const statusColors: { [key: string]: string } = {
  Completed: '#22C55E', // green-500
  Approved: '#3B82F6',  // blue-500
  'Menunggu Approval': '#6366F1', // indigo-500
  Pending: '#F59E0B',   // amber-500
  Rejected: '#EF4444',  // red-500
  Terkunci: '#64748B', // slate-500
};

const SlaDetailsModal = ({ isOpen, onClose, fastest, slowest }: { isOpen: boolean, onClose: () => void, fastest: RabDocument[], slowest: RabDocument[] }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Detail SLA Proyek</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon size={20} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400 flex items-center gap-2"><TrendingUp size={18} />Selesai Tercepat</h4>
                        <ul className="space-y-2 text-sm">
                            {fastest.map(p => <li key={p.id} className="flex justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700/50"><span>{p.projectName}</span> <strong>{calculateSla(p.approvedDate, p.finishDate)} hari</strong></li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2"><TrendingDown size={18} />Selesai Terlama</h4>
                        <ul className="space-y-2 text-sm">
                            {slowest.map(p => <li key={p.id} className="flex justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700/50"><span>{p.projectName}</span> <strong>{calculateSla(p.approvedDate, p.finishDate)} hari</strong></li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RabDashboard = () => {
  const { rabData, setRabData } = useOutletContext<RabDataContext>();
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ year: 'all', pic: 'all', status: 'all' });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSlaModalOpen, setSlaModalOpen] = useState(false);

  const { availableYears, availablePics } = useMemo(() => {
      const years = new Set<string>();
      const pics = new Set<string>();
      rabData.forEach(doc => {
          years.add(new Date(doc.receivedRejectedDate).getFullYear().toString());
          pics.add(doc.pic);
      });
      return {
          availableYears: ['all', ...Array.from(years).sort((a,b) => Number(b) - Number(a))],
          availablePics: ['all', ...Array.from(pics).sort()],
      };
  }, [rabData]);

  const filteredData = useMemo(() => {
      return rabData.filter(doc => {
          const matchYear = filters.year === 'all' || new Date(doc.receivedRejectedDate).getFullYear().toString() === filters.year;
          const matchPic = filters.pic === 'all' || doc.pic === filters.pic;
          const matchStatus = filters.status === 'all' || doc.status === filters.status;
          return matchYear && matchPic && matchStatus;
      });
  }, [rabData, filters]);

  const dashboardStats = useMemo(() => {
    const totalRabValue = filteredData.reduce((sum, doc) => sum + calculateTotalBudget(doc), 0);
    const statusCounts = filteredData.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const completedRabs = filteredData.filter(r => r.status === 'Completed');
    const slas = completedRabs.map(r => calculateSla(r.approvedDate, r.finishDate)).filter(s => s !== null) as number[];
    const averageSla = slas.length > 0 ? (slas.reduce((a, b) => a + b, 0) / slas.length) : 0;
    
    const slaSorted = completedRabs.sort((a,b) => (calculateSla(a.approvedDate, a.finishDate) ?? 999) - (calculateSla(b.approvedDate, b.finishDate) ?? 999));
    const fastestSla = slaSorted.slice(0, 5);
    const slowestSla = slaSorted.slice(-5).reverse();

    return { totalRabValue, statusCounts, averageSla, fastestSla, slowestSla };
  }, [filteredData]);
  
  const handleFilterChange = (type: 'year' | 'pic' | 'status', value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveNewRab = (dataToSave: Omit<RabDocument, 'sla' | 'detailItems' | 'pdfReady'> & { id?: string }) => {
    const newRab: RabDocument = { ...dataToSave, id: Date.now().toString(), sla: 0, detailItems: [], pdfReady: false, };
    setRabData(prev => [newRab, ...prev]);
    toast.success('RAB baru dibuat!');
    navigate(`/rab/detail/${newRab.id}`);
    setCreateModalOpen(false);
  };
  
  const themeStyles = useMemo(() => ({
    tickColor: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    gridStrokeColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    tooltipBackgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    legendColor: theme === 'dark' ? '#D1D5DB' : '#374151',
    tooltipCursorFill: theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.5)'
  }), [theme]);
  
  const commonChartProps = {
      tooltipContentStyle: { backgroundColor: themeStyles.tooltipBackgroundColor, border: `1px solid ${themeStyles.gridStrokeColor}`, borderRadius: '0.5rem' },
      tooltipLabelStyle: { color: themeStyles.tickColor },
      legendWrapperStyle: { color: themeStyles.legendColor, fontSize: '12px', paddingTop: '10px' },
      axisTick: { fill: themeStyles.tickColor, fontSize: 12 },
      tooltipCursor: { fill: themeStyles.tooltipCursorFill },
  };

  const pieChartData = useMemo(() => Object.entries(dashboardStats.statusCounts).map(([name, value]) => ({ name, value })), [dashboardStats.statusCounts]);
  const picData = useMemo(() => {
    const picMap = new Map<string, number>();
    filteredData.forEach(doc => {
        picMap.set(doc.pic, (picMap.get(doc.pic) || 0) + calculateTotalBudget(doc));
    });
    return Array.from(picMap.entries())
        .map(([name, value]) => ({ name, 'Total Nilai RAB': value }))
        .sort((a,b) => b['Total Nilai RAB'] - a['Total Nilai RAB']);
  }, [filteredData]);
  const comparisonData = useMemo(() => filteredData
    .filter(doc => calculateTotalBudget(doc) > 0 && (doc.tenderValue || 0) > 0)
    .map(doc => ({
        id: doc.id,
        name: doc.projectName.length > 20 ? doc.projectName.substring(0, 20) + '...' : doc.projectName,
        'Nilai RAB': calculateTotalBudget(doc),
        'Nilai Tender': doc.tenderValue || 0,
    })).slice(0, 10), [filteredData]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text("Ringkasan Dashboard RAB", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Metrik', 'Nilai']],
      body: [
        ['Total Proyek (difilter)', filteredData.length],
        ['Total Nilai RAB', formatCurrency(dashboardStats.totalRabValue)],
        ['Rata-rata SLA', `${dashboardStats.averageSla.toFixed(1)} hari`],
        ...Object.entries(dashboardStats.statusCounts).map(([k,v]) => [`Jumlah ${k}`, v])
      ],
      theme: 'grid'
    });
    
    doc.save('ringkasan-rab.pdf');
    toast.success("Ringkasan dashboard diekspor ke PDF!");
  };

  const selectClasses = "text-sm p-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";

  return (
    <>
    <CreateRabModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleSaveNewRab} initialData={null} />
    <SlaDetailsModal isOpen={isSlaModalOpen} onClose={() => setSlaModalOpen(false)} fastest={dashboardStats.fastestSla} slowest={dashboardStats.slowestSla} />
    <div className="space-y-6 animate-fade-in-up">
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:border dark:border-gray-700">
            <div className='flex items-center gap-3 flex-wrap'>
                <Filter size={20} className="text-honda-red"/>
                <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} className={selectClasses}>
                   {availableYears.map(y => <option key={y} value={y}>{y === 'all' ? 'Semua Tahun' : y}</option>)}
                </select>
                <select value={filters.pic} onChange={(e) => handleFilterChange('pic', e.target.value)} className={selectClasses}>
                    {availablePics.map(p => <option key={p} value={p}>{p === 'all' ? 'Semua PIC' : p}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectClasses}>
                    <option value="all">Semua Status</option>
                    {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
             <div className="flex items-center gap-2">
                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition"><Download size={16} /> Export</button>
                <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow"><Plus size={16} /> Buat RAB</button>
             </div>
        </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform">
            <div>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"><DollarSign size={24} className="text-green-600 dark:text-green-400"/></div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Nilai RAB</p>
                </div>
                <p className="text-5xl font-bold text-gray-800 dark:text-gray-100 mt-4">{formatShortCurrency(dashboardStats.totalRabValue)}</p>
                <p className="text-gray-500 dark:text-gray-400">{formatCurrency(dashboardStats.totalRabValue)}</p>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">Berdasarkan filter yang dipilih</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform" onClick={() => setSlaModalOpen(true)}>
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Rata-rata SLA Penyelesaian</h3>
             <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart innerRadius="70%" outerRadius="90%" data={[{ value: dashboardStats.averageSla }]} startAngle={180} endAngle={0} barSize={20}>
                    <PolarAngleAxis type="number" domain={[0, 60]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey='value' angleAxisId={0} fill="#ef4444" cornerRadius={10} />
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 dark:fill-gray-100 text-4xl font-bold">
                        {dashboardStats.averageSla.toFixed(1)}
                    </text>
                     <text x="50%" y="75%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400 text-sm">
                        hari kerja
                    </text>
                </RadialBarChart>
             </ResponsiveContainer>
             <p className={`text-sm font-semibold ${dashboardStats.averageSla < 15 ? 'text-green-500' : dashboardStats.averageSla < 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                {dashboardStats.averageSla < 15 ? 'Cepat' : dashboardStats.averageSla < 30 ? 'Sedang' : 'Lambat'}
             </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Distribusi Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value" paddingAngle={5} stroke={themeStyles.tooltipBackgroundColor}
                onClick={(data) => navigate(`/rab/daftar?status=${data.name}`)}
                className="cursor-pointer"
              >
                {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />)}
              </Pie>
              <Tooltip {...commonChartProps} cursor={{fill: 'transparent'}}/>
              <Legend iconSize={10} wrapperStyle={commonChartProps.legendWrapperStyle}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Nilai RAB per PIC</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={picData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} horizontal={false} />
                  <XAxis type="number" tickFormatter={formatShortCurrency} tick={commonChartProps.axisTick} />
                  <YAxis type="category" dataKey="name" tick={commonChartProps.axisTick} width={60} />
                  <Tooltip {...commonChartProps} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="Total Nilai RAB" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {picData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors.Approved} opacity={1 - (index * 0.1)} />)}
                  </Bar>
                </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Perbandingan RAB vs Tender</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} />
                <XAxis dataKey="name" tick={commonChartProps.axisTick} angle={-30} textAnchor="end" interval={0} />
                <YAxis tickFormatter={formatShortCurrency} tick={commonChartProps.axisTick} />
                <Tooltip {...commonChartProps} formatter={(value: number, name: string, props) => {
                    const { payload } = props;
                    const rab = payload['Nilai RAB'];
                    const tender = payload['Nilai Tender'];
                    const diff = ((tender - rab) / rab) * 100;
                    return [`${formatCurrency(value)}`, name, `Selisih: ${diff.toFixed(2)}%`];
                }}/>
                <Legend wrapperStyle={commonChartProps.legendWrapperStyle} />
                <Bar dataKey="Nilai RAB" fill="#4ade80" radius={[4, 4, 0, 0]} onClick={(data) => navigate(`/rab/detail/${data.id}`)} className="cursor-pointer" />
                <Bar dataKey="Nilai Tender" fill="#60a5fa" radius={[4, 4, 0, 0]} onClick={(data) => navigate(`/rab/detail/${data.id}`)} className="cursor-pointer"/>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
    </>
  );
};

export default RabDashboard;