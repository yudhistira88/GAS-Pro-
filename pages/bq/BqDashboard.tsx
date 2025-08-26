import React, { useMemo, useContext, useState, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { FileText, DollarSign, Target, CheckCircle, Clock, TrendingUp, TrendingDown, Filter, Plus, Download, X as XIcon, Edit, HardHat, Check } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { type RabDocument, type WorkItem } from '../../types';
import CreateBqModal from '../../components/CreateBqModal';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface BqDataContext {
  bqData: RabDocument[];
  setBqData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
  workItems: WorkItem[];
}

// Helper functions
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
                    <h3 className="text-xl font-bold text-foreground">Detail SLA BQ</h3>
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

const BqDashboard = () => {
  const { bqData, setBqData, workItems } = useOutletContext<BqDataContext>();
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ year: 'all', pic: 'all', status: 'all' });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSlaModalOpen, setSlaModalOpen] = useState(false);
  
  const pieChartRef = useRef<HTMLDivElement>(null);
  const picChartRef = useRef<HTMLDivElement>(null);
  const monthlyChartRef = useRef<HTMLDivElement>(null);

  const { availableYears, availablePics } = useMemo(() => {
      const years = new Set<string>();
      const pics = new Set<string>();
      bqData.forEach(doc => {
          years.add(new Date(doc.surveyDate).getFullYear().toString());
          pics.add(doc.pic);
      });
      return {
          availableYears: ['all', ...Array.from(years).sort((a,b) => Number(b) - Number(a))],
          availablePics: ['all', ...Array.from(pics).sort()],
      };
  }, [bqData]);

  const filteredData = useMemo(() => {
      return bqData.filter(doc => {
          const matchYear = filters.year === 'all' || new Date(doc.surveyDate).getFullYear().toString() === filters.year;
          const matchPic = filters.pic === 'all' || doc.pic === filters.pic;
          const matchStatus = filters.status === 'all' || doc.status === filters.status;
          return matchYear && matchPic && matchStatus;
      });
  }, [bqData, filters]);

  const { dashboardStats, completedBqsCount } = useMemo(() => {
    const statusCounts = filteredData.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const completedBqs = filteredData.filter(r => r.status === 'Selesai');
    const slas = completedBqs.map(r => calculateSla(r.receivedDate, r.finishDate)).filter(s => s !== null) as number[];
    const averageSla = slas.length > 0 ? (slas.reduce((a, b) => a + b, 0) / slas.length) : 0;
    
    // For modal, use all completed BQs regardless of filter
    const allCompletedBqs = bqData.filter(r => r.status === 'Selesai');
    const slaSorted = [...allCompletedBqs].sort((a,b) => (calculateSla(a.receivedDate, a.finishDate) ?? 999) - (calculateSla(b.receivedDate, b.finishDate) ?? 999));
    const fastestSla = slaSorted.slice(0, 5);
    const slowestSla = slaSorted.slice(-5).reverse();

    return { 
        dashboardStats: { statusCounts, averageSla, fastestSla, slowestSla },
        completedBqsCount: completedBqs.length
    };
  }, [filteredData, bqData]);
  
  const workItemSources = useMemo(() => {
    const initialCounts: Record<WorkItem['source'], number> = { AHS: 0, Manual: 0, AI: 0, Import: 0 };
    if (!workItems) return initialCounts;
    
    return workItems.reduce((acc, item) => {
        const source = item.source || 'Manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, initialCounts);
  }, [workItems]);

  const handleFilterChange = (type: 'year' | 'pic' | 'status', value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveNewBq = (dataToSave: Omit<RabDocument, 'sla' | 'detailItems' | 'pdfReady'> & { id?: string }) => {
    const newBq: RabDocument = { ...dataToSave, id: Date.now().toString(), sla: 0, detailItems: [], pdfReady: false, };
    setBqData(prev => [newBq, ...prev]);
    toast.success('BQ baru dibuat!');
    navigate(`/bq/detail/${newBq.id}`);
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

  const pieChartData = useMemo(() => Object.entries(dashboardStats.statusCounts).map(([name, value]) => ({ name, value })), [dashboardStats.statusCounts]);
  
  const picData = useMemo(() => {
    const picMap = new Map<string, number>();
    filteredData.forEach(doc => {
        picMap.set(doc.pic, (picMap.get(doc.pic) || 0) + 1);
    });
    return Array.from(picMap.entries())
        .map(([name, value]) => ({ name, 'Jumlah BQ': value }))
        .sort((a,b) => b['Jumlah BQ'] - a['Jumlah BQ']);
  }, [filteredData]);

  const monthlyData = useMemo(() => {
        const monthMap = new Map<string, number>();
        filteredData.forEach(doc => {
            const date = new Date(doc.surveyDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        });
        
        return Array.from(monthMap.entries())
            .map(([key, value]) => {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return { 
                    name: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), 
                    'Jumlah BQ': value,
                    sortKey: key 
                };
            })
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredData]);

  const handleExport = async () => {
    const toastId = toast.loading('Membuat laporan PDF...');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Helper to add chart images
    const addChartToPdf = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
        if (ref.current) {
            try {
                const canvas = await html2canvas(ref.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', // Match theme background for consistency
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (yPos + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(title, margin, yPos);
                yPos += 10;

                doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 15;

            } catch (error) {
                console.error(`Gagal membuat gambar untuk: ${title}`, error);
                toast.error(`Gagal memproses grafik: ${title}`, { id: toastId });
            }
        }
    };

    // 1. Add Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Laporan Dashboard BQ", pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // 2. Add Summary Table
    autoTable(doc, {
        startY: yPos,
        head: [['Metrik', 'Nilai']],
        body: [
            ['Total BQ (difilter)', filteredData.length],
            ['Rata-rata SLA', `${dashboardStats.averageSla.toFixed(1)} hari`],
            ...Object.entries(dashboardStats.statusCounts).map(([k, v]) => [`Jumlah ${k}`, v])
        ],
        theme: 'grid',
        margin: { left: margin, right: margin }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 3. Add Charts
    await addChartToPdf(pieChartRef, 'Distribusi Status BQ');
    await addChartToPdf(picChartRef, 'Jumlah BQ per PIC');
    await addChartToPdf(monthlyChartRef, 'Volume BQ per Bulan');

    // 4. Save
    doc.save('laporan_dashboard_bq.pdf');
    toast.success("Laporan PDF lengkap berhasil diekspor!", { id: toastId });
  };

  const selectClasses = "text-sm p-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-ring focus:border-ring transition";
  
  const statusBreakdown = (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1" title="Selesai"><CheckCircle size={12} className="text-green-500"/> {dashboardStats.statusCounts.Selesai || 0}</span>
        <span className="flex items-center gap-1" title="Diterima"><Check size={12} className="text-sky-500"/> {dashboardStats.statusCounts['Diterima'] || 0}</span>
        <span className="flex items-center gap-1" title="Approval"><Clock size={12} className="text-indigo-500"/> {dashboardStats.statusCounts['Approval'] || 0}</span>
        <span className="flex items-center gap-1" title="Survey"><Clock size={12} className="text-yellow-500"/> {dashboardStats.statusCounts.Survey || 0}</span>
    </div>
  );

  const workItemBreakdown = (
      <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span title="AHS">AHS: <strong>{workItemSources.AHS || 0}</strong></span>
          <span title="Manual">Manual: <strong>{workItemSources.Manual || 0}</strong></span>
          <span title="Import">Import: <strong>{workItemSources.Import || 0}</strong></span>
      </div>
  );

  return (
    <>
    <CreateBqModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleSaveNewBq} initialData={null} />
    <SlaDetailsModal isOpen={isSlaModalOpen} onClose={() => setSlaModalOpen(false)} fastest={dashboardStats.fastestSla} slowest={dashboardStats.slowestSla} />
    <div className="space-y-6 animate-fade-in-up">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Ringkasan BQ</h2>
                    <p className="text-muted-foreground mt-1">Analisis performa BQ berdasarkan filter yang dipilih.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-muted rounded-lg transition"><Download size={16} /> Export</button>
                    <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition shadow"><Plus size={16} /> Buat BQ</button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            icon={<FileText />} 
            title="Total BQ (Difilter)" 
            value={filteredData.length.toString()}
            subtitle={statusBreakdown}
        />
        <StatCard 
            icon={<Clock />} 
            title="Rata-rata SLA Penyelesaian" 
            value={`${dashboardStats.averageSla.toFixed(1)} hari`} 
            changeType={dashboardStats.averageSla < 20 ? 'increase' : 'decrease'} 
            change={dashboardStats.averageSla < 20 ? 'Performa Baik' : 'Perlu Perhatian'}
            subtitle={`Berdasarkan ${completedBqsCount} BQ Selesai`}
        />
        <StatCard 
            icon={<HardHat />} 
            title="Database Pekerjaan" 
            value={workItems.length.toString()}
            subtitle={workItemBreakdown}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div ref={pieChartRef} className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribusi Status</h3>
          <div className="relative w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value" paddingAngle={5} stroke="hsl(var(--card))" onClick={(data) => navigate(`/bq/daftar?status=${data.name}`)} className="cursor-pointer" labelLine={false} label={renderCustomizedLabel}>
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
                <span className="text-sm text-muted-foreground">Total BQ</span>
            </div>
          </div>
        </div>
        <div ref={picChartRef} className="lg:col-span-3 bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-lg font-semibold text-card-foreground mb-4">Jumlah BQ per PIC</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={picData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...commonChartProps.axisTick} />
                  <YAxis type="category" dataKey="name" tick={{...commonChartProps.axisTick, width: 80}} width={90} />
                  <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={commonChartProps.tooltipCursor} />
                  <Bar dataKey="Jumlah BQ" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Jumlah BQ" position="right" style={{ fill: themeStyles.tickColor, fontSize: 12 }} />
                  </Bar>
                </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      <div ref={monthlyChartRef} className="bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-lg font-semibold text-card-foreground mb-4">Volume BQ per Bulan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor} />
                <XAxis dataKey="name" {...commonChartProps.axisTick} />
                <YAxis allowDecimals={false} {...commonChartProps.axisTick} />
                <Tooltip contentStyle={commonChartProps.tooltipContentStyle} cursor={commonChartProps.tooltipCursor}/>
                <Legend wrapperStyle={commonChartProps.legendWrapperStyle} />
                <Bar dataKey="Jumlah BQ" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Jumlah BQ" position="top" style={{ fontSize: 10, fill: themeStyles.tickColor }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
    </>
  );
};

export default BqDashboard;