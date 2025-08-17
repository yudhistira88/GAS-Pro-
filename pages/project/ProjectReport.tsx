import React, { useState, useMemo, useContext, useEffect, useCallback, useRef } from 'react';
import { type Project, type ProjectPhase } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Calendar, ChevronDown, Download, Maximize, TrendingUp, DollarSign, Clock, ShieldAlert, BarChart, LineChart as LineChartIcon, Camera, AlertTriangle, PlusCircle, X as XIcon, Trash2, Plus, Save, Edit, RefreshCw, Check, Settings, Upload, FileText, Search, DownloadCloud, MoreVertical, Pencil, KeyRound, Trophy } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart as RechartsLineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import html2canvas from 'html2canvas';


// --- TYPE DEFINITIONS ---
interface WeeklyReport {
    id: string;
    startDate: string;
    endDate: string;
    planProgressWeekly: number;
    actualProgressWeekly: number;
    planProgressCumulative: number;
    actualProgressCumulative: number;
    notes: string;
    attachment?: {
        name: string;
        url: string;
    };
}
interface Risk {
    id: string;
    weeklyReportId: string;
    desc: string;
    cause: string;
    impact: string;
    solution: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Ditangani' | 'Monitoring' | 'Selesai';
}
interface GalleryItem { src: string; date: string; type: string; }
type ReportVisibility = Record<string, boolean>;

// Updated ScheduleWormItem to match the new design
interface ScheduleWormItem {
  id: string;
  name: string;
  subLabel?: string;
  date: string;
  phase: string;
  status: 'complete' | 'inProgress' | 'notStarted';
  icon?: 'key' | 'trophy' | 'payment' | 'refresh';
  indicator?: { number: number; color: 'red' | 'green' };
}


// --- INITIAL MOCK DATA (will be managed by state) ---
const initialWeeklyReportsDataBase: Omit<WeeklyReport, 'planProgressCumulative' | 'actualProgressCumulative'>[] = [
    { id: 'wr-1', startDate: '2024-07-21', endDate: '2024-07-27', planProgressWeekly: 5, actualProgressWeekly: 5, notes: 'Pekerjaan persiapan sesuai jadwal.', attachment: { name: 'Laporan_Minggu1.pdf', url: '#' } },
    { id: 'wr-2', startDate: '2024-07-28', endDate: '2024-08-03', planProgressWeekly: 5, actualProgressWeekly: 7, notes: 'Percepatan pada galian pondasi.' },
    { id: 'wr-3', startDate: '2024-08-04', endDate: '2024-08-10', planProgressWeekly: 8, actualProgressWeekly: 8, notes: 'Pengecoran tahap 1 selesai lebih cepat.' },
    { id: 'wr-4', startDate: '2024-08-11', endDate: '2024-08-17', planProgressWeekly: 7, actualProgressWeekly: 4, notes: 'Keterlambatan pengiriman besi tulangan.', attachment: { name: 'Masalah_Logistik.docx', url: '#' } },
];

const initialRisksData: Risk[] = [
    { id: 'risk-1', weeklyReportId: 'wr-4', desc: 'Keterlambatan pengiriman semen', cause: 'Masalah logistik suplier', impact: 'Waktu (-2 hari)', solution: 'Mencari suplier alternatif dan melakukan pemesanan ulang.', priority: 'High', status: 'Ditangani' },
    { id: 'risk-2', weeklyReportId: 'wr-2', desc: 'Curah hujan tinggi', cause: 'Faktor cuaca', impact: 'Waktu (-3 hari), Kualitas (potensi)', solution: 'Menambahkan jam lembur saat cuaca cerah.', priority: 'Medium', status: 'Monitoring' },
    { id: 'risk-3', weeklyReportId: 'wr-1', desc: 'Perubahan desain minor dari owner', cause: 'Permintaan owner', impact: 'Biaya (+ Rp 15 Jt)', solution: 'Menyesuaikan gambar kerja dan mengajukan adendum.', priority: 'Low', status: 'Selesai' },
];

const initialGalleryImages: GalleryItem[] = [
    { src: 'https://placehold.co/600x400/ef4444/ffffff?text=Struktur+1', date: '2024-08-03', type: 'Struktur' },
    { src: 'https://placehold.co/600x400/f97316/ffffff?text=Struktur+2', date: '2024-08-03', type: 'Struktur' },
    { src: 'https://placehold.co/600x400/22c55e/ffffff?text=Persiapan+1', date: '2024-07-28', type: 'Persiapan' },
    { src: 'https://placehold.co/600x400/3b82f6/ffffff?text=Peralatan+1', date: '2024-07-28', type: 'Peralatan' },
    { src: 'https://placehold.co/600x400/14b8a6/ffffff?text=Persiapan+2', date: '2024-07-21', type: 'Persiapan' },
    { src: 'https://placehold.co/600x400/6366f1/ffffff?text=Peralatan+2', date: '2024-07-21', type: 'Peralatan' },
];

const initialScheduleWormData: ScheduleWormItem[] = [
    { id: 'sw-1', name: "Project Charter", subLabel: "Approved", date: "2024-01-31", phase: "Initiation", status: "complete", icon: 'key', indicator: { number: 1, color: 'red' } },
    { id: 'sw-2', name: "Permits & Approvals", subLabel: "", date: "2024-05-29", phase: "Planning", status: "complete" },
    { id: 'sw-3', name: "Concept Design", subLabel: "Complete", date: "2024-06-28", phase: "Design", status: "complete", icon: 'key' },
    { id: 'sw-4', name: "Detailed Design", subLabel: "Complete", date: "2024-07-25", phase: "Design", status: "complete", icon: 'key' },
    { id: 'sw-5', name: "Construction Documentation", subLabel: "Complete", date: "2024-09-29", phase: "Design", status: "complete", icon: 'key', indicator: { number: 3, color: 'red' } },
    { id: 'sw-6', name: "Tender Period", subLabel: "Complete", date: "2024-10-26", phase: "Procurement", status: "complete" },
    { id: 'sw-7', name: "Contract Award", date: "2024-11-30", phase: "Procurement", status: "complete", icon: 'trophy', indicator: { number: 5, color: 'red' } },
    { id: 'sw-8', name: "Site Mobilization", date: "2024-12-20", phase: "Delivery", status: "complete", icon: 'key' },
    { id: 'sw-9', name: "Construction Commencement", date: "2025-01-24", phase: "Delivery", status: "complete" },
    { id: 'sw-10', name: "Early Works", subLabel: "Complete", date: "2025-02-23", phase: "Delivery", status: "complete", icon: 'key' },
    { id: 'sw-11', name: "Main Works", subLabel: "Complete", date: "2026-03-20", phase: "Delivery", status: "inProgress", icon: 'refresh', indicator: { number: 5, color: 'green' } },
    { id: 'sw-12', name: "Practical Completion / Substantial...", date: "2026-05-26", phase: "Delivery", status: "notStarted", icon: 'key', indicator: { number: 2, color: 'red' } },
    { id: 'sw-13', name: "Punch List / Defects List", subLabel: "Complete", date: "2026-06-23", phase: "Close", status: "notStarted" },
    { id: 'sw-14', name: "Final Payment", date: "2026-08-22", phase: "Close", status: "notStarted", icon: 'payment' },
    { id: 'sw-15', name: "Project Closure", date: "2026-10-21", phase: "Close", status: "notStarted", icon: 'key' },
];


const allComponentDetails = {
    stats: { name: 'Statistik Utama' },
    timeline: { name: 'Fase & Linimasa Proyek' },
    milestones: { name: 'Milestone & Jadwal' },
    progressChart: { name: 'Grafik Progres Mingguan' },
    weeklyReports: { name: 'Laporan Mingguan' },
    risks: { name: 'Kendala & Risiko' },
    gallery: { name: 'Dokumentasi Lapangan' },
};

// --- REUSABLE COMPONENTS ---
const ReportStatCard = ({ icon, title, value, target, colorClass }: { icon: React.ReactNode, title: string, value: string, target: string, colorClass: string }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-l-4" style={{ borderColor: colorClass }}>
        <div className="flex items-center justify-between"> <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p> {icon} </div>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{target}</p>
    </div>
);

