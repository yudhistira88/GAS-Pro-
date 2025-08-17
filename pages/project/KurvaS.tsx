import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Dot,
} from 'recharts';
import { Plus, Save, Trash2, Edit2, FileText, ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

// --- TYPE DEFINITIONS ---
interface Task {
    id: string;
    no: string; // This will be calculated for display, not stored
    name: string;
    startDate: string | null;
    endDate: string | null;
    weight: number;
    isCategory: boolean;
    remarks: string;
}

interface TimelineWeek {
    week: number;
    month: string;
    weekInMonth: number;
    startDate: Date;
    endDate: Date;
}

// --- HELPER FUNCTIONS ---
const romanize = (num: number): string => {
  if (isNaN(num)) return '';
  const digits = String(+num).split('');
  const key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM", "", "X","XX","XXX","XL","L","LX","LXX","LXXX","XC", "", "I","II","III","IV","V","VI","VII","VIII","IX"];
  let roman = '', i = 3;
  while (i--) roman = (key[+digits.pop()! + (i * 10)] || '') + roman;
  return Array(+digits.join('') + 1).join("M") + roman;
};

const formatDate = (date: Date): string => {
    const d = new Date(date);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString; // Return original if not YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatDecimal = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '';
    }
    return value.toFixed(2).replace('.', ',');
};


// --- HELPER COMPONENTS ---

// Helper component for formatted number input
const DecimalInput = ({ value, onNumberChange, ...props }: { value: number | null | undefined, onNumberChange: (num: number | null) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) => {
    const [displayValue, setDisplayValue] = useState(formatDecimal(value));
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        // Update display only if not focused, to prevent cursor jumping
        if (document.activeElement !== inputRef.current) {
            setDisplayValue(formatDecimal(value));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDisplayValue(val); // Allow user to type freely
        // Only call parent onChange if it's a valid number or empty
        const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(num)) {
            onNumberChange(num);
        } else if (val.trim() === '' || val.trim() === ',') {
            onNumberChange(null);
        }
    };

    const handleBlur = () => {
        setDisplayValue(formatDecimal(value)); // Format on blur
    };

    return <input ref={inputRef} type="text" value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
};


