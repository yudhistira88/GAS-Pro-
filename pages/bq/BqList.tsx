import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { type RabDocument } from '../../types';
import { Search, Plus, FileDown, MoreVertical, Eye, Trash2, Filter, Pencil, Save, ArrowUp, ArrowDown } from 'lucide-react';
import CreateBqModal from '../../components/CreateBqModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StatusBadgeProps {
  status: RabDocument['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block tracking-wide";
  
  const statusClasses: Record<RabDocument['status'], string> = {
    Selesai: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Approval: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    Survey: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Diterima: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    Ditolak: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    'Pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    'Menunggu Approval': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  };
  
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

interface ActionMenuProps {
    bq: RabDocument;
    onEdit: (bq: RabDocument) => void;
    onDelete: (id: string) => void;
}

const ActionMenu = ({ bq, onDelete, onEdit }: ActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast">
                    <Link to={`/bq/detail/${bq.id}`} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={16} className="mr-2"/> Lihat Detail</Link>
                    <button onClick={() => { onEdit(bq); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16} className="mr-2"/> Edit BQ</button>
                    <button onClick={() => { onDelete(bq.id); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} className="mr-2"/> Hapus</button>
                </div>
            )}
        </div>
    )
}

// Daftar hari libur nasional (YYYY-MM-DD)
const holidays = [
  "2023-01-01", "2023-01-22", "2023-01-23", "2023-02-18", "2023-03-22", "2023-03-23",
  "2023-04-07", "2023-04-22", "2023-04-23", "2023-04-19", "2023-04-20", "2023-04-21",
  "2023-04-24", "2023-04-25", "2023-05-01", "2023-05-18", "2023-06-01", "2023-06-2",
  "2023-06-04", "2023-06-29", "2023-07-19", "2023-08-17", "2023-09-28", "2023-12-25", "2023-12-26",
  "2024-01-01", "2024-02-08", "2024-02-09", "2024-02-10", "2024-03-11", "2024-03-12",
  "2024-03-29", "2024-03-31", "2024-04-10", "2024-04-11", "2024-04-08", "2024-04-09",
  "2024-04-12", "2024-04-15", "2024-05-01", "2024-05-09", "2024-05-10", "2024-05-23",
  "2024-05-24", "2024-06-01", "2024-06-17", "2024-06-18", "2024-07-07", "2024-08-17",
  "2024-09-16", "2024-12-25", "2024-12-26"
].map(d => new Date(d).toISOString().split('T')[0]);

const calculateSla = (receivedDateStr: string | null, finishDateStr: string | null): number | string => {
    if (!receivedDateStr || !finishDateStr) return '-';

    const startDate = new Date(receivedDateStr);
    const endDate = new Date(finishDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
        return '-';
    }

    let workdays = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const dateString = currentDate.toISOString().split('T')[0];
        const isHoliday = holidays.includes(dateString);

        if (!isWeekend && !isHoliday) {
            workdays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const slaValue = workdays - 1;
    return slaValue >= 0 ? slaValue : 0;
};

const formatDateForRow = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};


interface BqDataContext {
  bqData: RabDocument[];
  setBqData: React.Dispatch<React.SetStateAction<RabDocument[]>>;
}

const allStatuses: RabDocument['status'][] = ['Survey', 'Approval', 'Diterima', 'Ditolak', 'Selesai', 'Pending', 'Menunggu Approval'];

type SortKey = keyof RabDocument | 'sla' | 'no';
type SortOrder = 'asc' | 'desc';


const BqRow = React.memo(({ bq, index, onEdit, onDelete, onMove, totalRows } : { bq: RabDocument, index: number, onEdit: (bq: RabDocument) => void, onDelete: (id: string) => void, onMove: (index: number, direction: 'up' | 'down') => void, totalRows: number }) => {
    return (
        <tr className={`group bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
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
            <th scope="row" className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap text-center text-xs">{bq.eMPR}</th>
            <td className="px-4 py-2 text-xs">
                <Link to={`/bq/detail/${bq.id}`} className="hover:text-honda-red hover:underline transition-colors">
                    {bq.projectName}
                </Link>
            </td>
            <td className="px-4 py-2 text-center text-xs">{bq.pic}</td>
            <td className="px-4 py-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-2 text-xs">
                    <strong className="font-semibold text-gray-600 dark:text-gray-400 text-right">Tgl. Survey:</strong>
                    <span className="text-left">{formatDateForRow(bq.surveyDate)}</span>
                    <strong className="font-semibold text-gray-600 dark:text-gray-400 text-right">Tgl. Diterima:</strong>
                    <span className="text-left">{formatDateForRow(bq.receivedDate)}</span>
                    <strong className="font-semibold text-gray-600 dark:text-gray-400 text-right">Tgl. Selesai:</strong>
                    <span className="text-left">{formatDateForRow(bq.finishDate)}</span>
                </div>
            </td>
            <td className="px-4 py-2 text-center"><StatusBadge status={bq.status} /></td>
            <td className="px-4 py-2 text-center font-medium text-xs">{calculateSla(bq.receivedDate, bq.finishDate)}</td>
            <td className="px-4 py-2 text-xs">{bq.keterangan || '-'}</td>
            <td className="px-4 py-2 text-center">
                <ActionMenu bq={bq} onDelete={onDelete} onEdit={onEdit} />
            </td>
        </tr>
    );
});

const BqList = () => {
  const { bqData, setBqData } = useOutletContext<BqDataContext>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBq, setEditingBq] = useState<RabDocument | null>(null);
  const [statusFilters, setStatusFilters] = useState<RabDocument['status'][]>([]);
  const [dateFilters, setDateFilters] = useState({ survey: { from: '', to: '' }, received: { from: '', to: '' }, finish: { from: '', to: '' } });
  const [slaFilter, setSlaFilter] = useState({ min: '', max: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [localBqData, setLocalBqData] = useState<RabDocument[]>([]);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  
  useEffect(() => {
    setLocalBqData(bqData);
    setIsOrderChanged(false);
  }, [bqData]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(event.target as Node)) { setIsFilterOpen(false); } };
      if (isFilterOpen) { document.addEventListener('mousedown', handleClickOutside); }
      return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [isFilterOpen]);

  const activeFilterCount = useMemo(() => {
    let count = statusFilters.length;
    if (dateFilters.survey.from) count++; if (dateFilters.survey.to) count++; if (dateFilters.received.from) count++;
    if (dateFilters.received.to) count++; if (dateFilters.finish.from) count++; if (dateFilters.finish.to) count++;
    if (slaFilter.min) count++; if (slaFilter.max) count++;
    return count;
  }, [statusFilters, dateFilters, slaFilter]);

  const sortedAndFilteredData = useMemo(() => {
    let data = [...localBqData];
    data = data.filter(bq => {
        const matchesSearch = bq.eMPR.toLowerCase().includes(searchTerm.toLowerCase()) || bq.projectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(bq.status);

        const checkDateRange = (dateStr: string | null, range: { from: string; to: string }): boolean => {
            if (!range.from && !range.to) return true;
            if (!dateStr) return false;
            const itemDate = new Date(dateStr); itemDate.setHours(0, 0, 0, 0);
            if (range.from) { const fromDate = new Date(range.from); fromDate.setHours(0, 0, 0, 0); if (itemDate < fromDate) return false; }
            if (range.to) { const toDate = new Date(range.to); toDate.setHours(0, 0, 0, 0); if (itemDate > toDate) return false; }
            return true;
        };
        const matchesDates = checkDateRange(bq.surveyDate, dateFilters.survey) && checkDateRange(bq.receivedDate, dateFilters.received) && checkDateRange(bq.finishDate, dateFilters.finish);

        const slaValue = calculateSla(bq.receivedDate, bq.finishDate);
        const matchesSla = (() => {
            if (slaFilter.min === '' && slaFilter.max === '') return true;
            if (typeof slaValue !== 'number') return false; // Don't match if SLA is '-'
            const minSla = slaFilter.min !== '' ? parseFloat(slaFilter.min) : -Infinity;
            const maxSla = slaFilter.max !== '' ? parseFloat(slaFilter.max) : Infinity;
            return slaValue >= minSla && slaValue <= maxSla;
        })();
        
        return matchesSearch && matchesStatus && matchesDates && matchesSla;
    });


    if (sortConfig) {
      data.sort((a, b) => {
        let aValue: any, bValue: any;
        if (sortConfig.key === 'sla') { aValue = calculateSla(a.receivedDate, a.finishDate); bValue = calculateSla(b.receivedDate, b.finishDate); if (aValue === '-') aValue = -1; if (bValue === '-') bValue = -1; } 
        else { aValue = a[sortConfig.key as keyof RabDocument]; bValue = b[sortConfig.key as keyof RabDocument]; }
        if (aValue === null || aValue === undefined) return 1; if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1; if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [localBqData, searchTerm, statusFilters, dateFilters, slaFilter, sortConfig]);
  
  const handleHeaderSort = (key: SortKey) => {
    let newOrder: SortOrder = 'asc';
    if (sortConfig && sortConfig.key === key) {
        newOrder = sortConfig.order === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, order: newOrder });
    if (isOrderChanged) {
        toast('Urutan manual telah diganti dengan penyortiran kolom.');
        setIsOrderChanged(false);
    }
  };

  const getSortIndicator = (key: SortKey) => { if (!sortConfig || sortConfig.key !== key) return null; return sortConfig.order === 'asc' ? '▲' : '▼'; };

  const handleOpenCreateModal = () => { setEditingBq(null); setIsModalOpen(true); };
  const handleOpenEditModal = useCallback((bq: RabDocument) => { setEditingBq(bq); setIsModalOpen(true); }, []);
  const handleStatusFilterChange = (status: RabDocument['status']) => { setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]); };
  const handleDateFilterChange = (type: 'survey' | 'received' | 'finish', field: 'from' | 'to', value: string) => { setDateFilters(prev => ({ ...prev, [type]: { ...prev[type], [field]: value, }, })); };
  
  const handleDeleteRequest = useCallback((id: string) => { setItemToDelete(id); setIsConfirmOpen(true); }, []);
  const confirmDelete = () => { if (itemToDelete) { const newData = bqData.filter(bq => bq.id !== itemToDelete); setBqData(newData); toast.success('BQ berhasil dihapus.'); } setIsConfirmOpen(false); setItemToDelete(null); };

  const resetFilters = () => {
    setStatusFilters([]);
    setDateFilters({ survey: { from: '', to: '' }, received: { from: '', to: '' }, finish: { from: '', to: '' } });
    setSlaFilter({ min: '', max: '' });
    setIsFilterOpen(false);
  };

  const handleSaveBq = (dataToSave: Omit<RabDocument, 'sla' | 'detailItems' | 'pdfReady'> & { id?: string }) => {
    if (dataToSave.id) { setBqData(prev => prev.map(bq => (bq.id === dataToSave.id ? { ...bq, ...dataToSave } : bq))); toast.success('BQ berhasil diperbarui!'); } 
    else { const newBq: RabDocument = { ...dataToSave, id: Date.now().toString(), sla: 0, detailItems: [], pdfReady: false, }; setBqData(prev => [newBq, ...prev]); navigate(`/bq/detail/${newBq.id}`); }
    setIsModalOpen(false); setEditingBq(null);
  };

  const handleMoveRow = useCallback((viewIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && viewIndex === 0) || (direction === 'down' && viewIndex === sortedAndFilteredData.length - 1)) {
        return;
    }

    const itemToMove = sortedAndFilteredData[viewIndex];
    const itemToSwapWith = sortedAndFilteredData[direction === 'up' ? viewIndex - 1 : viewIndex + 1];

    if (!itemToMove || !itemToSwapWith) return;

    setLocalBqData(currentData => {
        const fromIndex = currentData.findIndex(item => item.id === itemToMove.id);
        const toIndex = currentData.findIndex(item => item.id === itemToSwapWith.id);

        if (fromIndex === -1 || toIndex === -1) return currentData;

        const reorderedData = [...currentData];
        // Swap elements
        [reorderedData[fromIndex], reorderedData[toIndex]] = [reorderedData[toIndex], reorderedData[fromIndex]];
        
        return reorderedData;
    });

    if (sortConfig) {
        toast('Penyortiran kolom dinonaktifkan untuk urutan manual.');
        setSortConfig(null);
    }
    setIsOrderChanged(true);
  }, [sortedAndFilteredData, sortConfig]);

  const handleSortKeyChange = (key: SortKey) => {
    if (!key) {
        setSortConfig(null);
        return;
    }
    setSortConfig({ key, order: 'asc' });
    if (isOrderChanged) {
        toast('Urutan manual telah diganti dengan penyortiran kolom.');
        setIsOrderChanged(false);
    }
  };

  const handleSortOrderToggle = () => {
    if (sortConfig) {
        setSortConfig(prev => ({ ...prev!, order: prev!.order === 'asc' ? 'desc' : 'asc' }));
    }
  };

  const handleSaveOrder = () => {
    setBqData(localBqData);
    setIsOrderChanged(false);
    toast.success('Urutan berhasil disimpan!');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-';

    // Set Header
    doc.text("Monitoring BQ", 14, 15);
    doc.setFontSize(11);
    doc.text("Rekapitulasi Bill of Quantity Proyek", 14, 22);

    const statusColors: { [key in RabDocument['status']]: { bg: number[], text: number[] } } = {
        Selesai: { bg: [220, 252, 231], text: [22, 101, 52] },
        Diterima: { bg: [224, 242, 254], text: [7, 89, 133] },
        Ditolak: { bg: [254, 226, 226], text: [153, 27, 27] },
        Approval: { bg: [238, 242, 255], text: [67, 56, 202] },
        Survey:   { bg: [254, 249, 195], text: [133, 77, 14] },
        'Pending': { bg: [255, 247, 237], text: [154, 52, 18] },
        'Menunggu Approval': { bg: [245, 243, 255], text: [91, 33, 182] },
    };


    const head = [['NO', 'EMPR', 'URAIAN PROJECT', 'PIC', 'TIMELINE', 'STATUS', 'SLA (HARI KERJA)', 'KETERANGAN']];
    const body = sortedAndFilteredData.map((bq, index) => {
        return [
            index + 1,
            bq.eMPR,
            bq.projectName,
            bq.pic,
            `Survey: ${formatDate(bq.surveyDate)}\nDiterima: ${formatDate(bq.receivedDate)}\nSelesai: ${formatDate(bq.finishDate)}`,
            bq.status,
            calculateSla(bq.receivedDate, bq.finishDate),
            bq.keterangan || '-'
        ];
    });

    autoTable(doc, {
        startY: 30,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: {
            fillColor: [243, 244, 246],
            textColor: [55, 65, 81],
            fontStyle: 'bold',
            lineColor: [209, 213, 219],
            lineWidth: 0.1,
        },
        styles: {
            font: 'helvetica',
            fontSize: 7,
            cellPadding: 2,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 70, halign: 'left' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 35, halign: 'left' }, 5: { cellWidth: 25, halign: 'center' }, 6: { cellWidth: 20, halign: 'center' }, 7: { cellWidth: 'auto', halign: 'left' }
        },
        willDrawCell: (data) => {
            if (data.section === 'head') {
                data.cell.styles.halign = 'center';
            }
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
                const status = data.cell.raw as RabDocument['status'];
                const finalColors = statusColors[status];
                const text = status;

                if (finalColors) {
                    const { bg, text: textColor } = finalColors;
                    const { x, y, width, height } = data.cell;
                    
                    const textWidth = doc.getStringUnitWidth(text) * (data.cell.styles.fontSize || 7) / doc.internal.scaleFactor;
                    const badgeWidth = textWidth + 4;
                    const badgeHeight = 5;
                    const badgeX = x + (width - badgeWidth) / 2;
                    const badgeY = y + (height - badgeHeight) / 2;
                    doc.setFillColor(bg[0], bg[1], bg[2]);
                    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                    doc.text(text, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2, { align: 'center', baseline: 'middle' });
                }
            }
        }
    });

    doc.save('daftar-bq.pdf');
    toast.success('PDF berhasil diunduh!');
  };


  const dateInputClasses = "w-full text-xs p-1.5 border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const numberInputClasses = "w-full text-xs p-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const headerButtonClass = "cursor-pointer select-none px-4 py-3 text-center uppercase";

  return (
    <>
      <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Hapus BQ" message="Apakah Anda yakin ingin menghapus data BQ ini secara permanen? Tindakan ini tidak dapat dibatalkan." />
      <CreateBqModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBq(null); }} onSave={handleSaveBq} initialData={editingBq} />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="search" placeholder="Cari eMPR atau Uraian Project..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" /></div>
            <div className="relative" ref={filterRef}>
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition relative"><Filter size={16} />Filter{activeFilterCount > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-honda-red text-white text-xs">{activeFilterCount}</span>)}</button>
              {isFilterOpen && (
                 <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-4 space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-100">Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {allStatuses.map(status => (
                                <label key={status} className="flex items-center text-sm space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={statusFilters.includes(status)} onChange={() => handleStatusFilterChange(status)} className="h-4 w-4 rounded border-gray-300 text-honda-red focus:ring-honda-red dark:bg-gray-700 dark:border-gray-600" />
                                    <span>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Timeline</h4>
                        <div>
                           <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tgl. Survey</label>
                           <div className="grid grid-cols-2 gap-2 mt-1">
                               <input type="date" value={dateFilters.survey.from} onChange={e => handleDateFilterChange('survey', 'from', e.target.value)} className={dateInputClasses} placeholder="From"/>
                               <input type="date" value={dateFilters.survey.to} onChange={e => handleDateFilterChange('survey', 'to', e.target.value)} className={dateInputClasses} placeholder="To"/>
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tgl. Diterima</label>
                           <div className="grid grid-cols-2 gap-2 mt-1">
                               <input type="date" value={dateFilters.received.from} onChange={e => handleDateFilterChange('received', 'from', e.target.value)} className={dateInputClasses} />
                               <input type="date" value={dateFilters.received.to} onChange={e => handleDateFilterChange('received', 'to', e.target.value)} className={dateInputClasses} />
                           </div>
                        </div>
                         <div>
                           <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tgl. Selesai</label>
                           <div className="grid grid-cols-2 gap-2 mt-1">
                               <input type="date" value={dateFilters.finish.from} onChange={e => handleDateFilterChange('finish', 'from', e.target.value)} className={dateInputClasses} />
                               <input type="date" value={dateFilters.finish.to} onChange={e => handleDateFilterChange('finish', 'to', e.target.value)} className={dateInputClasses} />
                           </div>
                        </div>
                    </div>
                     <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-100">SLA (Hari Kerja)</h4>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="Min" value={slaFilter.min} onChange={(e) => setSlaFilter(p => ({ ...p, min: e.target.value }))} className={numberInputClasses} />
                            <span className="text-gray-400">-</span>
                            <input type="number" placeholder="Max" value={slaFilter.max} onChange={(e) => setSlaFilter(p => ({ ...p, max: e.target.value }))} className={numberInputClasses} />
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-end">
                        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Reset Filter</button>
                    </div>
                </div>
              )}
            </div>
             <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
                <label htmlFor="sort-by" className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Urutkan:</label>
                <select id="sort-by" value={sortConfig?.key || ''} onChange={(e) => handleSortKeyChange(e.target.value as SortKey)} className="text-sm p-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    <option value="">Default</option>
                    <option value="projectName">Uraian Project</option>
                    <option value="sla">SLA</option>
                    <option value="status">Status</option>
                    <option value="pic">PIC</option>
                </select>
                <button onClick={handleSortOrderToggle} disabled={!sortConfig} className="p-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title="Ganti arah urutan">
                    {sortConfig?.order === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveOrder} disabled={!isOrderChanged} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow disabled:bg-gray-400 disabled:cursor-not-allowed"><Save size={16} /> Simpan Urutan</button>
            <button onClick={handleExportPdf} className="p-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 transition shadow" title="Unduh sebagai PDF">
                <FileDown size={18} />
            </button>
            <button onClick={handleOpenCreateModal} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-200 dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-white transition shadow"><Plus size={16} /> Buat BQ</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 uppercase w-20 text-center">No</th>
                <th scope="col" className={`${headerButtonClass} w-40`} onClick={() => handleHeaderSort('eMPR')}>eMPR {getSortIndicator('eMPR')}</th>
                <th scope="col" className={`${headerButtonClass} min-w-[300px]`} onClick={() => handleHeaderSort('projectName')}>Uraian Project {getSortIndicator('projectName')}</th>
                <th scope="col" className={headerButtonClass} onClick={() => handleHeaderSort('pic')}>PIC {getSortIndicator('pic')}</th>
                <th scope="col" className="px-4 py-3 min-w-[180px] text-center uppercase">Timeline</th>
                <th scope="col" className={headerButtonClass} onClick={() => handleHeaderSort('status')}>Status {getSortIndicator('status')}</th>
                <th scope="col" className={`${headerButtonClass} min-w-[100px]`} onClick={() => handleHeaderSort('sla')}>SLA (hari kerja) {getSortIndicator('sla')}</th>
                <th scope="col" className={`${headerButtonClass} min-w-[250px]`} onClick={() => handleHeaderSort('keterangan')}>Keterangan {getSortIndicator('keterangan')}</th>
                <th scope="col" className="px-4 py-3 text-center uppercase w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredData.map((bq, index) => (
                <BqRow key={bq.id} bq={bq} index={index} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onMove={handleMoveRow} totalRows={sortedAndFilteredData.length} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BqList;