import React, { useMemo, useContext, useState, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { FileText, CircleDollarSign, Target, CheckCircle, Clock, TrendingUp, TrendingDown, Filter, Plus, Download, X as XIcon, Edit, HardHat, Lock } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { type RabDocument, type WorkItem } from '../../types';
import CreateRabModal from '../../components/CreateRabModal';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface RabDataContext {
  rabData: RabDocument[];
  setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
  workItems: WorkItem[];
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

const calculateSla = (receivedDateStr: string | null, finishDateStr: string | null): number | null => {
    if (!receivedDateStr || !finishDateStr) return null;
    const startDate = new Date(receivedDateStr);
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
  Selesai: 'hsl(var(--primary))',
  Diterima: 'hsl(199.4 93.3% 43.1%)',
  Ditolak: 'hsl(0 84.2% 60.2%)',
  Approval: 'hsl(243.8 91.2% 59.8%)',
  'Menunggu Approval': 'hsl(240, 60%, 65%)',
  Pending: 'hsl(28, 80%, 50%)',
  Survey: 'hsl(38.8 92.3% 50.2%)',
};

const SlaDetailsModal = ({ isOpen, onClose, fastest, slowest }: { isOpen: boolean, onClose: () => void, fastest: RabDocument[], slowest: RabDocument[] }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 w-full max-w-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-foreground">Detail SLA RAB</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon size={20} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2 text-green-500 flex items-center gap-2"><TrendingUp size={18} />Selesai Tercepat</h4>
                        <ul className="space-y-2 text-sm">
                            {fastest.map(p => <li key={p.id} className="flex justify-between p-2 rounded-md bg-muted"><span>{p.projectName}</span> <strong>{calculateSla(p.receivedDate, p.finishDate)} hari</strong></li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 text-red-500 flex items-center gap-2"><TrendingDown size={18} />Selesai Terlama</h4>
                        <ul className="space-y-2 text-sm">
                            {slowest.map(p => <li key={p.id} className="flex justify-between p-2 rounded-md bg-muted"><span>{p.projectName}</span> <strong>{calculateSla(p.receivedDate, p.finishDate)} hari</strong></li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RabDashboard = () => {
  const { rabData, setRabData, workItems } = useOutletContext<RabDataContext>();
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({ year: 'all', pic: 'all', status: 'all' });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSlaModalOpen, setSlaModalOpen] = useState(false);

  const { availableYears, availablePics } = useMemo(() => {
      const years = new Set<string>();
      const pics = new Set<string>();
      rabData.forEach(doc => {
          years.add(new Date(doc.surveyDate).getFullYear().toString());
          pics.add(doc.pic);
      });
      return {
          availableYears: ['all', ...Array.from(years).sort((a,b) => Number(b) - Number(a))],
          availablePics: ['all', ...Array.from(pics).sort()],
      };
  }, [rabData]);

  const filteredData = useMemo(() => {
      return rabData.filter(doc => {
          const matchYear = filters.year === 'all' || new Date(doc.surveyDate).getFullYear().toString() === filters.year;
          const matchPic = filters.pic === 'all' || doc.pic === filters.pic;
          const matchStatus = filters.status === 'all' || doc.status === filters.status;
          return matchYear && matchPic && matchStatus;
      });
  }, [rabData, filters]);

  const dashboardStats = useMemo(() => {
    // These stats are based on the filtered data
    const totalRabValue = filteredData.reduce((sum, doc) => sum + calculateTotalBudget(doc), 0);
    const statusCounts = filteredData.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const rejectedCount = filteredData.filter(doc => doc.status === 'Ditolak').length;
    const lockedCount = filteredData.filter(doc => doc.isLocked).length;
    
    const rabWithTender = filteredData.filter(doc => (doc.tenderValue || 0) > 0);
    const totalTenderValue = rabWithTender.reduce((sum, doc) => sum + (doc.tenderValue || 0), 0);
    
    const rabForEfficiency = filteredData.filter(doc => (doc.tenderValue || 0) > 0 && calculateTotalBudget(doc) > 0);
    const efficiencyPercentages = rabForEfficiency.map(doc => {
        const rabValue = calculateTotalBudget(doc);
        const tenderValue = doc.tenderValue!;
        return ((rabValue - tenderValue) / rabValue) * 100; // Positive is savings
    });
    const averageEfficiency = efficiencyPercentages.length > 0 ? efficiencyPercentages.reduce((a, b) => a + b, 0) / efficiencyPercentages.length : 0;

    // These SLA stats are based on ALL data, regardless of filters, to provide a global KPI.
    const allCompletedRabs = rabData.filter(r => r.status === 'Selesai');
    const slas = allCompletedRabs.map(r => calculateSla(r.receivedDate, r.finishDate)).filter(s => s !== null) as number[];
    const averageSla = slas.length > 0 ? (slas.reduce((a, b) => a + b, 0) / slas.length) : 0;
    
    const okSlaCount = slas.filter(s => s <= 3).length;
    const okRate = slas.length > 0 ? (okSlaCount / slas.length) * 100 : 100;

    const slaSorted = [...allCompletedRabs].sort((a,b) => (calculateSla(a.receivedDate, a.finishDate) ?? 999) - (calculateSla(b.receivedDate, b.finishDate) ?? 999));
    const fastestSla = slaSorted.slice(0, 5);
    const slowestSla = slaSorted.slice(-5).reverse();

    return { totalRabValue, totalTenderValue, averageEfficiency, statusCounts, rejectedCount, averageSla, fastestSla, slowestSla, okRate, lockedCount };
  }, [filteredData, rabData]);
  
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
    tickColor: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    gridStrokeColor: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
    tooltipBackgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--popover))',
    tooltipForegroundColor: theme === 'dark' ? 'hsl(var(--popover-foreground))' : 'hsl(var(--popover-foreground))',
    legendColor: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    tooltipCursorFill: theme === 'dark' ? 'hsla(var(--accent))' : 'hsla(var(--accent))'
  }), [theme]);
  
  const commonChartProps = {
      tooltipContentStyle: { backgroundColor: themeStyles.tooltipBackgroundColor, border: `1px solid ${themeStyles.gridStrokeColor}`, borderRadius: 'var(--radius)', color: themeStyles.tooltipForegroundColor },
      axisTick: { fill: themeStyles.tickColor, fontSize: 12 },
      tooltipCursor: { fill: themeStyles.tooltipCursorFill },
      legendWrapperStyle: { color: themeStyles.legendColor, fontSize: '12px', paddingTop: '10px' },
  };

  const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.07) return null; // Increased threshold for cleaner look
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Centered in the donut ring
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
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
  
  const picCountData = useMemo(() => {
    const picCountMap = new Map<string, number>();
    filteredData.forEach(doc => {
        picCountMap.set(doc.pic, (picCountMap.get(doc.pic) || 0) + 1);
    });
    return Array.from(picCountMap.entries())
        .map(([name, value]) => ({ name, 'Jumlah RAB': value }))
        .sort((a, b) => b['Jumlah RAB'] - a['Jumlah RAB']);
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
    if (!dashboardRef.current) {
        toast.error("Tidak dapat menemukan elemen dashboard untuk diekspor.");
        return;
    };

    const toastId = toast.loading('Membuat PDF...');

    html2canvas(dashboardRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: theme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // A4 Portrait
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        
        const ratio = imgWidth / imgHeight;
        const pageRatio = pdfWidth / pdfHeight;

        let finalImgWidth, finalImgHeight;
        
        // Fit the image to the page, maintaining aspect ratio
        if (ratio > pageRatio) {
            // Image is wider than the page
            finalImgWidth = pdfWidth - 20; // 10mm margin on each side
            finalImgHeight = finalImgWidth / ratio;
        } else {
            // Image is taller than the page
            finalImgHeight = pdfHeight - 20; // 10mm margin on each side
            finalImgWidth = finalImgHeight * ratio;
        }

        const x = (pdfWidth - finalImgWidth) / 2;
        const y = (pdfHeight - finalImgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
        
        const today = new Date().toISOString().split('T')[0];
        pdf.save(`dashboard-rab-${today}.pdf`);
        toast.success('Dashboard berhasil diekspor ke PDF!', { id: toastId });
    }).catch(err => {
        toast.error('Gagal mengekspor dashboard.', { id: toastId });
        console.error("Error exporting to PDF:", err);
    });
  };

  const selectClasses = "text-sm p-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-ring focus:border-ring transition";

  return (
    <>
    <CreateRabModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleSaveNewRab} initialData={null} />
    <SlaDetailsModal isOpen={isSlaModalOpen} onClose={() => setSlaModalOpen(false)} fastest={dashboardStats.fastestSla} slowest={dashboardStats.slowestSla} />
    <div className="bg-card p-6 rounded-lg border shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Ringkasan RAB</h2>
                    <p className="text-muted-foreground mt-1">Analisis performa RAB berdasarkan filter yang dipilih.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-muted rounded-lg transition"><Download size={16} /> Export PDF</button>
                    <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition shadow"><Plus size={16} /> Buat RAB</button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 flex-wrap text-muted-foreground">
                <Filter size={16}/>
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
    </div>
    <div ref={dashboardRef} className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                icon={<CircleDollarSign />} 
                title="Total Nilai RAB (Difilter)" 
                value={formatShortCurrency(dashboardStats.totalRabValue)}
                subtitle={
                    <div className="text-xs">
                        vs <strong className="font-semibold">{formatShortCurrency(dashboardStats.totalTenderValue)}</strong> Nilai Tender
                    </div>
                }
            />
            <StatCard 
                icon={dashboardStats.averageEfficiency >= 0 ? <TrendingUp /> : <TrendingDown />} 
                title="Efisiensi Anggaran" 
                value={`${dashboardStats.averageEfficiency.toFixed(1)}%`}
                changeType={dashboardStats.averageEfficiency >= 0 ? 'increase' : 'decrease'}
                change={dashboardStats.averageEfficiency >= 0 ? 'Hemat Anggaran' : 'Lewat Anggaran'}
                subtitle="Rata-rata (RAB - Tender) / RAB"
            />
            <StatCard 
                icon={<Clock />} 
                title="Penyelesaian Sesuai SLA" 
                value={`${dashboardStats.okRate.toFixed(0)}%`}
                subtitle={
                    <>
                        <div className={`text-xs font-semibold ${dashboardStats.okRate >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                            {dashboardStats.okRate >= 80 ? 'Performa Baik' : 'Perlu Perhatian'} (Target ≤ 3 hari)
                        </div>
                         <div className="text-xs text-muted-foreground mt-1">
                            Rata-rata: {dashboardStats.averageSla.toFixed(1)} hari
                        </div>
                        <button onClick={() => setSlaModalOpen(true)} className="text-xs text-primary hover:underline font-medium mt-1">
                            Lihat Detail Pengerjaan
                        </button>
                    </>
                }
            />
            <StatCard 
                icon={<FileText />} 
                title="Status Dokumen (Difilter)" 
                value={filteredData.length.toString()}
                subtitle={
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
                        <span className="flex items-center gap-1.5" title="Selesai"><CheckCircle size={12} className="text-green-500"/> {dashboardStats.statusCounts.Selesai || 0}</span>
                        <span className="flex items-center gap-1.5" title="Approval & Pending"><Clock size={12} className="text-indigo-500"/> {(dashboardStats.statusCounts['Approval'] || 0) + (dashboardStats.statusCounts['Menunggu Approval'] || 0) + (dashboardStats.statusCounts['Pending'] || 0)}</span>
                        <span className="flex items-center gap-1.5" title="Ditolak"><XIcon size={12} className="text-red-500"/> {dashboardStats.rejectedCount || 0}</span>
                        <span className="flex items-center gap-1.5" title="Terkunci"><Lock size={12} className="text-gray-500"/> {dashboardStats.lockedCount || 0}</span>
                    </div>
                }
            />
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribusi Status</h3>
          <div className="relative w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value" paddingAngle={5} stroke="hsl(var(--card))" onClick={(data) => navigate(`/rab/daftar?status=${data.name}`)} className="cursor-pointer" labelLine={false} label={renderCustomizedLabel}>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={{fill: 'transparent'}}/>
                <Legend iconSize={10} wrapperStyle={commonChartProps.legendWrapperStyle}/>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">
                    {filteredData.length}
                </span>
                <span className="text-sm text-muted-foreground">Total RAB</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-lg font-semibold text-card-foreground mb-4">Nilai RAB per PIC</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={picData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} horizontal={false} />
                  <XAxis type="number" tickFormatter={formatShortCurrency} {...commonChartProps.axisTick} />
                  <YAxis type="category" dataKey="name" tick={{...commonChartProps.axisTick, width: 80}} width={90} />
                  <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={commonChartProps.tooltipCursor} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="Total Nilai RAB" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Total Nilai RAB" position="right" formatter={(value: number) => formatShortCurrency(value)} style={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                  </Bar>
                </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-1 bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-lg font-semibold text-card-foreground mb-4">Jumlah RAB per PIC</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={picCountData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...commonChartProps.axisTick} />
                  <YAxis type="category" dataKey="name" tick={{...commonChartProps.axisTick, width: 80}} width={90} />
                  <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={commonChartProps.tooltipCursor} />
                  <Bar dataKey="Jumlah RAB" fill="hsl(var(--accent-foreground))" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Jumlah RAB" position="right" style={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                  </Bar>
                </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-lg font-semibold text-card-foreground mb-4">Perbandingan RAB vs Tender</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} {...commonChartProps.axisTick} />
                <YAxis tickFormatter={formatShortCurrency} {...commonChartProps.axisTick} />
                <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={commonChartProps.tooltipCursor} formatter={(value: number) => formatCurrency(value)}/>
                <Legend wrapperStyle={commonChartProps.legendWrapperStyle} />
                <Bar dataKey="Nilai RAB" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} onClick={(data) => navigate(`/rab/detail/${data.id}`)} className="cursor-pointer">
                    <LabelList dataKey="Nilai RAB" position="top" formatter={(value: number) => formatShortCurrency(value)} style={{ fontSize: 10, fill: themeStyles.tickColor }} />
                </Bar>
                <Bar dataKey="Nilai Tender" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} onClick={(data) => navigate(`/rab/detail/${data.id}`)} className="cursor-pointer">
                    <LabelList dataKey="Nilai Tender" position="top" formatter={(value: number) => formatShortCurrency(value)} style={{ fontSize: 10, fill: themeStyles.tickColor }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
    </>
  );
};

export default RabDashboard;