const EditableCell = ({ value, onChange, type = 'text', className = '' }: { value: string | number | null, onChange: (value: any) => void, type?: string, className?: string }) => {
    const commonProps = {
        className: `w-full bg-transparent p-1 focus:bg-white dark:focus:bg-gray-700 rounded-md outline-none focus:ring-1 focus:ring-honda-red text-inherit ${className}`
    };

    if (type === 'decimal') {
        return (
            <DecimalInput
                value={typeof value === 'number' ? value : null}
                onNumberChange={(num) => onChange(num === null ? 0 : num)}
                {...commonProps}
            />
        );
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value);
    };

    return (
        <input
            type={type}
            value={value ?? ''}
            onChange={handleChange}
            {...commonProps}
        />
    );
};


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-xs">
                <p className="font-bold mb-1 text-gray-800 dark:text-gray-100">{`Minggu ke-${payload[0].payload.week}`}</p>
                {payload.map((pld: any) => (
                     <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value.toFixed(2)}%`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


interface RincianLaporanViewProps {
    tasks: Task[];
    projectName: string;
    onBack: () => void;
    timeline: TimelineWeek[];
    manualWeeklyProgress: Record<string, Record<number, number>>;
}

const RincianLaporanView = ({ tasks, projectName, onBack, timeline, manualWeeklyProgress }: RincianLaporanViewProps) => {
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
    const [progressData, setProgressData] = useState<Record<string, { mingguLalu: string; mingguIni: string }>>({});
    const [keterangan, setKeterangan] = useState<Record<string, string>>({});

    const handleProgressChange = (taskId: string, field: 'mingguLalu' | 'mingguIni', value: string) => {
        const sanitizedValue = value.replace(/[^0-9,]/g, '');
        if (/^\d{0,3}(,\d{0,2})?$/.test(sanitizedValue)) {
            setProgressData(prev => ({
                ...prev,
                [taskId]: {
                    ...(prev[taskId] || { mingguLalu: '', mingguIni: '' }),
                    [field]: sanitizedValue,
                }
            }));
        }
    };

    const handleKeteranganChange = (taskId: string, value: string) => {
        setKeterangan(prev => ({ ...prev, [taskId]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    const totals = useMemo(() => {
        let totalBobot = 0;
        let totalProgressLalu = 0;
        let totalProgressIni = 0;

        tasks.forEach(task => {
            if (!task.isCategory) {
                const bobotMingguan = manualWeeklyProgress[task.id]?.[selectedWeekIndex] || 0;
                totalBobot += bobotMingguan;

                const taskProgress = progressData[task.id] || { mingguLalu: '0', mingguIni: '0' };
                const pLalu = parseFloat(taskProgress.mingguLalu.replace(',', '.')) || 0;
                const pIni = parseFloat(taskProgress.mingguIni.replace(',', '.')) || 0;
                
                totalProgressLalu += (pLalu / 100) * bobotMingguan;
                totalProgressIni += (pIni / 100) * bobotMingguan;
            }
        });
        
        return {
            bobot: totalBobot,
            mingguLalu: totalProgressLalu,
            mingguIni: totalProgressIni,
            sdMingguIni: totalProgressLalu + totalProgressIni,
        };
    }, [tasks, selectedWeekIndex, manualWeeklyProgress, progressData]);
    
    let categoryCounter = 0;
    let taskCounter = 0;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-0 sm:p-0 lg:p-0 print:p-2 print:bg-white print:dark:bg-white print:text-black">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-area, .printable-area * {
                            visibility: visible;
                        }
                        .printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 1rem;
                        }
                    }
                `}
            </style>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg print:shadow-none print:rounded-none printable-area">
                <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b dark:border-gray-700 pb-4 print:hidden">
                    <div>
                        <h1 className="font-bold text-2xl text-gray-800 dark:text-gray-100">Rincian Laporan Proyek</h1>
                        <p className="text-gray-500 dark:text-gray-400">{projectName}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                         <div className="flex items-center gap-2">
                            <label htmlFor="week-selector" className="text-sm font-medium whitespace-nowrap">Pilih Minggu:</label>
                            <select
                                id="week-selector"
                                value={selectedWeekIndex}
                                onChange={e => setSelectedWeekIndex(Number(e.target.value))}
                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-honda-red focus:border-honda-red"
                            >
                                {timeline.map((w, index) => (
                                    <option key={w.week} value={index}>
                                        Minggu ke-{w.week} ({w.startDate.toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - {w.endDate.toLocaleDateString('id-ID', {day:'2-digit', month:'short'})})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                                <Printer size={16} /> Cetak
                            </button>
                            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-honda-red rounded-md hover:bg-red-700 transition shadow">
                                <ArrowLeft size={16} /> Kembali ke Kurva S
                            </button>
                        </div>
                    </div>
                </header>
                 <div className="print:block hidden text-center mb-4">
                     <h1 className="font-bold text-xl text-black">Rincian Laporan Proyek</h1>
                     <p className="text-black">{projectName}</p>
                     <p className="text-black font-semibold">Laporan Minggu ke-{timeline[selectedWeekIndex]?.week}</p>
                 </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs whitespace-nowrap">
                        <thead>
                            <tr className="bg-blue-900 dark:bg-blue-950 text-white uppercase print:bg-gray-200 print:text-black">
                                <th rowSpan={2} className="border p-2 min-w-14 text-center">NO</th>
                                <th rowSpan={2} className="border p-2 min-w-64 text-left">URAIAN PEKERJAAN</th>
                                <th rowSpan={2} className="border p-2 min-w-20 text-center">BOBOT (%)</th>
                                <th colSpan={3} className="border p-2 min-w-32 text-center">PROGRES PEKERJAAN (%)</th>
                                <th rowSpan={2} className="border p-2 min-w-64 text-left">KETERANGAN</th>
                            </tr>
                            <tr className="bg-blue-900 dark:bg-blue-950 text-white uppercase print:bg-gray-200 print:text-black">
                                <th className="border p-2 font-medium">MINGGU LALU</th>
                                <th className="border p-2 font-medium">MINGGU INI</th>
                                <th className="border p-2 font-medium">s.d MINGGU INI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => {
                                if (task.isCategory) { categoryCounter++; taskCounter = 0; } else { taskCounter++; }
                                const taskNo = task.isCategory ? romanize(categoryCounter) : taskCounter.toString();
                                const bobotMingguan = manualWeeklyProgress[task.id]?.[selectedWeekIndex] || 0;
                                const taskProgress = progressData[task.id] || { mingguLalu: '', mingguIni: '' };
                                const pLalu = parseFloat(taskProgress.mingguLalu.replace(',', '.')) || 0;
                                const pIni = parseFloat(taskProgress.mingguIni.replace(',', '.')) || 0;
                                const pSdIni = pLalu + pIni;
                                
                                return (
                                    <tr key={task.id} className={`${task.isCategory ? 'bg-gray-100 dark:bg-gray-700/50 font-bold print:bg-gray-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                        <td className="border dark:border-gray-600 p-2 text-center">{taskNo}</td>
                                        <td className="border dark:border-gray-600 p-2">{task.name}</td>
                                        <td className="border dark:border-gray-600 p-2 text-center">{!task.isCategory && bobotMingguan > 0 ? formatDecimal(bobotMingguan) : ''}</td>
                                        <td className="border dark:border-gray-600 p-0 print:p-1">
                                            {!task.isCategory ? <input type="text" value={taskProgress.mingguLalu} onChange={e => handleProgressChange(task.id, 'mingguLalu', e.target.value)} className="w-full h-full bg-transparent p-2 text-center outline-none focus:ring-1 focus:ring-honda-red print:ring-0" placeholder="0,00"/> : <div className="p-2"></div>}
                                        </td>
                                        <td className="border dark:border-gray-600 p-0 print:p-1">
                                            {!task.isCategory ? <input type="text" value={taskProgress.mingguIni} onChange={e => handleProgressChange(task.id, 'mingguIni', e.target.value)} className="w-full h-full bg-transparent p-2 text-center outline-none focus:ring-1 focus:ring-honda-red print:ring-0" placeholder="0,00"/> : <div className="p-2"></div>}
                                        </td>
                                        <td className="border dark:border-gray-600 p-2 text-center bg-gray-50 dark:bg-gray-700/50">
                                            {!task.isCategory ? formatDecimal(pSdIni) : ''}
                                        </td>
                                        <td className="border dark:border-gray-600 p-0 print:p-1">
                                            <input type="text" value={keterangan[task.id] || ''} onChange={e => handleKeteranganChange(task.id, e.target.value)} className="w-full h-full bg-transparent p-2 outline-none focus:ring-1 focus:ring-honda-red print:ring-0"/>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-blue-200 dark:bg-blue-900/50 font-bold print:bg-gray-200">
                                <td colSpan={2} className="border dark:border-gray-600 p-2 text-center">JUMLAH</td>
                                <td className="border dark:border-gray-600 p-2 text-center">{formatDecimal(totals.bobot)}</td>
                                <td className="border dark:border-gray-600 p-2 text-center">{formatDecimal(totals.mingguLalu)}</td>
                                <td className="border dark:border-gray-600 p-2 text-center">{formatDecimal(totals.mingguIni)}</td>
                                <td className="border dark:border-gray-600 p-2 text-center">{formatDecimal(totals.sdMingguIni)}</td>
                                <td className="border dark:border-gray-600 p-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const KurvaS = () => {
    const [idProject, setIdProject] = useState('PROJ-001');
    const [projectName, setProjectName] = useState('Proyek Renovasi Ruang Jemur Lt. 2');
    const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectDuration, setProjectDuration] = useState(70); // in days
    const [tasks, setTasks] = useState<Task[]>([]);
    const [manualWeeklyProgress, setManualWeeklyProgress] = useState<Record<string, Record<number, number>>>({});
    const [actualWeeklyProgress, setActualWeeklyProgress] = useState<Record<number, number>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [overlayPosition, setOverlayPosition] = useState({ top: 49, left: 674, right: 238, bottom: 155 });
    const [showReport, setShowReport] = useState(false);

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const chartOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const start = new Date(projectStartDate);
        const getTaskDate = (dayNumber: number) => {
            const date = new Date(start);
            date.setDate(date.getDate() + dayNumber - 1);
            return formatDate(date);
        };
        
        const initialTasks: Omit<Task, 'no'>[] = [
            { id: 'cat-1', name: 'PEKERJAAN PERSIAPAN', isCategory: true, startDate: null, endDate: null, weight: 0, remarks: '' },
            { id: 'task-1-1', name: 'Mobilisasi dan demobilisasi', isCategory: false, startDate: getTaskDate(1), endDate: getTaskDate(4), weight: 6.90, remarks: '' },
            { id: 'task-1-2', name: 'Pembersihan dan pembuangan puing/sampah', isCategory: false, startDate: getTaskDate(1), endDate: getTaskDate(4), weight: 0, remarks: '' },
            { id: 'cat-2', name: 'PEKERJAAN PEMBUATAN RUANG JEMUR LT. 2', isCategory: true, startDate: null, endDate: null, weight: 0, remarks: '' },
            { id: 'task-2-1-1', name: 'Bongkar atap eksisting (jika ada)', isCategory: false, startDate: getTaskDate(5), endDate: getTaskDate(6), weight: 0.66, remarks: '' },
            { id: 'task-2-2-1', name: 'Plat lantai beton bertulang (tebal 12 cm)', isCategory: false, startDate: getTaskDate(17), endDate: getTaskDate(20), weight: 9.10, remarks: '' },
            { id: 'task-2-2-2', name: 'Balok beton bertulang (20 m)', isCategory: false, startDate: getTaskDate(7), endDate: getTaskDate(10), weight: 22.07, remarks: '' },
            { id: 'task-2-2-3', name: 'Kolom beton bertulang (6 m)', isCategory: false, startDate: getTaskDate(11), endDate: getTaskDate(16), weight: 6.21, remarks: '' },
        ];

        setTasks(initialTasks.map(t => ({...t, no: ''})));
    }, [projectStartDate]);

    const numWeeks = useMemo(() => Math.ceil(projectDuration / 7), [projectDuration]);

    const timeline = useMemo((): TimelineWeek[] => {
        const weeks: TimelineWeek[] = [];
        const start = new Date(projectStartDate);
        for (let i = 0; i < numWeeks; i++) {
            const weekStart = new Date(start);
            weekStart.setDate(weekStart.getDate() + i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            weeks.push({
                week: i + 1,
                month: weekStart.toLocaleString('id-ID', { month: 'short', year: '2-digit' }),
                weekInMonth: Math.floor(i / 5) + 1,
                startDate: weekStart,
                endDate: weekEnd,
            });
        }
        return weeks;
    }, [projectStartDate, numWeeks]);

    const monthHeaders = useMemo(() => {
        return timeline.reduce((acc, week) => {
            if (!acc[week.month]) {
                acc[week.month] = 0;
            }
            acc[week.month]++;
            return acc;
        }, {} as Record<string, number>);
    }, [timeline]);

    const handleTaskChange = useCallback((id: string, field: keyof Omit<Task, 'no'>, value: any) => {
        setTasks(currentTasks => currentTasks.map(task => {
            if (task.id === id) {
                const updatedTask = { ...task, [field]: value };
                if ((field === 'startDate' || field === 'endDate') && updatedTask.startDate && updatedTask.endDate) {
                    if (new Date(updatedTask.endDate) < new Date(updatedTask.startDate)) {
                        toast.error('Tanggal Selesai tidak boleh sebelum Tanggal Mulai.');
                        return task;
                    }
                }
                return updatedTask;
            }
            return task;
        }));
    }, []);

    const handleManualProgressChange = (taskId: string, weekIndex: number, value: number | null) => {
        const newProgress = value === null ? undefined : value;

        setManualWeeklyProgress(prev => {
            const taskProgress = { ...prev[taskId] };
            if (newProgress === undefined || newProgress === 0) {
                delete taskProgress[weekIndex];
            } else {
                taskProgress[weekIndex] = newProgress;
            }
            if (Object.keys(taskProgress).length === 0) {
                const newTotalProgress = { ...prev };
                delete newTotalProgress[taskId];
                return newTotalProgress;
            }
            return { ...prev, [taskId]: taskProgress };
        });
    };

    const calculatedPlannedProgress = useMemo(() => {
        const weeklyTotals: Record<number, number> = {};
        for (const task of tasks) {
            if (!task.isCategory) {
                const taskProgress = manualWeeklyProgress[task.id];
                if (taskProgress) {
                    for (const weekIndex in taskProgress) {
                        const weekNum = parseInt(weekIndex, 10);
                        weeklyTotals[weekNum] = (weeklyTotals[weekNum] || 0) + taskProgress[weekIndex];
                    }
                }
            }
        }
        return weeklyTotals;
    }, [manualWeeklyProgress, tasks]);

    const { cumulativePlanProgress, cumulativeActualProgress, chartData } = useMemo(() => {
        const planProgress = timeline.map((_, i) => calculatedPlannedProgress[i] || 0);
        const cumulativePlanProgress = planProgress.reduce((acc, val, i) => { acc.push((acc[i-1] || 0) + val); return acc; }, [] as number[]);
        const cumulativeActualProgress = timeline.reduce((acc, week, i) => { acc.push((acc[i-1] || 0) + (actualWeeklyProgress[i] || 0)); return acc; }, [] as number[]);

        const chartDataResult = timeline.map((w, i) => ({
            week: w.week,
            plan: cumulativePlanProgress[i] > 100 ? 100 : cumulativePlanProgress[i],
            actual: cumulativeActualProgress[i] > 100 ? 100 : cumulativeActualProgress[i],
        }));
        
        chartDataResult.unshift({ week: 0, plan: 0, actual: 0 });

        return { cumulativePlanProgress, cumulativeActualProgress, chartData: chartDataResult };
    }, [calculatedPlannedProgress, actualWeeklyProgress, timeline]);

    const totalWeight = useMemo(() => tasks.reduce((sum, t) => sum + (t.isCategory ? 0 : t.weight), 0), [tasks]);

    useEffect(() => {
        const syncScroll = () => {
            if (tableContainerRef.current && chartOverlayRef.current) {
                chartOverlayRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
            }
        };
        const tableContainer = tableContainerRef.current;
        tableContainer?.addEventListener('scroll', syncScroll);
        return () => tableContainer?.removeEventListener('scroll', syncScroll);
    }, []);

    useEffect(() => {
        const calculatePosition = () => {
            if (tableContainerRef.current) {
                const thead = tableContainerRef.current.querySelector('thead');
                const tfoot = tableContainerRef.current.querySelector('tfoot');
                const headerCells = Array.from(tableContainerRef.current.querySelector('table > thead > tr:first-child')?.children || []) as HTMLElement[];
                
                if (thead && tfoot && headerCells.length > 8) {
                    const leftCells = headerCells.slice(0, 6);
                    const rightCells = headerCells.slice(-2);
                    const leftWidth = leftCells.reduce((sum, el) => sum + el.offsetWidth, 0);
                    const rightWidth = rightCells.reduce((sum, el) => sum + el.offsetWidth, 0);

                    setOverlayPosition({
                        top: thead.offsetHeight,
                        left: leftWidth,
                        right: rightWidth,
                        bottom: tfoot.offsetHeight
                    });
                }
            }
        };

        const observer = new ResizeObserver(() => {
            calculatePosition();
        });

        const tableEl = tableContainerRef.current;
        if (tableEl) {
            observer.observe(tableEl);
        }
        
        calculatePosition(); // Initial calculation

        return () => {
            if (tableEl) {
                observer.unobserve(tableEl);
            }
        };
    }, [tasks, timeline]);
    
    const handleAddNewItem = (isCategory: boolean) => {
        const newId = `item-${Date.now()}`;
        const newItem = {
            id: newId, name: isCategory ? 'KATEGORI BARU' : 'Tugas Baru',
            startDate: null, endDate: null, weight: 0,
            isCategory: isCategory, remarks: '',
        };
        setTasks(prev => [...prev, { ...newItem, no: '' }]);
        setEditingId(newId);
    };
    
    const handleDeleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success("Item dihapus.");
    };

    const handleActualProgressChange = (weekIndex: number, value: number | null) => {
        const newProgress = value ?? 0;
        if (!isNaN(newProgress)) {
            setActualWeeklyProgress(prev => ({...prev, [weekIndex]: newProgress }));
        }
    };
    
    let categoryCounter = 0;
    let taskCounter = 0;

    if (showReport) {
        return <RincianLaporanView 
            tasks={tasks} 
            projectName={projectName} 
            onBack={() => setShowReport(false)}
            timeline={timeline}
            manualWeeklyProgress={manualWeeklyProgress}
        />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg font-sans">
            <header className="mb-4 space-y-4">
                 <h1 className="font-bold text-xl text-gray-800 dark:text-gray-100">Jadwal Proyek (Kurva S)</h1>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                    <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">ID Project</label>
                        <input type="text" value={idProject} onChange={e => setIdProject(e.target.value)} className="w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Nama Proyek</label>
                        <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Tanggal Rencana Mulai</label>
                        <input type="date" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} className="w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Durasi Proyek (Hari Kalender)</label>
                        <input type="number" value={projectDuration} onChange={e => setProjectDuration(Number(e.target.value))} className="w-full text-sm p-2 border rounded-md" />
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={() => handleAddNewItem(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 transition shadow">
                         <Plus size={14} /> Tambah Kategori
                     </button>
                     <button onClick={() => handleAddNewItem(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow">
                         <Plus size={14} /> Tambah Tugas
                     </button>
                     <button
                        onClick={() => setShowReport(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition shadow ml-auto"
                     >
                        <FileText size={14} /> + Rincian Laporan
                     </button>
                 </div>
            </header>

            <div className="relative">
                <div ref={tableContainerRef} className="overflow-x-auto border border-gray-300 dark:border-gray-600">
                    <table className="border-collapse text-xs whitespace-nowrap">
                        <thead className="sticky top-0 bg-blue-900 dark:bg-blue-950 text-white z-10 uppercase">
                            <tr>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-14">NO</th>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-64">Uraian Pekerjaan</th>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-32">Start Date</th>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-32">Finish Date</th>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-20">Duration</th>
                                <th rowSpan={2} className="border-r border-blue-800 dark:border-blue-900 p-2 min-w-20">Bobot (%)</th>
                                {Object.entries(monthHeaders).map(([month, colSpan]) => (
                                    <th key={month} colSpan={colSpan} className="border-r border-blue-800 dark:border-blue-900 p-2 font-semibold">{month}</th>
                                ))}
                                <th rowSpan={2} className="p-2 min-w-40 bg-orange-500">Keterangan</th>
                                <th rowSpan={2} className="p-2 min-w-20 border-l border-blue-800 dark:border-blue-900">Aksi</th>
                            </tr>
                            <tr>
                                {timeline.map((w, i) => (
                                    <th key={w.week} className="border-r border-blue-800 dark:border-blue-900 font-normal w-16 p-1 text-center" title={`${w.startDate.toLocaleDateString('id-ID')} - ${w.endDate.toLocaleDateString('id-ID')}`}>
                                        W{i % 5 + 1}
                                        <div className="font-light text-[10px]">{`${w.startDate.getDate()}-${w.endDate.getDate()} ${w.startDate.toLocaleString('id-ID', { month: 'short' })}`}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => {
                                if (task.isCategory) { categoryCounter++; taskCounter = 0; } else { taskCounter++; }
                                const taskNo = task.isCategory ? romanize(categoryCounter) : taskCounter.toString();
                                const duration = (task.startDate && task.endDate) ? Math.round((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
                                const isEditing = editingId === task.id;
                                return (
                                <tr key={task.id} className={`${task.isCategory ? 'bg-gray-100 dark:bg-gray-700/50 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                    <td className="border-r dark:border-gray-600 p-1 text-center">{taskNo}</td>
                                    <td className="border-r dark:border-gray-600 p-1">{isEditing ? <EditableCell value={task.name} onChange={v => handleTaskChange(task.id, 'name', v)} /> : <span className="px-1">{task.name}</span>}</td>
                                    <td className="border-r dark:border-gray-600 p-1 text-center">{isEditing && !task.isCategory ? <EditableCell type="date" value={task.startDate} onChange={v => handleTaskChange(task.id, 'startDate', v)} /> : <span className="px-1">{formatDisplayDate(task.startDate)}</span>}</td>
                                    <td className="border-r dark:border-gray-600 p-1 text-center">{isEditing && !task.isCategory ? <EditableCell type="date" value={task.endDate} onChange={v => handleTaskChange(task.id, 'endDate', v)} /> : <span className="px-1">{formatDisplayDate(task.endDate)}</span>}</td>
                                    <td className="border-r dark:border-gray-600 p-1 text-center bg-green-50 dark:bg-green-900/30">{duration > 0 ? duration : ''}</td>
                                    <td className="border-r dark:border-gray-600 p-1 text-center bg-yellow-50 dark:bg-yellow-900/30">{isEditing && !task.isCategory ? <EditableCell type="decimal" className="text-center" value={task.weight} onChange={v => handleTaskChange(task.id, 'weight', v)} /> : <span className="px-1">{task.weight > 0 ? formatDecimal(task.weight) : ''}</span>}</td>
                                    {timeline.map((w, weekIdx) => {
                                        const manualValue = manualWeeklyProgress[task.id]?.[weekIdx];
                                        const hasValue = manualValue !== undefined && manualValue > 0;
                                        return (
                                            <td key={w.week} className={`border-r dark:border-gray-600 p-0 h-full ${hasValue ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}>
                                                {!task.isCategory ? (
                                                    <DecimalInput
                                                        value={manualValue}
                                                        onNumberChange={(num) => handleManualProgressChange(task.id, weekIdx, num)}
                                                        className="w-16 h-full bg-transparent p-1 text-center outline-none focus:ring-1 focus:ring-honda-red rounded-none"
                                                        placeholder="-"
                                                    />
                                                ) : <div className="w-16 h-full"></div>}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1">{isEditing ? <EditableCell value={task.remarks} onChange={v => handleTaskChange(task.id, 'remarks', v)} /> : <span className="px-1">{task.remarks}</span>}</td>
                                    <td className="p-1 text-center border-l dark:border-gray-600">
                                        <div className="flex items-center justify-center gap-1">
                                            {isEditing ? <button onClick={() => setEditingId(null)} className="p-1 text-green-600 hover:text-green-500" title="Simpan"><Save size={14} /></button> : <button onClick={() => setEditingId(task.id)} className="p-1 text-blue-600 hover:text-blue-500" title="Edit"><Edit2 size={14} /></button>}
                                            <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-red-600 hover:text-red-500" title="Hapus"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-blue-200 dark:bg-blue-900/50 z-10 text-xs">
                            <tr className="font-bold">
                                <td colSpan={5} className="p-2 text-right border-r dark:border-gray-600">TOTAL</td>
                                <td className="p-2 text-center border-r dark:border-gray-600 bg-green-200/50 dark:bg-green-800/50">{formatDecimal(totalWeight)}%</td>
                                {timeline.map((_, i) => <td key={i} className="p-2 text-center border-r dark:border-gray-600">{formatDecimal(calculatedPlannedProgress[i] || 0)}</td>)}
                                <td colSpan={2} className="border-l dark:border-gray-600"></td>
                            </tr>
                             <tr className="font-bold bg-blue-300 dark:bg-blue-800/50">
                                <td colSpan={6} className="p-2 text-right border-r dark:border-gray-600">Akumulasi Progress Rencana (%)</td>
                                {cumulativePlanProgress.map((p, i) => <td key={i} className="p-2 text-center border-r dark:border-gray-600">{p > 0 ? formatDecimal(p) : '-'}</td>)}
                                <td colSpan={2} className="border-l dark:border-gray-600"></td>
                            </tr>
                             <tr>
                                <td colSpan={6} className="p-2 text-right border-r dark:border-gray-600">Progress Actual (%)</td>
                                {timeline.map((w, i) => <td key={w.week} className="p-1 text-center border-r dark:border-gray-600">
                                    <DecimalInput 
                                        value={actualWeeklyProgress[i]} 
                                        onNumberChange={(num) => handleActualProgressChange(i, num)} 
                                        className="w-16 bg-yellow-50 dark:bg-yellow-900/30 p-1 text-center outline-none focus:ring-1 focus:ring-honda-red rounded"/>
                                </td>)}
                                <td colSpan={2} className="border-l dark:border-gray-600"></td>
                            </tr>
                             <tr className="font-bold bg-blue-300 dark:bg-blue-800/50">
                                <td colSpan={6} className="p-2 text-right border-r dark:border-gray-600">Akumulasi Progress Actual (%)</td>
                                {cumulativeActualProgress.map((p, i) => <td key={i} className="p-2 text-center border-r dark:border-gray-600">{p > 0 ? formatDecimal(p) : '-'}</td>)}
                                <td colSpan={2} className="border-l dark:border-gray-600"></td>
                            </tr>
                             <tr>
                                <td colSpan={6} className="p-2 text-right border-r dark:border-gray-600 font-semibold">Deviasi (%)</td>
                                {timeline.map((w, i) => {
                                    const deviasi = (cumulativeActualProgress[i] || 0) - (cumulativePlanProgress[i] || 0);
                                    return <td key={w.week} className={`p-2 text-center border-r dark:border-gray-600 font-bold ${deviasi > 0.01 ? 'text-green-600' : deviasi < -0.01 ? 'text-red-500' : ''}`}>{formatDecimal(deviasi)}</td>
                                })}
                                <td colSpan={2} className="border-l dark:border-gray-600"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <div
                    ref={chartOverlayRef}
                    className="absolute pointer-events-none overflow-hidden"
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`,
                        right: `${overlayPosition.right}px`,
                        bottom: `${overlayPosition.bottom}px`,
                    }}
                >
                    <div style={{ width: `${numWeeks * 64}px`, height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 32, left: -32, bottom: 10 }}>
                                <XAxis dataKey="week" type="number" domain={[0, 'dataMax']} hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'red', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Line dataKey="plan" name="Rencana Kumulatif" stroke="#00A0E3" strokeWidth={2.5} dot={<Dot r={3} fill="#00A0E3"/>} activeDot={{r: 5}}/>
                                <Line dataKey="actual" name="Aktual Kumulatif" stroke="#4CAF50" strokeWidth={2.5} dot={<Dot r={3} fill="#4CAF50"/>} activeDot={{r: 5}}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
             <div className="flex justify-center items-center gap-8 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-1" style={{ backgroundColor: '#00A0E3' }}></div>
                    <span className="text-gray-700 dark:text-gray-300">Rencana Kumulatif</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-1" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span className="text-gray-700 dark:text-gray-300">Aktual Kumulatif</span>
                </div>
            </div>
        </div>
    );
};

export default KurvaS;