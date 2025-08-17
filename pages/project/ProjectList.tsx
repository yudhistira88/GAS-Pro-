import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { type Project, type ProjectPhase } from '../../types';
import { Search, Plus, MoreVertical, Pencil, Trash2, Eye, Filter, Save, ArrowUp, ArrowDown, FileDown, Upload, Download, FileText, ChevronDown } from 'lucide-react';
import CreateProjectModal from '../../components/CreateProjectModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';


interface StatusBadgeProps {
    status: Project['status'];
}

const getCurrentPhase = (project: Project): string => {
    if (!project.phases || project.phases.length === 0) {
        return '-';
    }
    if (project.status === 'Completed') {
        return project.phases[project.phases.length - 1]?.name || 'Selesai';
    }
    const inProgressPhase = project.phases.find(p => p.actual.start && !p.actual.end);
    if (inProgressPhase) {
        return inProgressPhase.name;
    }
    if (project.status === 'Not Started') {
         return project.phases[0]?.name || '-';
    }
    const lastCompletedIndex = project.phases.map(p => !!p.actual.end).lastIndexOf(true);
    if (lastCompletedIndex > -1 && lastCompletedIndex + 1 < project.phases.length) {
        return project.phases[lastCompletedIndex + 1].name;
    }
    return project.phases[0]?.name || '-';
};

const getProjectDuration = (project: Project): { start: string | null, end: string | null } => {
    if (!project.phases || project.phases.length === 0) {
        return { start: null, end: null };
    }
    const firstPhase = project.phases[0];
    const lastPhase = project.phases[project.phases.length - 1];
    return {
        start: firstPhase.plan.start,
        end: lastPhase.plan.end,
    };
};


const StatusBadge = ({ status }: StatusBadgeProps) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block tracking-wide";
  const statusClasses = {
    'Completed': "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    'In Progress': "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    'Not Started': "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

interface TeamAvatarsProps {
    team: string[];
}

const TeamAvatars = ({ team }: TeamAvatarsProps) => (
    <div className="flex -space-x-2">
        {team.slice(0, 5).map(member => (
            <div key={member} title={member} className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-200 text-xs">
                {member.substring(0, 2).toUpperCase()}
            </div>
        ))}
        {team.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-gray-800 flex items-center justify-center font-bold text-white text-xs">
                +{team.length - 5}
            </div>
        )}
    </div>
);

interface ProgressBarProps {
    progress: number;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
    let bgColor = 'bg-blue-500';
    if (progress === 100) bgColor = 'bg-green-500';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
        </div>
    );
};

interface ActionMenuProps {
    project: Project;
    onEdit: () => void;
    onDelete: () => void;
}

const ActionMenu = ({ project, onEdit, onDelete }: ActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast">
                    <Link to={`/project/detail/${project.id}`} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={16} className="mr-2"/> Lihat Detail</Link>
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16} className="mr-2"/> Edit</button>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} className="mr-2"/> Hapus</button>
                </div>
            )}
        </div>
    )
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: '2-digit' };
    return date.toLocaleDateString('id-ID', options).replace(/\./g, '');
};