const ChartContainer = ({ title, children, icon, headerActions }: { title: string, children: React.ReactNode, icon: React.ReactNode, headerActions?: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{icon}{title}</h3>
             {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
        {children}
    </div>
);

const PriorityBadge = ({ priority }: { priority: Risk['priority'] }) => {
    const priorityStyles: Record<Risk['priority'], string> = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityStyles[priority]}`}>
            {priority}
        </span>
    );
};

const inputClasses = "w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200";

const recalculateCumulativeProgress = (reports: WeeklyReport[]): WeeklyReport[] => {
    const sortedReports = [...reports].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    let cumulativePlan = 0;
    let cumulativeActual = 0;
    return sortedReports.map(report => {
        cumulativePlan += report.planProgressWeekly;
        cumulativeActual += report.actualProgressWeekly;
        return {
            ...report,
            planProgressCumulative: cumulativePlan,
            actualProgressCumulative: cumulativeActual,
        };
    });
};

const WeeklyReportActionMenu = ({ onEdit, onUpload, onDelete }: { onEdit: () => void, onUpload: () => void, onDelete: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const createClickHandler = (action: () => void) => () => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(p => !p)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-10 animate-fade-in-up-fast">
                    <button onClick={createClickHandler(onEdit)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit size={16} /> Edit Laporan
                    </button>
                    <button onClick={createClickHandler(onUpload)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Upload size={16} /> Upload Lampiran
                    </button>
                    <button onClick={createClickHandler(onDelete)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2 size={16} /> Hapus
                    </button>
                </div>
            )}
        </div>
    );
};

const handleScreenshot = async (elementRef: React.RefObject<HTMLElement>, filename: string) => {
    if (!elementRef.current) {
        toast.error("Elemen tidak ditemukan untuk di-screenshot.");
        return;
    }
    
    const toastId = toast.loading('Mengambil screenshot...');

    try {
        const canvas = await html2canvas(elementRef.current, {
            useCORS: true,
            backgroundColor: null, 
            scale: 2 
        });
        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, filename);
                toast.success('Screenshot berhasil disimpan!', { id: toastId });
            } else {
                toast.error('Gagal membuat file screenshot.', { id: toastId });
            }
        });
    } catch (error) {
        console.error("Gagal mengambil screenshot:", error);
        toast.error('Gagal mengambil screenshot.', { id: toastId });
    }
};

// --- MILESTONE TIMELINE COMPONENT ---
const MilestoneNode = ({ item, isLast }: { item: ScheduleWormItem, isLast: boolean }) => {
    const icons = {
        key: <KeyRound size={16} className="text-white" />,
        trophy: <Trophy size={16} className="text-white" />,
        payment: <DollarSign size={16} className="text-white" />,
        refresh: <RefreshCw size={16} className="text-blue-600" />,
    };

    let nodeClasses = "w-10 h-10 flex items-center justify-center rounded-lg relative shadow-md";
    let nodeContent = null;
    
    if (item.status === 'complete') {
        nodeClasses += " bg-teal-500";
        nodeContent = <Check size={20} className="text-white" />;
    } else if (item.status === 'inProgress') {
        nodeClasses += " bg-blue-600";
        nodeContent = <RefreshCw size={20} className="text-white" />;
    } else {
        nodeClasses += " border-2 border-sky-400 bg-white dark:bg-gray-800";
    }

    const iconBadge = item.icon ? (
        <div className={`absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm ${
            item.icon === 'trophy' ? 'bg-yellow-400' : 
            item.icon === 'payment' ? 'bg-green-500' :
            'bg-indigo-500'
        }`}>
            {icons[item.icon]}
        </div>
    ) : null;
    
    const numberIndicator = item.indicator ? (
        <div className={`absolute -bottom-2.5 -left-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-800 shadow-sm ${
            item.indicator.color === 'red' ? 'bg-red-500' : 'bg-green-500'
        }`}>
            {item.indicator.number}
        </div>
    ) : null;

    const connectorLine = !isLast ? (
        <div className="absolute left-full top-1/2 w-24 h-0.5 bg-sky-400"></div>
    ) : null;

    return (
        <div className="relative flex-shrink-0 w-32 flex flex-col items-center">
            <div className="text-center h-14 mb-2 flex flex-col justify-end">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">{item.name}</p>
                {item.subLabel && <p className="text-xs text-gray-500 dark:text-gray-400">{item.subLabel}</p>}
            </div>
            
            <div className="relative">
                <div className={nodeClasses}>
                    {nodeContent}
                    {iconBadge}
                </div>
                {connectorLine}
            </div>
            
             <div className="text-center mt-2 h-10">
                <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1">{item.phase}</p>
             </div>
             {numberIndicator}
        </div>
    );
};


// --- MAIN COMPONENT ---
const ProjectReport = ({ project, setProjects }: { project: Project | null, setProjects: React.Dispatch<React.SetStateAction<Project[]>> }) => {
    const { theme } = useContext(ThemeContext);
    const [imageModal, setImageModal] = useState<string | null>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const riskExportMenuRef = useRef<HTMLDivElement>(null);
    const mainExportMenuRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const milestonesRef = useRef<HTMLDivElement>(null);
    const progressChartRef = useRef<HTMLDivElement>(null);
    const weeklyReportsRef = useRef<HTMLDivElement>(null);
    const risksRef = useRef<HTMLDivElement>(null);
    const risksTableRef = useRef<HTMLTableElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);

    // Dynamic State Management
    const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
    const [risks, setRisks] = useState<Risk[]>(initialRisksData);
    const [gallery, setGallery] = useState<GalleryItem[]>(initialGalleryImages);
    const [scheduleWorms, setScheduleWorms] = useState<ScheduleWormItem[]>([]);

    useEffect(() => {
        setWeeklyReports(recalculateCumulativeProgress(initialWeeklyReportsDataBase as WeeklyReport[]));
    }, []);

    // Form and Table Visibility State
    const [showWeeklyReportForm, setShowWeeklyReportForm] = useState(false);
    const [showRiskForm, setShowRiskForm] = useState(false);
    const [showGalleryForm, setShowGalleryForm] = useState(false);
    const [showWormForm, setShowWormForm] = useState(false);
    const [isPhasesTableVisible, setIsPhasesTableVisible] = useState(true);
    const [isWormTableVisible, setIsWormTableVisible] = useState(false); // Hide by default
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isRiskExportMenuOpen, setIsRiskExportMenuOpen] = useState(false);
    const [isMainExportMenuOpen, setIsMainExportMenuOpen] = useState(false);


    // Form Data State
    const [weeklyForm, setWeeklyForm] = useState<Omit<WeeklyReport, 'id' | 'planProgressCumulative' | 'actualProgressCumulative'>>({ startDate: '', endDate: '', planProgressWeekly: 0, actualProgressWeekly: 0, notes: '' });
    const [editingWeeklyReportId, setEditingWeeklyReportId] = useState<string | null>(null);
    const [reportToAttach, setReportToAttach] = useState<string | null>(null);
    const [reportFilters, setReportFilters] = useState({ month: 'all' });
    const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const initialRiskFormState: Omit<Risk, 'id'> = { weeklyReportId: weeklyReports[0]?.id || '', desc: '', cause: '', impact: '', solution: '', priority: 'Medium', status: 'Monitoring' };
    const [riskForm, setRiskForm] = useState<Omit<Risk, 'id'>>(initialRiskFormState);
    const [editingRiskId, setEditingRiskId] = useState<string | null>(null);


    const [galleryForm, setGalleryForm] = useState<Omit<GalleryItem, 'src'>>({ date: '', type: 'Struktur' });
    const [galleryFile, setGalleryFile] = useState<File | null>(null);
    const [wormForm, setWormForm] = useState<Omit<ScheduleWormItem, 'id'>>({ name: '', date: '', phase: 'Feasibility', status: 'notStarted' });
    const [editingWormId, setEditingWormId] = useState<string | null>(null);
    const [milestonePhaseFilter, setMilestonePhaseFilter] = useState<string>('all');
    const [galleryPhaseFilter, setGalleryPhaseFilter] = useState<string>('all');


    // Project Phases State
    const [localPhases, setLocalPhases] = useState<ProjectPhase[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalPhases(project?.phases ? JSON.parse(JSON.stringify(project.phases)) : []);
        setHasChanges(false);
    }, [project]);
    
    // Visibility State
    const [visibility, setVisibility] = useState<ReportVisibility>(() => {
        const defaultVisibility: ReportVisibility = {};
        Object.keys(allComponentDetails).forEach(key => { defaultVisibility[key] = true; });

        if (!project) return defaultVisibility;

        try {
            const savedVisibilityRaw = localStorage.getItem(`projectReportVisibility_${project.id}`);
            if (savedVisibilityRaw) {
                const savedVisibility = JSON.parse(savedVisibilityRaw);
                if (typeof savedVisibility === 'object' && savedVisibility !== null) {
                    return { ...defaultVisibility, ...savedVisibility };
                }
            }
        } catch (e) {
            console.error("Failed to parse visibility settings.", e);
        }
        
        return defaultVisibility;
    });

     // Effect to sync weekly report progress with main project progress
    useEffect(() => {
        if (!project || weeklyReports.length === 0) return;

        const latestReport = [...weeklyReports].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
        
        const newProgress = Math.min(100, Math.round(latestReport.actualProgressCumulative));

        if (project.progress !== newProgress) {
            setProjects(currentProjects =>
                currentProjects.map(p =>
                    p.id === project.id ? { ...p, progress: newProgress } : p
                )
            );
        }
    }, [weeklyReports, project, setProjects]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (riskExportMenuRef.current && !riskExportMenuRef.current.contains(event.target as Node)) {
                setIsRiskExportMenuOpen(false);
            }
            if (mainExportMenuRef.current && !mainExportMenuRef.current.contains(event.target as Node)) {
                setIsMainExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleVisibilityChange = (id: string, isVisible: boolean) => {
        const newVisibility = { ...visibility, [id]: isVisible };
        setVisibility(newVisibility);
        if (project) {
            localStorage.setItem(`projectReportVisibility_${project.id}`, JSON.stringify(newVisibility));
        }
    };


    const handlePhaseChange = (phaseId: string, field: 'name' | 'color' | 'plan' | 'actual', value: any, subField?: 'start' | 'end') => {
        setLocalPhases(currentPhases =>
            currentPhases.map(phase => {
                if (phase.id === phaseId) {
                    if (subField && (field === 'plan' || field === 'actual')) {
                        return { ...phase, [field]: { ...phase[field], [subField]: value } };
                    }
                    return { ...phase, [field]: value };
                }
                return phase;
            })
        );
        setHasChanges(true);
    };

    const handleAddPhase = () => {
        const newPhase: ProjectPhase = {
            id: `phase-${Date.now()}`,
            name: 'New Phase',
            plan: { start: null, end: null },
            actual: { start: null, end: null },
            color: '#8884d8'
        };
        setLocalPhases(current => [...current, newPhase]);
        setHasChanges(true);
    };

    const handleDeletePhase = (phaseId: string) => {
        setLocalPhases(current => current.filter(p => p.id !== phaseId));
        setHasChanges(true);
    };

    const handleSaveChanges = () => {
        if (!project) return;
        setProjects(currentProjects =>
            currentProjects.map(p =>
                p.id === project.id ? { ...p, phases: localPhases } : p
            )
        );
        setHasChanges(false);
        toast.success('Perubahan fase proyek berhasil disimpan!');
    };
    
    const themeStyles = useMemo(() => ({
        tickColor: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        gridStrokeColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        tooltipBackgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    }), [theme]);

    const commonChartProps = useMemo(() => ({
        contentStyle: { 
            backgroundColor: themeStyles.tooltipBackgroundColor, 
            border: `1px solid ${themeStyles.gridStrokeColor}`, 
            borderRadius: '0.5rem', 
            fontSize: '12px' 
        }, 
        axisTick: { fill: themeStyles.tickColor, fontSize: 12 }
    }), [themeStyles]);
    
    const allDates = useMemo(() => {
        return localPhases.flatMap(p => [
            p.plan.start, p.plan.end, 
            p.actual.start, p.actual.end
        ]).filter((d): d is string => d !== null);
    }, [localPhases]);

    const overallStart = useMemo(() => {
        if (allDates.length === 0) return new Date().getTime();
        return Math.min(...allDates.map(d => new Date(d).getTime()));
    }, [allDates]);

    const projectDuration = useMemo(() => {
        if (allDates.length === 0) return 0;
        const end = Math.max(...allDates.map(d => new Date(d).getTime()));
        return end - overallStart;
    }, [allDates, overallStart]);
    
    const today = useMemo(() => new Date('2025-04-15'), []);

    const todayPosition = useMemo(() => {
        if (projectDuration === 0) return 0;
        return ((today.getTime() - overallStart) / projectDuration) * 100;
    }, [projectDuration, overallStart, today]);

    const monthMarkers = useMemo(() => {
        if (projectDuration <= 0) return [];
        const markers = [];
        let currentDate = new Date(overallStart);
        currentDate.setDate(1); 

        const endDate = new Date(overallStart + projectDuration);

        while (currentDate <= endDate) {
            const position = ((currentDate.getTime() - overallStart) / projectDuration) * 100;
            if (position >= 0 && position <= 100) {
                 markers.push({
                    date: new Date(currentDate),
                    label: currentDate.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }).replace(' ', '\''),
                    position: position
                });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return markers;
    }, [overallStart, projectDuration]);

    const getActivePhaseForDate = useCallback((dateStr: string, phases: ProjectPhase[]): ProjectPhase | null => {
        if (!dateStr || !phases || phases.length === 0) return null;
        const targetDate = new Date(dateStr).getTime();
        for (const phase of phases) {
            const start = phase.plan.start ? new Date(phase.plan.start).getTime() : -Infinity;
            const end = phase.plan.end ? new Date(phase.plan.end).getTime() : Infinity;
            if (targetDate >= start && targetDate <= end) {
                return phase;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        if (project?.phases && project.phases.length > 0) {
            const updatedWorms = initialScheduleWormData.map(worm => {
                const matchingPhase = getActivePhaseForDate(worm.date, project.phases as ProjectPhase[]);
                return {
                    ...worm,
                    phase: matchingPhase ? matchingPhase.name : worm.phase,
                };
            });
            setScheduleWorms(updatedWorms);
        } else {
            setScheduleWorms(initialScheduleWormData);
        }
    }, [project, getActivePhaseForDate]);
    
    // --- Data Handlers ---
    const handleOpenAddReportForm = () => {
        setEditingWeeklyReportId(null);
        setWeeklyForm({ startDate: '', endDate: '', planProgressWeekly: 0, actualProgressWeekly: 0, notes: '' });
        setShowWeeklyReportForm(true);
    };

    const handleEditWeeklyReport = (report: WeeklyReport) => {
        setEditingWeeklyReportId(report.id);
        setWeeklyForm({
            startDate: report.startDate,
            endDate: report.endDate,
            planProgressWeekly: report.planProgressWeekly,
            actualProgressWeekly: report.actualProgressWeekly,
            notes: report.notes
        });
        setShowWeeklyReportForm(true);
    };

    const handleCancelReportForm = () => {
        setShowWeeklyReportForm(false);
        setEditingWeeklyReportId(null);
    };

    const handleWeeklyReportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { startDate, endDate, notes, planProgressWeekly, actualProgressWeekly } = weeklyForm;
        if (!startDate || !endDate || !notes) {
            toast.error("Periode tanggal dan keterangan wajib diisi.");
            return;
        }

        let updatedReports;
        if (editingWeeklyReportId) {
            updatedReports = weeklyReports.map(r => 
                r.id === editingWeeklyReportId 
                ? { ...r, startDate, endDate, notes, planProgressWeekly, actualProgressWeekly } 
                : r
            );
            toast.success("Laporan mingguan diperbarui!");
        } else {
            const newReport: Omit<WeeklyReport, 'planProgressCumulative' | 'actualProgressCumulative'> = {
                id: `wr-${Date.now()}`,
                startDate,
                endDate,
                notes,
                planProgressWeekly,
                actualProgressWeekly,
            };
            updatedReports = [...weeklyReports, newReport as WeeklyReport];
            toast.success("Laporan mingguan ditambahkan!");
        }

        setWeeklyReports(recalculateCumulativeProgress(updatedReports));
        setShowWeeklyReportForm(false);
        setEditingWeeklyReportId(null);
    };

    const handleDeleteWeeklyReport = (id: string) => {
        const updatedReports = weeklyReports.filter((r) => r.id !== id);
        setWeeklyReports(recalculateCumulativeProgress(updatedReports));
        toast.success("Laporan mingguan dihapus.");
    };

    const handleUploadClick = (reportId: string) => {
        setReportToAttach(reportId);
        attachmentInputRef.current?.click();
    };

    const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && reportToAttach) {
            const url = URL.createObjectURL(file);
            const attachment = { name: file.name, url };
            
            const updatedReports = weeklyReports.map(r => 
                r.id === reportToAttach ? { ...r, attachment } : r
            );
            setWeeklyReports(updatedReports);
            toast.success(`Lampiran "${file.name}" ditambahkan.`);
        }
        setReportToAttach(null);
        if (event.target) event.target.value = '';
    };

    const uniqueReportMonths = useMemo(() => ['all', ...Array.from(new Set(weeklyReports.map(r => new Date(r.startDate).toLocaleDateString('id-ID', { month: 'long' }))))], [weeklyReports]);
    
    const handleReportSortToggle = () => {
        setReportSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const filteredWeeklyReports = useMemo(() => {
        return weeklyReports.filter(r => {
            const reportMonth = new Date(r.startDate).toLocaleDateString('id-ID', { month: 'long' });
            const matchesMonth = reportFilters.month === 'all' || reportMonth === reportFilters.month;
            return matchesMonth;
        }).sort((a,b) => {
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            if (reportSortOrder === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    }, [weeklyReports, reportFilters, reportSortOrder]);

    const handleExportWeeklyReportPdf = () => {
        if (!project) return;
        const doc = new jsPDF();
        doc.text(`Laporan Mingguan - ${project.name}`, 14, 15);
        
        const head = [['Periode', 'Fase', 'Rencana (%)', 'Aktual (%)', 'Deviasi (%)', 'Keterangan']];
        const body = filteredWeeklyReports.map(row => {
            const weeklyDeviation = row.actualProgressWeekly - row.planProgressWeekly;
            const cumulativeDeviation = row.actualProgressCumulative - row.planProgressCumulative;
            const formatPeriod = (start: string, end: string) => `${new Date(start).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} - ${new Date(end).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`;
            const activePhase = getActivePhaseForDate(row.startDate, localPhases);

            return [
                formatPeriod(row.startDate, row.endDate),
                activePhase ? activePhase.name : 'N/A',
                `Mingguan: ${row.planProgressWeekly.toFixed(2)}\nKumulatif: ${row.planProgressCumulative.toFixed(2)}`,
                `Mingguan: ${row.actualProgressWeekly.toFixed(2)}\nKumulatif: ${row.actualProgressCumulative.toFixed(2)}`,
                `Mingguan: ${weeklyDeviation.toFixed(2)}\nKumulatif: ${cumulativeDeviation.toFixed(2)}`,
                row.notes
            ];
        });
    
        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid'
        });
        
        doc.save(`laporan_mingguan_${project.id}.pdf`);
        toast.success('Laporan diekspor ke PDF!');
        setIsExportMenuOpen(false);
    };

    const handleExportWeeklyReportXlsx = () => {
        if (!project) return;
        const dataToExport = filteredWeeklyReports.map(row => {
            const weeklyDeviation = row.actualProgressWeekly - row.planProgressWeekly;
            const cumulativeDeviation = row.actualProgressCumulative - row.planProgressCumulative;
            const formatPeriod = (start: string, end: string) => `${new Date(start).toLocaleDateString('id-ID')} - ${new Date(end).toLocaleDateString('id-ID')}`;
            const activePhase = getActivePhaseForDate(row.startDate, localPhases);
    
            return {
                'Periode': formatPeriod(row.startDate, row.endDate),
                'Fase': activePhase ? activePhase.name : 'N/A',
                'Rencana Mingguan (%)': row.planProgressWeekly,
                'Rencana Kumulatif (%)': row.planProgressCumulative,
                'Aktual Mingguan (%)': row.actualProgressWeekly,
                'Aktual Kumulatif (%)': row.actualProgressCumulative,
                'Deviasi Mingguan (%)': weeklyDeviation,
                'Deviasi Kumulatif (%)': cumulativeDeviation,
                'Keterangan': row.notes,
                'Lampiran': row.attachment?.name || ''
            };
        });
    
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Mingguan");
        XLSX.writeFile(wb, `laporan_mingguan_${project.id}.xlsx`);
        toast.success('Laporan diekspor ke Excel!');
        setIsExportMenuOpen(false);
    };

    const handleOpenAddRiskForm = () => {
        setEditingRiskId(null);
        setRiskForm(initialRiskFormState);
        setShowRiskForm(true);
    };

    const handleEditRisk = (risk: Risk) => {
        setEditingRiskId(risk.id);
        setRiskForm(risk);
        setShowRiskForm(true);
    };
    
    const handleRiskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!riskForm.desc || !riskForm.impact || !riskForm.weeklyReportId || !riskForm.solution) { 
            toast.error("Periode, Deskripsi, Dampak, dan Solusi wajib diisi."); 
            return; 
        }

        if (editingRiskId) {
            setRisks(prev => prev.map(r => r.id === editingRiskId ? { ...riskForm, id: editingRiskId } : r));
            toast.success("Risiko diperbarui!");
        } else {
            setRisks(prev => [{ ...riskForm, id: `risk-${Date.now()}` }, ...prev]);
            toast.success("Risiko baru ditambahkan!");
        }
        
        setShowRiskForm(false);
        setEditingRiskId(null);
        setRiskForm(initialRiskFormState);
    };

    const handleDeleteRisk = (id: string) => { setRisks(prev => prev.filter((r) => r.id !== id)); toast.success("Risiko dihapus."); };
    
    const handleExportRiskPdf = () => {
        if (!project) return;
        const doc = new jsPDF();
        doc.text(`Kendala & Risiko - ${project.name}`, 14, 15);
        
        const head = [['TANGGAL', 'DESKRIPSI', 'PENYEBAB', 'DAMPAK', 'SOLUSI', 'PRIORITAS', 'STATUS']];
        const body = risks.map(row => {
            const report = weeklyReports.find(r => r.id === row.weeklyReportId);
            const reportDate = report ? new Date(report.startDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A';
            const weekNumber = report ? `Minggu ke-${weeklyReports.findIndex(r => r.id === report.id) + 1}` : '';
            const fullDate = `${reportDate}\n${weekNumber}`;

            return [
                fullDate,
                row.desc,
                row.cause,
                row.impact,
                row.solution,
                row.priority,
                row.status
            ];
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid'
        });
        
        doc.save(`risiko_${project.id}.pdf`);
        toast.success('Daftar Risiko diekspor ke PDF!');
        setIsRiskExportMenuOpen(false);
    };

    const handleExportRiskXlsx = () => {
        if (!project) return;
        const dataToExport = risks.map(row => {
            const report = weeklyReports.find(r => r.id === row.weeklyReportId);
            const reportDate = report ? new Date(report.startDate).toLocaleDateString('id-ID') : 'N/A';
            const weekNumber = report ? weeklyReports.findIndex(r => r.id === report.id) + 1 : 'N/A';

            return {
                'Tanggal Laporan': reportDate,
                'Minggu Ke': weekNumber,
                'Deskripsi Masalah': row.desc,
                'Penyebab': row.cause,
                'Dampak': row.impact,
                'Solusi': row.solution,
                'Prioritas': row.priority,
                'Status': row.status,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kendala & Risiko");
        XLSX.writeFile(wb, `risiko_${project.id}.xlsx`);
        toast.success('Daftar Risiko diekspor ke Excel!');
        setIsRiskExportMenuOpen(false);
    };

    const handleRiskTableScreenshot = async () => {
        if (!risksTableRef.current) {
            toast.error("Tabel tidak ditemukan untuk di-screenshot.");
            return;
        }

        const toastId = toast.loading('Membuat screenshot tabel risiko...');

        const clonedTable = risksTableRef.current.cloneNode(true) as HTMLTableElement;

        const headerRow = clonedTable.querySelector('thead tr');
        if (headerRow && headerRow.lastChild) {
            headerRow.removeChild(headerRow.lastChild);
        }

        const bodyRows = clonedTable.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            if (row.lastChild) {
                row.removeChild(row.lastChild);
            }
        });

        const tempContainer = document.createElement('div');
        Object.assign(tempContainer.style, {
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            padding: '1rem',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            display: 'inline-block'
        });
        
        if (theme === 'dark') {
            tempContainer.classList.add('dark');
        }

        tempContainer.appendChild(clonedTable);
        document.body.appendChild(tempContainer);

        try {
            const canvas = await html2canvas(tempContainer, {
                useCORS: true,
                scale: 2,
            });
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, 'tabel_kendala_risiko.png');
                    toast.success('Screenshot tabel berhasil disimpan!', { id: toastId });
                } else {
                    toast.error('Gagal membuat file screenshot.', { id: toastId });
                }
            });
        } catch (error) {
            console.error("Gagal mengambil screenshot tabel:", error);
            toast.error('Gagal mengambil screenshot.', { id: toastId });
        } finally {
            document.body.removeChild(tempContainer);
        }
    };

    const handleAddGalleryItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!galleryForm.date || !galleryForm.type) {
            toast.error("Tanggal dan Tipe wajib diisi.");
            return;
        }
        if (!galleryFile) {
            toast.error("Silakan pilih file gambar untuk diupload.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newImageSrc = reader.result as string;
            setGallery(prev => [{ ...galleryForm, src: newImageSrc }, ...prev]);
            setGalleryForm({ date: '', type: 'Struktur' });
            setGalleryFile(null);
            setShowGalleryForm(false);
            toast.success("Foto baru berhasil ditambahkan!");
        };
        reader.readAsDataURL(galleryFile);
    };
    const handleDeleteGalleryItem = (index: number) => { setGallery(prev => prev.filter((_, i) => i !== index)); toast.success("Foto dihapus."); };
    
    const filteredGallery = useMemo(() => {
        if (galleryPhaseFilter === 'all') return gallery;
        return gallery.filter(item => {
            const phase = getActivePhaseForDate(item.date, localPhases);
            return phase?.name === galleryPhaseFilter;
        });
    }, [gallery, galleryPhaseFilter, getActivePhaseForDate, localPhases]);


    const handleEditWorm = (worm: ScheduleWormItem) => {
        setEditingWormId(worm.id);
        setWormForm(worm);
        setShowWormForm(true);
    };

    const handleWormFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wormForm.name || !wormForm.date) {
            toast.error('Nama milestone dan tanggal wajib diisi.');
            return;
        }
        if (editingWormId) {
            setScheduleWorms(worms => worms.map(w => w.id === editingWormId ? { ...wormForm, id: editingWormId } : w));
            toast.success('Milestone diperbarui.');
        } else {
            setScheduleWorms(worms => [...worms, { ...wormForm, id: `sw-${Date.now()}` }]);
            toast.success('Milestone baru ditambahkan.');
        }
        setShowWormForm(false);
        setEditingWormId(null);
        setWormForm({ name: '', date: '', phase: localPhases[0]?.name || 'Feasibility', status: 'notStarted' });
    };

    const handleDeleteWorm = (id: string) => {
        setScheduleWorms(worms => worms.filter(w => w.id !== id));
        toast.success('Milestone dihapus.');
    };

    const toggleWormForm = () => {
        const isOpening = !showWormForm;
        setShowWormForm(isOpening);
        if (isOpening) {
            setEditingWormId(null);
            setWormForm({ name: '', date: '', phase: localPhases[0]?.name || 'Feasibility', status: 'notStarted' });
        }
    };

    const sortedWorms = useMemo(() => 
        [...scheduleWorms]
        .filter(worm => milestonePhaseFilter === 'all' || worm.phase === milestonePhaseFilter)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [scheduleWorms, milestonePhaseFilter]);

    const phaseOptions = useMemo(() => localPhases.map(p => p.name), [localPhases]);

     // --- DYNAMIC STATISTICS ---
    const timeVariance = useMemo(() => {
        if (!project?.phases) return { value: 'N/A', target: 'Data fase tidak ada', colorClass: '#64748B' };
        const completedPhases = localPhases.filter(p => p.actual.end && p.plan.end);
        if (completedPhases.length === 0) return { value: '0 Hari', target: 'Belum ada fase selesai', colorClass: '#22C55E' };
        
        const lastCompletedPhase = completedPhases.sort((a,b) => new Date(b.actual.end!).getTime() - new Date(a.actual.end!).getTime())[0];

        const planEnd = new Date(lastCompletedPhase.plan.end!).getTime();
        const actualEnd = new Date(lastCompletedPhase.actual.end!).getTime();

        const diffDays = Math.round((actualEnd - planEnd) / (1000 * 60 * 60 * 24));

        if (diffDays > 5) return { value: `+${diffDays} Hari`, target: 'Terlambat dari jadwal', colorClass: '#EF4444' };
        if (diffDays > 0) return { value: `+${diffDays} Hari`, target: 'Agak terlambat', colorClass: '#F59E0B' };
        if (diffDays < 0) return { value: `${diffDays} Hari`, target: 'Lebih cepat dari jadwal', colorClass: '#22C55E' };
        return { value: 'Tepat Waktu', target: 'Sesuai jadwal', colorClass: '#22C55E' };
    }, [localPhases, project]);

    const riskLevel = useMemo(() => {
        const activeRisks = risks.filter(r => r.status !== 'Selesai');
        const highPriorityCount = activeRisks.filter(r => r.priority === 'High').length;
        if (highPriorityCount > 0) return { text: 'High', target: `${highPriorityCount} Isu Prioritas Tinggi`, colorClass: '#EF4444' };
        
        const mediumPriorityCount = activeRisks.filter(r => r.priority === 'Medium').length;
        if (mediumPriorityCount > 0) return { text: 'Medium', target: `${mediumPriorityCount} Isu Prioritas Sedang`, colorClass: '#F59E0B' };
        
        return { text: 'Low', target: `${activeRisks.length} Isu Aktif`, colorClass: '#22C55E' };
    }, [risks]);
    
    if (!project) return null;

    const orderedComponents = Object.keys(allComponentDetails);

     // --- FULL REPORT EXPORT ---
    const exportableComponents = useMemo(() => [
        { id: 'stats', ref: statsRef, name: 'Statistik Utama' },
        { id: 'timeline', ref: timelineRef, name: 'Fase & Linimasa Proyek' },
        { id: 'milestones', ref: milestonesRef, name: 'Milestone & Jadwal' },
        { id: 'progressChart', ref: progressChartRef, name: 'Grafik Progres Mingguan' },
        { id: 'weeklyReports', ref: weeklyReportsRef, name: 'Laporan Mingguan' },
        { id: 'risks', ref: risksRef, name: 'Kendala & Risiko' },
        { id: 'gallery', ref: galleryRef, name: 'Dokumentasi Lapangan' },
    ], []);

    const handleExportFullPdf = async () => {
        const toastId = toast.loading('Membuat laporan PDF...');
        const doc = new jsPDF('p', 'mm', 'a4');
        const a4Width = 210;
        const margin = 10;
        const contentWidth = a4Width - margin * 2;
        let isFirstPage = true;

        for (const id of orderedComponents) {
            if (visibility[id]) {
                const componentInfo = exportableComponents.find(c => c.id === id);
                if (componentInfo && componentInfo.ref.current) {
                    try {
                        const canvas = await html2canvas(componentInfo.ref.current, { scale: 2, useCORS: true, backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff' });
                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = doc.getImageProperties(imgData);
                        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

                        if (!isFirstPage) doc.addPage();
                        
                        doc.setFontSize(14);
                        doc.setTextColor(40, 40, 40);
                        doc.text(componentInfo.name, margin, margin + 5);
                        doc.addImage(imgData, 'PNG', margin, margin + 10, contentWidth, imgHeight);
                        isFirstPage = false;
                    } catch (error) {
                        console.error(`Gagal membuat canvas untuk: ${componentInfo.name}`, error);
                    }
                }
            }
        }
        doc.save(`Laporan_Lengkap_${project.id}.pdf`);
        toast.success('Laporan PDF berhasil dibuat!', { id: toastId });
        setIsMainExportMenuOpen(false);
    };

    const handleExportFullXlsx = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Phases
        const phasesData = localPhases.map(p => ({ 'Nama Fase': p.name, 'Mulai Rencana': p.plan.start, 'Selesai Rencana': p.plan.end, 'Mulai Aktual': p.actual.start, 'Selesai Aktual': p.actual.end }));
        const wsPhases = XLSX.utils.json_to_sheet(phasesData);
        XLSX.utils.book_append_sheet(wb, wsPhases, 'Fase Proyek');

        // Sheet 2: Milestones
        const milestonesData = sortedWorms.map(m => ({ 'Milestone': m.name, 'Fase': m.phase, 'Tanggal': m.date, 'Status': m.status }));
        const wsMilestones = XLSX.utils.json_to_sheet(milestonesData);
        XLSX.utils.book_append_sheet(wb, wsMilestones, 'Milestones');

        // Sheet 3: Weekly Reports
        handleExportWeeklyReportXlsx(); // This exports separately, let's integrate it.
        const weeklyReportsData = filteredWeeklyReports.map(row => {
            const weeklyDeviation = row.actualProgressWeekly - row.planProgressWeekly;
            const cumulativeDeviation = row.actualProgressCumulative - row.planProgressCumulative;
            return {
                'Periode Mulai': row.startDate, 'Periode Selesai': row.endDate, 'Rencana Mingguan (%)': row.planProgressWeekly, 'Aktual Mingguan (%)': row.actualProgressWeekly, 'Deviasi Mingguan (%)': weeklyDeviation, 'Rencana Kumulatif (%)': row.planProgressCumulative, 'Aktual Kumulatif (%)': row.actualProgressCumulative, 'Deviasi Kumulatif (%)': cumulativeDeviation, 'Keterangan': row.notes
            };
        });
        const wsWeekly = XLSX.utils.json_to_sheet(weeklyReportsData);
        XLSX.utils.book_append_sheet(wb, wsWeekly, 'Laporan Mingguan');


        // Sheet 4: Risks
        const risksData = risks.map(r => {
             const report = weeklyReports.find(rep => rep.id === r.weeklyReportId);
             const reportLabel = report ? `${report.startDate} - ${report.endDate}` : 'N/A';
            return {'Terkait Laporan': reportLabel, 'Deskripsi': r.desc, 'Penyebab': r.cause, 'Dampak': r.impact, 'Solusi': r.solution, 'Prioritas': r.priority, 'Status': r.status };
        });
        const wsRisks = XLSX.utils.json_to_sheet(risksData);
        XLSX.utils.book_append_sheet(wb, wsRisks, 'Kendala & Risiko');
        
        XLSX.writeFile(wb, `Laporan_Lengkap_${project.id}.xlsx`);
        toast.success('Laporan Excel berhasil dibuat!');
        setIsMainExportMenuOpen(false);
    };

    
    const componentsMap = useMemo(() => ({
        header: {
            id: 'header',
            component: (
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-wrap justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Laporan Proyek: {project.name}</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={settingsRef}>
                            <button onClick={() => setIsSettingsOpen(p => !p)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">
                                <Settings size={16} />
                                <span>Kelola Tampilan</span>
                            </button>
                            {isSettingsOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 p-4 animate-fade-in-up-fast">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Tampilkan/Sembunyikan Kartu</h4>
                                    <div className="space-y-2">
                                        {Object.entries(allComponentDetails).map(([key, { name }]) => (
                                            <label key={key} className="flex items-center text-sm space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={!!visibility[key]}
                                                    onChange={(e) => handleVisibilityChange(key, e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-honda-red focus:ring-honda-red dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <span>{name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={mainExportMenuRef}>
                            <button onClick={() => setIsMainExportMenuOpen(p => !p)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                                <Download size={16} /> Export Laporan <ChevronDown size={16} />
                            </button>
                             {isMainExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-10 animate-fade-in-up-fast">
                                    <button onClick={handleExportFullPdf} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Export ke PDF</button>
                                    <button onClick={handleExportFullXlsx} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Export ke Excel</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        stats: {
            id: 'stats',
            component: (
                <div ref={statsRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <BarChart size={20} />
                            Statistik Utama
                        </h3>
                        <button onClick={() => handleScreenshot(statsRef, 'statistik_utama.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                            <Camera size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <ReportStatCard icon={<TrendingUp size={20} className="text-gray-400" />} title="Progress Fisik" value={`${project.progress}%`} target={`vs ${weeklyReports.length > 0 ? weeklyReports[weeklyReports.length - 1].planProgressCumulative.toFixed(0) : '0'}% Target`} colorClass="#3B82F6" />
                        <ReportStatCard icon={<DollarSign size={20} className="text-gray-400" />} title="Progress Keuangan" value={`${project.progress}%`} target="vs Rencana Keuangan" colorClass="#10B981" />
                        <ReportStatCard icon={<Clock size={20} className="text-gray-400" />} title="Variance Waktu" value={timeVariance.value} target={timeVariance.target} colorClass={timeVariance.colorClass} />
                        <ReportStatCard icon={<DollarSign size={20} className="text-gray-400" />} title="Variance Biaya" value="N/A" target="Data belum tersedia" colorClass="#64748B" />
                        <ReportStatCard icon={<ShieldAlert size={20} className="text-gray-400" />} title="Risk Level" value={riskLevel.text} target={riskLevel.target} colorClass={riskLevel.colorClass} />
                    </div>
                </div>
            )
        },
        timeline: {
            id: 'timeline',
            component: (
                <div ref={timelineRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Project Phases & Timeline</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsPhasesTableVisible(p => !p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                                {isPhasesTableVisible ? 'Sembunyikan' : 'Tampilkan'} Tabel
                                <ChevronDown size={14} className={`transition-transform ${isPhasesTableVisible ? 'rotate-180' : ''}`} />
                            </button>
                             <button onClick={() => handleScreenshot(timelineRef, 'timeline_proyek.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                                <Camera size={16} />
                            </button>
                            <button onClick={handleAddPhase} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-honda-red rounded-md hover:bg-red-700 transition shadow">
                                <Plus size={14} /> Tambah Fase
                            </button>
                            {hasChanges && (
                                <button onClick={handleSaveChanges} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition shadow animate-pulse">
                                    <Save size={14} /> Simpan Perubahan
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPhasesTableVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-2 py-2 w-1/4">Nama Fase</th><th className="px-2 py-2">Mulai Rencana</th><th className="px-2 py-2">Selesai Rencana</th><th className="px-2 py-2">Mulai Aktual</th><th className="px-2 py-2">Selesai Aktual</th><th className="px-2 py-2 w-16">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localPhases.map(phase => (
                                        <tr key={phase.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                            <td className="px-2 py-1"><input type="text" value={phase.name} onChange={e => handlePhaseChange(phase.id, 'name', e.target.value)} className="w-full bg-transparent p-1 rounded-md focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-honda-red outline-none"/></td>
                                            <td className="px-2 py-1"><input type="date" value={phase.plan.start || ''} onChange={e => handlePhaseChange(phase.id, 'plan', e.target.value, 'start')} className="w-full bg-transparent p-1 rounded-md focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-honda-red outline-none"/></td>
                                            <td className="px-2 py-1"><input type="date" value={phase.plan.end || ''} onChange={e => handlePhaseChange(phase.id, 'plan', e.target.value, 'end')} className="w-full bg-transparent p-1 rounded-md focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-honda-red outline-none"/></td>
                                            <td className="px-2 py-1"><input type="date" value={phase.actual.start || ''} onChange={e => handlePhaseChange(phase.id, 'actual', e.target.value, 'start')} className="w-full bg-transparent p-1 rounded-md focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-honda-red outline-none"/></td>
                                            <td className="px-2 py-1"><input type="date" value={phase.actual.end || ''} onChange={e => handlePhaseChange(phase.id, 'actual', e.target.value, 'end')} className="w-full bg-transparent p-1 rounded-md focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-honda-red outline-none"/></td>
                                            <td className="px-2 py-1 text-center"><button onClick={() => handleDeletePhase(phase.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full"><Trash2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     <div className="w-full h-40 relative pt-10 mt-4">
                        {projectDuration > 0 ? (
                            <>
                                <div className="absolute w-full h-[calc(100%-5rem)] top-8">
                                    {monthMarkers.map(marker => (
                                        <div key={marker.label} className="absolute h-full" style={{ left: `${marker.position}%`}}>
                                            <div className="w-px h-full bg-gray-200 dark:bg-gray-700/50"></div>
                                            <span className="absolute top-full mt-1 transform -translate-x-1/2 text-[10px] text-gray-400 dark:text-gray-500">
                                                {marker.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute w-full top-10 space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Plan</div>
                                        <div className="relative h-6 flex-1">
                                            {localPhases.map(phase => {
                                                if (!phase.plan.start || !phase.plan.end) return null;
                                                const left = ((new Date(phase.plan.start).getTime() - overallStart) / projectDuration) * 100;
                                                const width = ((new Date(phase.plan.end).getTime() - new Date(phase.plan.start).getTime()) / projectDuration) * 100;
                                                return (
                                                    <div key={`${phase.id}-plan`} 
                                                        className="absolute h-full rounded-sm flex items-center px-2 border" 
                                                        style={{ left: `${left}%`, width: `${width}%`, borderColor: phase.color, backgroundColor: `${phase.color}20` }}
                                                        title={`${phase.name} (Plan)`}
                                                    >
                                                        <span className="text-xs font-semibold truncate" style={{color: phase.color}}>{phase.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Actual</div>
                                        <div className="relative h-6 flex-1">
                                            {localPhases.map(phase => {
                                                if (!phase.actual.start) return null;
                                                const endDate = phase.actual.end ? new Date(phase.actual.end) : today;
                                                const left = ((new Date(phase.actual.start).getTime() - overallStart) / projectDuration) * 100;
                                                let width = ((endDate.getTime() - new Date(phase.actual.start).getTime()) / projectDuration) * 100;
                                                if (width < 0) width = 0;
                                                return (
                                                    <div key={`${phase.id}-actual`} 
                                                        className="absolute h-full rounded-sm flex items-center px-2" 
                                                        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: phase.color }}
                                                        title={`${phase.name} (Actual)`}
                                                    >
                                                        <span className="text-white text-xs font-semibold truncate">{phase.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {todayPosition > 0 && todayPosition < 100 && (
                                    <div className="absolute top-6 h-32" style={{ left: `${todayPosition}%`}}>
                                        <div className="w-0.5 h-full bg-red-500 animate-pulse-red"></div>
                                        <div className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-red-500">Today</div>
                                    </div>
                                )}
                            </>
                        ) : <p className="text-center text-gray-500 text-sm py-4">Data fase tidak tersedia.</p>}
                    </div>
                </div>
            )
        },
        milestones: {
            id: 'milestones',
            component: (
                <div ref={milestonesRef}>
                    <ChartContainer 
                        title="Milestone & Schedule Worm" 
                        icon={<Calendar size={20}/>} 
                        headerActions={
                            <>
                                <select
                                    value={milestonePhaseFilter}
                                    onChange={e => setMilestonePhaseFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition border-none focus:ring-1 focus:ring-honda-red"
                                >
                                    <option value="all">Semua Fase</option>
                                    {phaseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <button onClick={() => setIsWormTableVisible(p => !p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                                    {isWormTableVisible ? 'Sembunyikan' : 'Tampilkan'} Tabel
                                    <ChevronDown size={14} className={`transition-transform ${isWormTableVisible ? 'rotate-180' : ''}`} />
                                </button>
                                <button onClick={() => handleScreenshot(milestonesRef, 'milestones.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                                    <Camera size={16} />
                                </button>
                                <button onClick={toggleWormForm} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-md hover:bg-red-700 transition shadow ${showWormForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-honda-red'}`}>
                                    {showWormForm ? <XIcon size={14} /> : <Plus size={14} />} {showWormForm ? 'Batal' : 'Tambah'}
                                </button>
                            </>
                        }
                    >
                        <div className="w-full overflow-x-auto overflow-y-hidden py-10 border-y dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 -mx-6 px-6">
                            <div className="inline-flex items-start px-4 min-w-full">
                                {sortedWorms.map((worm, index) => (
                                    <MilestoneNode key={worm.id} item={worm} isLast={index === sortedWorms.length - 1} />
                                ))}
                            </div>
                        </div>

                        {showWormForm && (
                            <form onSubmit={handleWormFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-fade-in-up-fast">
                                <div className="md:col-span-2"><input type="text" placeholder="Nama Milestone" value={wormForm.name} onChange={e => setWormForm({...wormForm, name: e.target.value})} className={inputClasses} /></div>
                                <div><input type="date" value={wormForm.date} onChange={e => setWormForm({...wormForm, date: e.target.value})} className={inputClasses} /></div>
                                <div><select value={wormForm.phase} onChange={e => setWormForm({...wormForm, phase: e.target.value})} className={inputClasses}>{phaseOptions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                <div className="md:col-span-4 flex justify-end gap-2"><button type="submit" className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingWormId ? 'Update' : 'Simpan'}</button></div>
                            </form>
                        )}
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isWormTableVisible ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-2">Milestone</th><th className="px-4 py-2">Fase</th><th className="px-4 py-2">Tanggal</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedWorms.map(worm => (
                                            <tr key={worm.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                <td className="px-4 py-2 font-medium">{worm.name}</td>
                                                <td className="px-4 py-2">{worm.phase}</td>
                                                <td className="px-4 py-2">{new Date(worm.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
                                                <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${worm.status === 'complete' ? 'bg-green-100 text-green-800' : worm.status === 'inProgress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{worm.status}</span></td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleEditWorm(worm)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={14}/></button>
                                                    <button onClick={() => handleDeleteWorm(worm.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </ChartContainer>
                </div>
            )
        },
        progressChart: {
            id: 'progressChart',
            component: (
                <div ref={progressChartRef}>
                    <ChartContainer title="Grafik Progress Kumulatif" icon={<LineChartIcon size={20}/>} headerActions={
                         <button onClick={() => handleScreenshot(progressChartRef, 'grafik_progres.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                            <Camera size={16} />
                        </button>
                    }>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsLineChart data={weeklyReports} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridStrokeColor}/>
                                <XAxis dataKey="endDate" tickFormatter={(tick) => new Date(tick).toLocaleDateString('id-ID', { month:'short', day:'2-digit' })} {...commonChartProps.axisTick} />
                                <YAxis unit="%" {...commonChartProps.axisTick}/>
                                <Tooltip
                                    {...commonChartProps}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                                    formatter={(value, name) => [`${(value as number).toFixed(2)}%`, name]}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="planProgressCumulative" name="Rencana" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="actualProgressCumulative" name="Aktual" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                            </RechartsLineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            )
        },
        weeklyReports: {
            id: 'weeklyReports',
            component: (
                <div ref={weeklyReportsRef}>
                    <ChartContainer title="Laporan Progress Mingguan" icon={<FileText size={20}/>} headerActions={
                        <>
                            <div className="relative" ref={exportMenuRef}>
                                <button onClick={() => setIsExportMenuOpen(p => !p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                                    <DownloadCloud size={14} /> Export
                                    <ChevronDown size={14} />
                                </button>
                                {isExportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-10 animate-fade-in-up-fast">
                                        <button onClick={handleExportWeeklyReportPdf} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">PDF</button>
                                        <button onClick={handleExportWeeklyReportXlsx} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Excel</button>
                                    </div>
                                )}
                            </div>
                            <select
                                value={reportFilters.month}
                                onChange={(e) => setReportFilters(prev => ({ ...prev, month: e.target.value }))}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition border-none focus:ring-1 focus:ring-honda-red"
                            >
                                {uniqueReportMonths.map(month => <option key={month} value={month}>{month === 'all' ? 'Semua Bulan' : month}</option>)}
                            </select>
                            <button onClick={handleReportSortToggle} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                            Urutkan {reportSortOrder === 'asc' ? <TrendingUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                             <button onClick={() => handleScreenshot(weeklyReportsRef, 'laporan_mingguan.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                                <Camera size={16} />
                            </button>
                            <button onClick={handleOpenAddReportForm} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-honda-red rounded-md hover:bg-red-700 transition shadow">
                                <Plus size={14} /> Tambah Laporan
                            </button>
                        </>
                    }>
                        {showWeeklyReportForm && (
                            <form onSubmit={handleWeeklyReportSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-fade-in-up-fast">
                                <div><label className="text-xs">Tgl Mulai</label><input type="date" value={weeklyForm.startDate} onChange={e => setWeeklyForm({...weeklyForm, startDate: e.target.value})} className={inputClasses}/></div>
                                <div><label className="text-xs">Tgl Selesai</label><input type="date" value={weeklyForm.endDate} onChange={e => setWeeklyForm({...weeklyForm, endDate: e.target.value})} className={inputClasses}/></div>
                                <div><label className="text-xs">Rencana (%)</label><input type="number" step="0.01" value={weeklyForm.planProgressWeekly} onChange={e => setWeeklyForm({...weeklyForm, planProgressWeekly: parseFloat(e.target.value)})} className={inputClasses}/></div>
                                <div><label className="text-xs">Aktual (%)</label><input type="number" step="0.01" value={weeklyForm.actualProgressWeekly} onChange={e => setWeeklyForm({...weeklyForm, actualProgressWeekly: parseFloat(e.target.value)})} className={inputClasses}/></div>
                                <div className="md:col-span-2"><textarea placeholder="Keterangan..." value={weeklyForm.notes} onChange={e => setWeeklyForm({...weeklyForm, notes: e.target.value})} rows={2} className={inputClasses}></textarea></div>
                                <div className="md:col-span-2 flex justify-end gap-2"><button type="submit" className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingWeeklyReportId ? 'Update' : 'Simpan'}</button><button type="button" onClick={handleCancelReportForm} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">Batal</button></div>
                            </form>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2">Periode</th><th className="px-4 py-2">Fase</th><th className="px-4 py-2 text-center">Rencana (%)</th><th className="px-4 py-2 text-center">Aktual (%)</th><th className="px-4 py-2 text-center">Deviasi (%)</th><th className="px-4 py-2">Keterangan</th><th className="px-4 py-2 text-center">Lampiran</th><th className="px-4 py-2 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWeeklyReports.map(row => {
                                        const weeklyDeviation = row.actualProgressWeekly - row.planProgressWeekly;
                                        const cumulativeDeviation = row.actualProgressCumulative - row.planProgressCumulative;
                                        const formatPeriod = (start: string, end: string) => `${new Date(start).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} - ${new Date(end).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`;
                                        const activePhase = getActivePhaseForDate(row.startDate, localPhases);
                                        return (
                                            <tr key={row.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 text-xs">
                                                <td className="px-4 py-2 font-medium">{formatPeriod(row.startDate, row.endDate)}</td>
                                                <td className="px-4 py-2">
                                                    {activePhase ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activePhase.color }}></span>
                                                            {activePhase.name}
                                                        </span>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 text-center">W: {row.planProgressWeekly.toFixed(2)}<br/>C: {row.planProgressCumulative.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-center">W: {row.actualProgressWeekly.toFixed(2)}<br/>C: {row.actualProgressCumulative.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-center"><span className={weeklyDeviation >= 0 ? 'text-green-600' : 'text-red-600'}>W: {weeklyDeviation.toFixed(2)}</span><br/><span className={cumulativeDeviation >= 0 ? 'text-green-600' : 'text-red-600'}>C: {cumulativeDeviation.toFixed(2)}</span></td>
                                                <td className="px-4 py-2 max-w-xs truncate" title={row.notes}>{row.notes}</td>
                                                <td className="px-4 py-2 text-center">
                                                    {row.attachment ? <a href={row.attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[100px]">{row.attachment.name}</a> : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <WeeklyReportActionMenu
                                                        onEdit={() => handleEditWeeklyReport(row)}
                                                        onUpload={() => handleUploadClick(row.id)}
                                                        onDelete={() => handleDeleteWeeklyReport(row.id)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </ChartContainer>
                </div>
            )
        },
        risks: {
            id: 'risks',
            component: (
                <div ref={risksRef}>
                    <ChartContainer title="Kendala & Risiko" icon={<ShieldAlert size={20}/>} headerActions={
                        <>
                            <div className="relative" ref={riskExportMenuRef}>
                                <button onClick={() => setIsRiskExportMenuOpen(p => !p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition">
                                    <DownloadCloud size={14} /> Export
                                    <ChevronDown size={14} />
                                </button>
                                {isRiskExportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-10 animate-fade-in-up-fast">
                                        <button onClick={handleExportRiskPdf} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">PDF</button>
                                        <button onClick={handleExportRiskXlsx} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Excel</button>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleRiskTableScreenshot} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot Tabel">
                                <Camera size={16} />
                            </button>
                            <button onClick={handleOpenAddRiskForm} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-honda-red rounded-md hover:bg-red-700 transition shadow">
                                <Plus size={14} /> Tambah Risiko
                            </button>
                        </>
                    }>
                        {showRiskForm && (
                            <form onSubmit={handleRiskSubmit} className="space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-fade-in-up-fast">
                                <div>
                                <label className="text-xs">Terkait Laporan Minggu</label>
                                <select value={riskForm.weeklyReportId} onChange={e => setRiskForm({...riskForm, weeklyReportId: e.target.value})} className={inputClasses}> 
                                    {weeklyReports.map(r => <option key={r.id} value={r.id}>{`Minggu ${new Date(r.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - ${new Date(r.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}`}</option>)}
                                </select>
                            </div>

                                <div><label className="text-xs">Deskripsi</label><input type="text" placeholder="Deskripsi masalah..." value={riskForm.desc} onChange={e => setRiskForm({...riskForm, desc: e.target.value})} className={inputClasses} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs">Penyebab</label><input type="text" placeholder="Penyebab masalah..." value={riskForm.cause} onChange={e => setRiskForm({...riskForm, cause: e.target.value})} className={inputClasses} /></div>
                                    <div><label className="text-xs">Dampak</label><input type="text" placeholder="Dampak yang ditimbulkan..." value={riskForm.impact} onChange={e => setRiskForm({...riskForm, impact: e.target.value})} className={inputClasses} /></div>
                                </div>
                                <div><label className="text-xs">Solusi</label><textarea placeholder="Rencana mitigasi atau solusi..." value={riskForm.solution} onChange={e => setRiskForm({...riskForm, solution: e.target.value})} rows={2} className={inputClasses}></textarea></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs">Prioritas</label><select value={riskForm.priority} onChange={e => setRiskForm({...riskForm, priority: e.target.value as Risk['priority']})} className={inputClasses}><option>Low</option><option>Medium</option><option>High</option></select></div>
                                    <div><label className="text-xs">Status</label><select value={riskForm.status} onChange={e => setRiskForm({...riskForm, status: e.target.value as Risk['status']})} className={inputClasses}><option>Ditangani</option><option>Monitoring</option><option>Selesai</option></select></div>
                                </div>
                                <div className="flex justify-end gap-2"><button type="submit" className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingRiskId ? 'Update' : 'Simpan'}</button><button type="button" onClick={() => setShowRiskForm(false)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">Batal</button></div>
                            </form>
                        )}
                        <div className="overflow-x-auto">
                            <table ref={risksTableRef} className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2">Terkait Laporan</th><th className="px-4 py-2">Deskripsi</th><th className="px-4 py-2">Dampak</th><th className="px-4 py-2">Solusi</th><th className="px-4 py-2 text-center">Prioritas</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {risks.map(risk => {
                                        const report = weeklyReports.find(r => r.id === risk.weeklyReportId);
                                        const reportLabel = report ? `Minggu ${new Date(report.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - ${new Date(report.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}` : 'N/A';
                                        return (
                                        <tr key={risk.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 text-xs">
                                            <td className="px-4 py-2">{reportLabel}</td>
                                            <td className="px-4 py-2 font-medium max-w-xs truncate" title={risk.desc}>{risk.desc}</td>
                                            <td className="px-4 py-2 max-w-xs truncate" title={risk.impact}>{risk.impact}</td>
                                            <td className="px-4 py-2 max-w-xs truncate" title={risk.solution}>{risk.solution}</td>
                                            <td className="px-4 py-2 text-center"><PriorityBadge priority={risk.priority}/></td>
                                            <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{risk.status}</span></td>
                                            <td className="px-4 py-2 text-center"><button onClick={() => handleEditRisk(risk)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={14}/></button><button onClick={() => handleDeleteRisk(risk.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </ChartContainer>
                </div>
            )
        },
        gallery: {
            id: 'gallery',
            component: (
                <div ref={galleryRef}>
                    <ChartContainer title="Dokumentasi Lapangan" icon={<Camera size={20}/>} headerActions={
                        <>
                             <select
                                value={galleryPhaseFilter}
                                onChange={(e) => setGalleryPhaseFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition border-none focus:ring-1 focus:ring-honda-red"
                            >
                                <option value="all">Semua Fase</option>
                                {phaseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                             <button onClick={() => handleScreenshot(galleryRef, 'dokumentasi_lapangan.png')} className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Ambil Screenshot">
                                <Camera size={16} />
                            </button>
                            <button onClick={() => setShowGalleryForm(p => !p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-honda-red rounded-md hover:bg-red-700 transition shadow"><Plus size={14}/> Tambah Foto</button>
                        </>
                    }>
                        {showGalleryForm && (
                            <form onSubmit={handleAddGalleryItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-fade-in-up-fast">
                                <div>
                                    <label className="text-xs">File Gambar</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setGalleryFile(e.target.files ? e.target.files[0] : null)} 
                                        className={`${inputClasses} p-1 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-honda-red/10 file:text-honda-red hover:file:bg-honda-red/20`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs">Tanggal</label>
                                    <input type="date" value={galleryForm.date} onChange={e => setGalleryForm({...galleryForm, date: e.target.value})} className={inputClasses}/>
                                </div>
                                <div>
                                    <label className="text-xs">Tipe</label>
                                    <input type="text" placeholder="Tipe foto..." value={galleryForm.type} onChange={e => setGalleryForm({...galleryForm, type: e.target.value})} className={inputClasses}/>
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full">Simpan</button>
                                </div>
                            </form>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredGallery.map((img, index) => (
                                <div key={index} className="relative group/gallery overflow-hidden rounded-lg">
                                    <img src={img.src} alt={`Dokumentasi ${index+1}`} className="w-full h-48 object-cover transition-transform duration-300 group-hover/gallery:scale-110"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-3 text-white">
                                        <p className="text-sm font-semibold">{img.type}</p>
                                        <p className="text-xs">{new Date(img.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                                        <button onClick={() => setImageModal(img.src)} className="p-1.5 bg-black/40 rounded-full hover:bg-black/60"><Maximize size={16} className="text-white"/></button>
                                        <button onClick={() => handleDeleteGalleryItem(index)} className="p-1.5 bg-black/40 rounded-full hover:bg-black/60"><Trash2 size={16} className="text-red-400"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                         {filteredGallery.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Tidak ada dokumentasi untuk fase ini.</p>}
                    </ChartContainer>
                </div>
            )
        }
    }), [project, visibility, weeklyReports, risks, gallery, scheduleWorms, localPhases, hasChanges, theme, showWeeklyReportForm, showRiskForm, showGalleryForm, showWormForm, isPhasesTableVisible, isWormTableVisible, isSettingsOpen, isExportMenuOpen, isRiskExportMenuOpen, weeklyForm, editingWeeklyReportId, riskForm, editingRiskId, galleryForm, wormForm, editingWormId, milestonePhaseFilter, reportFilters, reportSortOrder, galleryPhaseFilter, galleryFile, getActivePhaseForDate, timeVariance, riskLevel]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <input type="file" ref={attachmentInputRef} onChange={handleFileAttachment} className="hidden" />
            {imageModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
                    <img src={imageModal} alt="Enlarged view" className="max-w-full max-h-full rounded-lg" />
                    <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full"><XIcon/></button>
                </div>
            )}
            
            {orderedComponents.map(id => {
                const componentInfo = componentsMap[id as keyof typeof componentsMap];
                return (
                    visibility[id] && componentInfo ? (
                        <div key={id}>
                            {componentInfo.component}
                        </div>
                    ) : null
                );
            })}
        </div>
    );
};

export default ProjectReport;