const getTimelineTextForPdf = (project: Project): string => {
    const { start, end } = getProjectDuration(project);
    if (!start || !end) {
        return '-';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return '-';

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let durationText = '';
    if (diffDays > 30) {
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        let diffMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (diffMonths === 0 && diffDays > 0) diffMonths = 1;
        durationText = `${diffMonths} bln`;
    } else {
        durationText = `${diffDays} hari`;
    }

    const startText = formatDateShort(start);
    const endText = formatDateShort(end);

    return `Lama: ${durationText}\n${startText} - ${endText}`;
};

const renderTimeline = (project: Project): React.ReactNode => {
    const { start, end } = getProjectDuration(project);
    if (!start || !end) {
        return '-';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return '-';

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let durationText = '';
    if (diffDays > 30) {
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        let diffMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (diffMonths === 0 && diffDays > 0) diffMonths = 1;
        durationText = `${diffMonths} bln`;
    } else {
        durationText = `${diffDays} hari`;
    }

    const startText = formatDateShort(start);
    const endText = formatDateShort(end);

    return (
        <div>
            <p className="font-semibold">Lama: {durationText}</p>
            <p className="text-gray-500 dark:text-gray-400">{startText} - {endText}</p>
        </div>
    );
};

type SortKey = keyof Project | 'no' | 'phase' | 'startFinish';
type SortOrder = 'asc' | 'desc';

const ProjectRow = React.memo(({ project, index, onEdit, onDelete, onMove, totalRows }: { project: Project, index: number, onEdit: (project: Project) => void, onDelete: (id: string) => void, onMove: (index: number, direction: 'up' | 'down') => void, totalRows: number }) => {
    const currentPhase = getCurrentPhase(project);
    return (
        <tr className="group bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td className="px-2 py-2 text-center text-xs">
                <div className="flex items-center justify-center gap-x-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-6">{index + 1}</span>
                    <div className="flex flex-col">
                        <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-honda-red disabled:opacity-20 disabled:cursor-not-allowed p-0.5">
                            <ArrowUp size={14} />
                        </button>
                        <button onClick={() => onMove(index, 'down')} disabled={index === totalRows - 1} className="text-gray-400 hover:text-honda-red disabled:opacity-20 disabled:cursor-not-allowed p-0.5">
                            <ArrowDown size={14} />
                        </button>
                    </div>
                </div>
            </td>
            <th scope="row" className="px-4 py-2 text-xs font-medium text-gray-900 dark:text-white">
                <Link to={`/project/detail/${project.id}`} className="hover:text-honda-red hover:underline transition-colors">
                    {project.name}
                </Link>
            </th>
            <td className="px-4 py-2 text-xs">{project.group || '-'}</td>
            <td className="px-4 py-2 text-xs">
                <TeamAvatars team={project.team} />
            </td>
            <td className="px-4 py-2 text-xs">{currentPhase}</td>
            <td className="px-4 py-2 text-xs">
                <div className="flex items-center gap-2">
                    <ProgressBar progress={project.progress} />
                    <span className="font-medium text-gray-600 dark:text-gray-300 w-10 text-right">{project.progress}%</span>
                </div>
            </td>
            <td className="px-4 py-2 text-xs text-center">{formatDate(project.dueDate)}</td>
            <td className="px-4 py-2 text-xs text-center">
                <StatusBadge status={project.status} />
            </td>
            <td className="px-4 py-2 text-xs">
                {currentPhase.toLowerCase().includes('construction') ? (
                    <div className="flex items-center gap-2">
                        <ProgressBar progress={project.progress} />
                        <span className="font-medium text-gray-600 dark:text-gray-300 w-10 text-right">{project.progress}%</span>
                    </div>
                ) : (
                    <div className="text-center">-</div>
                )}
            </td>
            <td className="px-4 py-2 text-xs">
                 {renderTimeline(project)}
            </td>
            <td className="px-4 py-2 text-xs text-center">
                <ActionMenu
                    project={project}
                    onEdit={() => onEdit(project)}
                    onDelete={() => onDelete(project.id)}
                />
            </td>
        </tr>
    );
});


interface ProjectDataContext {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectList = () => {
    const { projects, setProjects } = useOutletContext<ProjectDataContext>();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const [localProjectData, setLocalProjectData] = useState<Project[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder } | null>(null);
    const [isOrderChanged, setIsOrderChanged] = useState(false);
    const [isFileActionsOpen, setIsFileActionsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileActionsMenuRef = useRef<HTMLDivElement>(null);

    
    useEffect(() => {
        setLocalProjectData(projects);
        setIsOrderChanged(false);
    }, [projects]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileActionsMenuRef.current && !fileActionsMenuRef.current.contains(event.target as Node)) {
                setIsFileActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedAndFilteredData = useMemo(() => {
        let data = [...localProjectData];
        
        data = data.filter(project =>
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.team.join(', ').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.group && project.group.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (sortConfig) {
            data.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'phase') {
                    aValue = getCurrentPhase(a);
                    bValue = getCurrentPhase(b);
                } else if (sortConfig.key === 'startFinish') {
                    aValue = getProjectDuration(a).start;
                    bValue = getProjectDuration(b).start;
                } else {
                    aValue = a[sortConfig.key as keyof Project];
                    bValue = b[sortConfig.key as keyof Project];
                }
                
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
                
                return 0;
            });
        }

        return data;
    }, [localProjectData, searchTerm, sortConfig]);

    const handleHeaderSort = (key: SortKey) => {
        if (isOrderChanged) {
            toast('Urutan manual telah diganti dengan penyortiran kolom.');
            setIsOrderChanged(false);
        }
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, order: prev.order === 'asc' ? 'desc' : 'asc' };
            }
            return { key, order: 'asc' };
        });
    };
    
    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.order === 'asc' ? '▲' : '▼';
    };

    const handleMoveRow = useCallback((viewIndex: number, direction: 'up' | 'down') => {
        const itemToMove = sortedAndFilteredData[viewIndex];
        const swapIndex = direction === 'up' ? viewIndex - 1 : viewIndex + 1;
        if (swapIndex < 0 || swapIndex >= sortedAndFilteredData.length) return;
        const itemToSwapWith = sortedAndFilteredData[swapIndex];

        setLocalProjectData(currentData => {
            const fromIndex = currentData.findIndex(p => p.id === itemToMove.id);
            const toIndex = currentData.findIndex(p => p.id === itemToSwapWith.id);
            if (fromIndex === -1 || toIndex === -1) return currentData;
            const reorderedData = [...currentData];
            [reorderedData[fromIndex], reorderedData[toIndex]] = [reorderedData[toIndex], reorderedData[fromIndex]];
            return reorderedData;
        });

        if (sortConfig) {
            toast('Penyortiran kolom dinonaktifkan untuk urutan manual.');
            setSortConfig(null);
        }
        setIsOrderChanged(true);
    }, [sortedAndFilteredData, sortConfig]);

    const handleSaveOrder = () => {
        setProjects(localProjectData);
        setIsOrderChanged(false);
        toast.success('Urutan proyek berhasil disimpan!');
    };

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.text("Daftar Proyek", 14, 15);
        
        autoTable(doc, {
            startY: 20,
            head: [['No', 'Nama Proyek', 'Kelompok', 'Tim', 'Fase', 'Status', 'Kemajuan', 'Tenggat Waktu', 'Durasi Rencana']],
            body: sortedAndFilteredData.map((p, index) => {
                const currentPhase = getCurrentPhase(p);
                const durationText = getTimelineTextForPdf(p);
                return [
                    index + 1,
                    p.name,
                    p.group || '-',
                    p.team.join(', '),
                    currentPhase,
                    p.status,
                    `${p.progress}%`,
                    formatDate(p.dueDate),
                    durationText,
                ]
            }),
            theme: 'grid',
            headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        });

        doc.save('daftar-proyek.pdf');
        toast.success('PDF berhasil diunduh!');
        setIsFileActionsOpen(false);
    };
    
    const handleDownloadTemplate = () => {
        const instructionHeaders = [
            ['PETUNJUK PENGISIAN TEMPLATE PROYEK'],
            ['1. TIM: Pisahkan nama anggota tim dengan koma (e.g., Andi, Budi, Citra).'],
            ['2. TANGGAL: Gunakan format YYYY-MM-DD (e.g., 2024-12-31).'],
            ['3. Jangan mengubah atau menghapus baris header di bawah ini (baris 5).'],
        ];

        const mainHeaders = [['Nama Proyek', 'Kelompok', 'Tim (pisahkan koma)', 'Tanggal Mulai Rencana', 'Tanggal Selesai Rencana']];

        const examples = [
            ['Pengembangan Aplikasi Mobile Banking', 'Pengembangan IT', 'Andi, Budi, Citra', '2024-08-01', '2025-02-28'],
            ['Pembangunan Gudang Baru Cikarang', 'Konstruksi', 'Doni, Eka, Fira', '2024-09-15', '2025-06-30'],
        ];

        const sheetData = [...instructionHeaders, [], ...mainHeaders, ...examples];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 25 }];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Proyek");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, "Template_Proyek.xlsx");
        toast.success("Template Excel telah diunduh!");
        setIsFileActionsOpen(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

                if (!json || json.length < 1) {
                    toast.error("File Excel kosong atau tidak valid.");
                    return;
                }

                const headerRowIndex = json.findIndex(row =>
                    row.some((cell: string) => cell?.toString().toLowerCase().includes('nama proyek'))
                );

                if (headerRowIndex === -1) {
                    toast.error("Format template tidak sesuai. Header tidak ditemukan.");
                    return;
                }
                
                const headers: string[] = json[headerRowIndex].map((h: any) => h.toString().toLowerCase());
                const dataRows = json.slice(headerRowIndex + 1);
                const newProjects: Project[] = [];
                
                dataRows.forEach((rowArray, index) => {
                    const row: { [key: string]: any } = {};
                    headers.forEach((header, i) => {
                        row[header] = rowArray[i];
                    });

                    const name = row['nama proyek'];
                    const group = row['kelompok'];
                    const teamString = row['tim (pisahkan koma)'];
                    let startDateStr = row['tanggal mulai rencana'];
                    let endDateStr = row['tanggal selesai rencana'];

                    if (!name || !startDateStr || !endDateStr) {
                        console.warn(`Skipping row ${index + 1}: Missing required data.`);
                        return;
                    }
                    
                    if (typeof startDateStr === 'number') {
                        startDateStr = new Date(Date.UTC(0, 0, startDateStr - 1)).toISOString().split('T')[0];
                    }
                    if (typeof endDateStr === 'number') {
                        endDateStr = new Date(Date.UTC(0, 0, endDateStr - 1)).toISOString().split('T')[0];
                    }

                    const team = teamString ? teamString.toString().split(',').map((t: string) => t.trim()).filter(Boolean) : [];

                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
                        console.warn(`Skipping row ${index + 1}: Invalid dates.`);
                        return;
                    }

                    const phaseNames = ['Feasibility', 'Planning & Design', 'Construction', 'Close Out'];
                    const phaseColors = ['#3b82f6', '#14b8a6', '#f97316', '#ef4444'];
                    const phases: ProjectPhase[] = [];
                    const totalDuration = endDate.getTime() - startDate.getTime();

                    if (phaseNames.length > 0 && totalDuration >= 0) {
                        const durationPerPhase = totalDuration / phaseNames.length;
                        let currentStartDate = startDate.getTime();

                        for (let i = 0; i < phaseNames.length; i++) {
                            const phaseStartDate = new Date(currentStartDate);
                            const phaseEndDate = (i === phaseNames.length - 1) ? endDate : new Date(currentStartDate + durationPerPhase);
                            phases.push({
                                id: `phase-${Date.now()}-${index}-${i}`,
                                name: phaseNames[i],
                                plan: {
                                    start: phaseStartDate.toISOString().split('T')[0],
                                    end: phaseEndDate.toISOString().split('T')[0],
                                },
                                actual: { start: null, end: null },
                                color: phaseColors[i % phaseColors.length],
                            });
                            currentStartDate = phaseEndDate.getTime();
                        }
                    }

                    newProjects.push({
                        id: `PROJ-${Date.now()}-${index}`,
                        name: name.toString(),
                        group: group ? group.toString() : 'Umum',
                        team: team,
                        status: 'Not Started',
                        progress: 0,
                        dueDate: endDate.toISOString().split('T')[0],
                        phases,
                    });
                });
                
                if (newProjects.length > 0) {
                    setProjects(prev => [...newProjects, ...prev]);
                    toast.success(`${newProjects.length} proyek berhasil diimpor!`);
                } else {
                    toast.error("Tidak ada proyek baru yang diimpor. Periksa file Anda.");
                }

            } catch (error) {
                console.error("Error parsing Excel file:", error);
                toast.error("Gagal mengimpor file Excel. Pastikan formatnya benar.");
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };



    const handleOpenCreateModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (project: Project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const handleSaveProject = (projectToSave: Omit<Project, 'id'> & { id?: string }) => {
        if (projectToSave.id) { // Update
            setProjects(prev => prev.map(p => p.id === projectToSave.id ? { ...p, ...projectToSave } as Project : p));
        } else { // Create
            const newProject: Project = {
                ...projectToSave,
                id: `PROJ${Date.now()}`,
            };
            setProjects(prev => [newProject, ...prev]);
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (projectId: string) => {
        setItemToDelete(projectId);
        setIsConfirmOpen(true);
    };
    
    const confirmDelete = () => {
        if (itemToDelete) {
            setProjects(prev => prev.filter(p => p.id !== itemToDelete));
            toast.success('Proyek berhasil dihapus.');
        }
        setIsConfirmOpen(false);
        setItemToDelete(null);
    };

    const headerButtonClass = "cursor-pointer select-none px-4 py-3 text-center uppercase";

    return (
        <>
            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Proyek"
                message="Apakah Anda yakin ingin menghapus proyek ini secara permanen? Semua data terkait akan hilang."
            />
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveProject}
                initialData={editingProject}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="search"
                                placeholder="Cari proyek atau tim..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                            <Filter size={16} />Filter
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleSaveOrder} disabled={!isOrderChanged} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition shadow disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <Save size={16} /> Simpan Urutan
                        </button>
                        
                        <div className="relative" ref={fileActionsMenuRef}>
                            <button onClick={() => setIsFileActionsOpen(p => !p)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                <FileText size={16} /> Opsi File <ChevronDown size={16} className={`transition-transform ${isFileActionsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isFileActionsOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-1">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                                    <button onClick={() => { fileInputRef.current?.click(); setIsFileActionsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                        <Upload size={16} /> Import Excel
                                    </button>
                                    <button onClick={handleDownloadTemplate} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                        <Download size={16} /> Download Template
                                    </button>
                                    <button onClick={handleExportPdf} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                       <FileDown size={16} /> Export PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleOpenCreateModal} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-200 dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-white transition shadow">
                            <Plus size={16} /> Buat Proyek
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 uppercase w-20 text-center">No</th>
                                <th scope="col" className={`${headerButtonClass} min-w-[250px]`} onClick={() => handleHeaderSort('name')}>Nama Proyek {getSortIndicator('name')}</th>
                                <th scope="col" className={`${headerButtonClass} w-32`} onClick={() => handleHeaderSort('group')}>Kelompok {getSortIndicator('group')}</th>
                                <th scope="col" className="px-4 py-3 uppercase text-left w-32">Tim</th>
                                <th scope="col" className={`${headerButtonClass} w-36`} onClick={() => handleHeaderSort('phase')}>Fase {getSortIndicator('phase')}</th>
                                <th scope="col" className={`${headerButtonClass} w-40`} onClick={() => handleHeaderSort('progress')}>Fase Progres {getSortIndicator('progress')}</th>
                                <th scope="col" className={`${headerButtonClass} w-32`} onClick={() => handleHeaderSort('dueDate')}>Due Date {getSortIndicator('dueDate')}</th>
                                <th scope="col" className={`${headerButtonClass} w-32`} onClick={() => handleHeaderSort('status')}>Status {getSortIndicator('status')}</th>
                                <th scope="col" className={`${headerButtonClass} w-40`}>Progres</th>
                                <th scope="col" className={`${headerButtonClass} w-40`} onClick={() => handleHeaderSort('startFinish')}>Timeline {getSortIndicator('startFinish')}</th>
                                <th scope="col" className="px-4 py-3 uppercase text-center w-20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredData.map((project, index) => (
                                <ProjectRow 
                                    key={project.id} 
                                    project={project}
                                    index={index}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleDeleteRequest}
                                    onMove={handleMoveRow}
                                    totalRows={sortedAndFilteredData.length}
                                />
                            ))}
                        </tbody>
                    </table>
                     {sortedAndFilteredData.length === 0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400"><p>Tidak ada data proyek yang cocok.</p></div>}
                </div>
            </div>
        </>
    );
};

export default ProjectList;