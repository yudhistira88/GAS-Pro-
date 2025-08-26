





import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type RabDocument, type RabDetailItem, type AhsComponent, type PriceDatabaseItem, type WorkItem } from '../../types';
import { Plus, Trash2, ArrowLeft, Save, Pencil, Check, Zap, Loader2, ArrowUp, ArrowDown, FileText, X, ChevronDown, Database, SlidersHorizontal, AlertTriangle, Layers, Calculator, Wand2, CheckCircle, Send, Upload, Download, FileDown, Lock, Edit, RotateCcw, PlusCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { generateAhsForSingleItem } from '../../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AhsEditorModal from '../../components/AhsEditorModal';
import ApprovalModal from '../../components/ApprovalModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import GenerateBqModal from '../../components/GenerateBqModal';


// --- Helper Components & Functions ---
const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;
    const resize = useCallback(() => {
        const textarea = (textareaRef as React.RefObject<HTMLTextAreaElement>).current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [textareaRef]);
    useEffect(() => { resize(); }, [props.value, resize]);
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => { resize(); if (props.onInput) { props.onInput(e); } };
    return <textarea ref={textareaRef} {...props} rows={1} onInput={handleInput} className={`${props.className} resize-none overflow-y-hidden`} />;
});
AutoResizeTextarea.displayName = 'AutoResizeTextarea';

const formatNumber = (amount: number | null, decimals = 0) => {
    if (amount === null || typeof amount === 'undefined' || isNaN(amount)) return '0';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(amount);
};

const romanize = (num: number): string => {
    if (isNaN(num) || num <= 0) return "";
    const digits = String(+num).split(""), key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    let roman = "", i = 3;
    while (i--) roman = (key[+digits.pop()! + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

// --- HELPER COMPONENTS (Moved from inside BqDetail) ---

const MissingItemsModal = ({ isOpen, onClose, missingItems, onStartAhsCreation, onStartAhsCreationWithAi }: { 
    isOpen: boolean, 
    onClose: () => void, 
    missingItems: RabDetailItem[], 
    onStartAhsCreation: (itemId: string) => void,
    onStartAhsCreationWithAi: (itemId: string) => void,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                        <AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Data AHS Belum Tersedia</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">Beberapa pekerjaan tidak memiliki Analisa Harga Satuan (AHS). Silakan buat AHS untuk melanjutkan.</p>
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {missingItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <span className="text-sm font-medium">{item.uraianPekerjaan}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => onStartAhsCreation(item.id)} className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">Buat Manual</button>
                                        <button onClick={() => onStartAhsCreationWithAi(item.id)} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"><Wand2 size={12}/> Buat dg AI</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Tutup</button>
                </div>
            </div>
        </div>
    );
};

interface BqDetailRowProps {
    item: RabDetailItem;
    itemNumberString: string;
    rowIndex: number;
    totalRows: number;
    onUpdate: (id: string, field: keyof RabDetailItem, value: any) => void;
    onToggleDelete: (id: string) => void;
    onToggleEdit: (id: string) => void;
    onSaveRow: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    isLocked: boolean;
    onAddSubItem: (id: string) => void;
}

const BqDetailRow = React.memo(({ item, itemNumberString, rowIndex, totalRows, onUpdate, onToggleDelete, onToggleEdit, onSaveRow, onMove, isLocked, onAddSubItem }: BqDetailRowProps) => {
    const inputClasses = "w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-xs placeholder-gray-400";
    const viewClasses = "block px-1 py-1 text-xs";
    const isCategory = item.type === 'category';
    
    const canEdit = !isLocked && item.isEditing && !item.isDeleted;
    const isDeleted = !!item.isDeleted;
    const isNew = !!item.isNew && !item.isEditing && !isDeleted;

    const rowClasses = [
        isCategory ? 'bg-gray-200/70 dark:bg-gray-700/70 font-bold' : 'bg-white dark:bg-gray-800/60',
        'border-b dark:border-gray-700/50 hover:bg-honda-red/5 dark:hover:bg-honda-red/10 transition-colors duration-200',
        isDeleted ? 'bg-red-50/50 dark:bg-red-900/40 text-red-700 dark:text-red-500 opacity-70' : '',
        isNew ? 'bg-green-50/50 dark:bg-green-900/40' : ''
    ].join(' ');

    const textClasses = isDeleted ? 'line-through' : '';

    const indentLevel = item.indent || 0;
    const indentPadding = { paddingLeft: `${indentLevel * 1.5}rem` };
    
    const handleVolumeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur(); // Trigger onBlur to calculate and update
        }
    };

    const addSubItemTitle = item.type === 'category' ? 'Tambah Sub Kategori' : 'Tambah Sub Item';

    const actionButtons = (
        <div className="flex justify-center items-center gap-1">
            {!isDeleted && (
                <button disabled={isLocked} onClick={() => onAddSubItem(item.id)} className="p-1 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={addSubItemTitle}>
                    <PlusCircle size={12}/>
                </button>
            )}
            {!isDeleted && (canEdit ? (
                <button onClick={() => onSaveRow(item.id)} className="p-1 text-green-600 hover:text-green-700 dark:hover:text-green-400 transition-colors" title="Simpan Baris"><Check size={12}/></button>
            ) : (
                <button disabled={isLocked} onClick={() => onToggleEdit(item.id)} className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Edit Baris"><Pencil size={12}/></button>
            ))}
            <button disabled={isLocked} onClick={() => onToggleDelete(item.id)} className={`p-1 transition-colors ${isDeleted ? 'text-blue-600 hover:text-blue-500' : 'text-gray-500 hover:text-honda-red dark:hover:text-red-400'} disabled:opacity-30 disabled:cursor-not-allowed`} title={isDeleted ? "Pulihkan Baris" : "Hapus Baris"}>
                 {isDeleted ? <RotateCcw size={12}/> : <Trash2 size={12}/>}
            </button>
        </div>
    );

    const moveButtons = (
        <div className="flex items-center justify-center gap-x-1 h-full">
            <span className={`text-xs text-gray-800 dark:text-gray-300 w-10 text-center ${isCategory ? 'font-bold' : ''}`}>{itemNumberString}</span>
            <div className="flex flex-col">
                <button onClick={() => onMove(rowIndex, 'up')} disabled={isLocked || rowIndex === 0} className="p-0.5 text-gray-400 hover:text-honda-red disabled:opacity-20 disabled:cursor-not-allowed" title="Pindah Atas"><ArrowUp size={10} /></button>
                <button onClick={() => onMove(rowIndex, 'down')} disabled={isLocked || rowIndex === totalRows - 1} className="p-0.5 text-gray-400 hover:text-honda-red disabled:opacity-20 disabled:cursor-not-allowed" title="Pindah Bawah"><ArrowDown size={10} /></button>
            </div>
        </div>
    );

    return (
        <tr className={rowClasses}>
            <td className="px-1 py-1 text-center align-top w-20">{moveButtons}</td>
            <td className="px-2 py-1 align-top min-w-[300px]" style={indentPadding}>
                {canEdit ? (<AutoResizeTextarea value={item.uraianPekerjaan} onChange={(e) => onUpdate(item.id, 'uraianPekerjaan', e.target.value)} className={`${inputClasses} text-left ${isCategory ? 'font-bold text-xs' : 'text-xs'}`} />) : (<span className={`${viewClasses} ${textClasses}`}>{item.uraianPekerjaan}</span>)}
            </td>
            <td className="px-2 py-1 align-top w-24">
                {canEdit && !isCategory ? (<input type="text" value={item.satuan} onChange={(e) => onUpdate(item.id, 'satuan', e.target.value)} className={`${inputClasses} text-center`} />) : (<span className={`${viewClasses} text-center ${textClasses}`}>{isCategory ? '' : item.satuan}</span>)}
            </td>
            <td className="px-2 py-1 align-top w-28">
                {canEdit && !isCategory ? (<input type="text" defaultValue={item.volume !== null ? item.volume.toString().replace('.', ',') : ''} onKeyDown={handleVolumeKeyDown} onBlur={(e) => {
                    const value = e.currentTarget.value;
                    if (value.startsWith('=')) {
                        const expression = value.substring(1).replace(/,/g, '.');
                        try {
                            const result = new Function('return ' + expression)();
                            if (typeof result === 'number' && !isNaN(result)) {
                                onUpdate(item.id, 'volume', result);
                            } else {
                                toast.error('Hasil formula tidak valid.');
                            }
                        } catch (err) {
                            toast.error('Formula tidak valid.');
                        }
                    } else {
                        const parsedValue = parseFloat(value.replace(',', '.'));
                        onUpdate(item.id, 'volume', isNaN(parsedValue) ? null : parsedValue);
                    }
                }} className={`${inputClasses} text-right`} />) : (<span className={`${viewClasses} text-right ${textClasses}`}>{isCategory ? '' : (item.volume !== null ? item.volume.toFixed(2).replace('.', ',') : '')}</span>)}
            </td>
            <td className="px-2 py-1 align-top min-w-[150px]">
                {canEdit ? (<AutoResizeTextarea value={item.keterangan} onChange={(e) => onUpdate(item.id, 'keterangan', e.target.value)} className={`${inputClasses} text-left`} />) : (<span className={`${viewClasses} ${textClasses}`}>{item.keterangan}</span>)}
            </td>
            <td className="px-2 py-1 text-center align-top w-20">{actionButtons}</td>
        </tr>
    );
});
BqDetailRow.displayName = 'BqDetailRow';

// --- Main Component ---
const BqDetail = ({ bqData, setBqData, priceDatabase, setPriceDatabase, workItems, setWorkItems }: { bqData: RabDocument[]; setBqData: React.Dispatch<React.SetStateAction<RabDocument[]>>; priceDatabase: PriceDatabaseItem[]; setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>; workItems: WorkItem[]; setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>> }) => {
    const { bqId } = useParams<{ bqId: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileActionsMenuRef = useRef<HTMLDivElement>(null);

    const [bq, setBq] = useState<RabDocument | null>(null);
    const [detailItems, setDetailItems] = useState<RabDetailItem[]>([]);
    const [creatorName, setCreatorName] = useState('');
    const [approverName, setApproverName] = useState('');
    const [workDuration, setWorkDuration] = useState<number | ''>('');
    const [revisionText, setRevisionText] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAhsItem, setEditingAhsItem] = useState<RabDetailItem | null>(null);
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
    const [viewingRevisionIndex, setViewingRevisionIndex] = useState<number | 'current'>('current');


    // State for the new pricing workflow
    const [isMissingItemsModalOpen, setIsMissingItemsModalOpen] = useState(false);
    const [missingWorkItems, setMissingWorkItems] = useState<RabDetailItem[]>([]);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // State for Approval Modal
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);

    // State for file actions dropdown
    const [isFileActionsOpen, setIsFileActionsOpen] = useState(false);

    const isReadOnlyView = viewingRevisionIndex !== 'current';
    const effectiveIsLocked = useMemo(() => bq?.isLocked || isReadOnlyView, [bq?.isLocked, isReadOnlyView]);

    useEffect(() => {
        const currentBq = bqData.find(r => r.id === bqId);
        if (currentBq) {
            setBq(currentBq);
            setDetailItems(JSON.parse(JSON.stringify(currentBq.detailItems || [])));
            setCreatorName(currentBq.creatorName || 'Admin Proyek');
            setApproverName(currentBq.approverName || 'Manajemen');
            setWorkDuration(currentBq.workDuration || '');
            setRevisionText(currentBq.revisionText || 'manual');
            setHasUnsavedChanges(false);
            setViewingRevisionIndex('current');
        } else {
            navigate('/bq/daftar');
        }
    }, [bqId, bqData, navigate]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileActionsMenuRef.current && !fileActionsMenuRef.current.contains(event.target as Node)) {
                setIsFileActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const sourceItems = useMemo(() => {
        if (viewingRevisionIndex === 'current' || !bq?.revisionHistory) {
            return detailItems; // The current state being edited
        }
        // If viewingRevisionIndex is a number, it's an index into the history array.
        return bq.revisionHistory[viewingRevisionIndex]?.items || [];
    }, [detailItems, bq?.revisionHistory, viewingRevisionIndex]);

    const visibleItems = useMemo(() => sourceItems.filter(item => !item.isDeleted), [sourceItems]);
    
    const itemNumbers = useMemo(() => {
        const numberMap = new Map<string, string>();
        let topLevelCategoryCounter = 0;
        
        // Map to store counters for children under a specific parent ID.
        // The key is parentId, the value is an object { cat: count, item: count }
        const counters = new Map<string, { cat: number, item: number }>();

        visibleItems.forEach((item, index) => {
            const indent = item.indent || 0;
            let parent = null;
            
            // Find the direct parent
            if (indent > 0) {
                // This is more reliable than reverse().find() as it finds the *direct* parent.
                for (let i = index - 1; i >= 0; i--) {
                    if ((visibleItems[i].indent || 0) === indent - 1) {
                        parent = visibleItems[i];
                        break;
                    }
                }
            }

            if (item.type === 'category') {
                if (indent === 0) {
                    topLevelCategoryCounter++;
                    const roman = romanize(topLevelCategoryCounter);
                    numberMap.set(item.id, roman);
                } else {
                    if (parent) {
                        const parentNumStr = numberMap.get(parent.id);
                        const parentCounters = counters.get(parent.id) || { cat: 0, item: 0 };
                        parentCounters.cat++;
                        counters.set(parent.id, parentCounters);
                        
                        const newNumStr = `${parentNumStr}.${parentCounters.cat}`;
                        numberMap.set(item.id, newNumStr);
                    } else {
                        numberMap.set(item.id, `?.?`);
                    }
                }
            } else { // type === 'item'
                if (parent) {
                    const parentNumStr = numberMap.get(parent.id);
                    const parentCounters = counters.get(parent.id) || { cat: 0, item: 0 };
                    parentCounters.item++;
                    counters.set(parent.id, parentCounters);
                    
                    const newNumStr = `${parentNumStr}.${parentCounters.item}`;
                    numberMap.set(item.id, newNumStr);
                } else {
                    // This would be a top-level item without a category.
                    // Fallback to a simple counter.
                    const rootCounters = counters.get('root_items') || { cat: 0, item: 0 };
                    rootCounters.item++;
                    counters.set('root_items', rootCounters);
                    numberMap.set(item.id, String(rootCounters.item));
                }
            }
        });

        return numberMap;
    }, [visibleItems]);


    const handleItemChange = useCallback((id: string, field: keyof RabDetailItem, value: any) => { setDetailItems(currentItems => currentItems.map(item => item.id === id ? { ...item, [field]: value } : item)); setHasUnsavedChanges(true); }, []);
    const handleToggleEdit = useCallback((id: string) => setDetailItems(items => items.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : { ...item, isEditing: false })), []);
    const handleSaveRow = useCallback((id: string) => { setDetailItems(items => items.map(item => item.id === id ? { ...item, isEditing: false, isSaved: true } : item)); toast.success('Baris disimpan!'); setHasUnsavedChanges(true); }, []);
    const handleAddCategory = () => { setDetailItems([...detailItems, { id: `cat-${Date.now()}`, type: 'category', uraianPekerjaan: 'KATEGORI BARU', volume: 0, satuan: '', hargaSatuan: 0, keterangan: '', isEditing: true, isSaved: false, isNew: true }]); setHasUnsavedChanges(true); };
    const handleAddItem = () => { setDetailItems([...detailItems, { id: `item-${Date.now()}`, type: 'item', uraianPekerjaan: '', volume: 1.00, satuan: '', hargaSatuan: 0, keterangan: '', isEditing: true, isSaved: false, priceSource: 'manual', isNew: true }]); setHasUnsavedChanges(true); };
    
    const handleAddSubItem = useCallback((parentId: string) => {
        setDetailItems(currentItems => {
            const parentIndex = currentItems.findIndex(i => i.id === parentId);
            if (parentIndex === -1) return currentItems;
    
            const parentItem = currentItems[parentIndex];
            const newType = parentItem.type === 'category' ? 'category' : 'item';
            const newUraian = newType === 'category' ? 'SUB KATEGORI BARU' : 'Sub Item Baru';
    
            const parentIndent = parentItem.indent || 0;
            const newIndent = parentIndent + 1;
            
            let insertAtIndex = parentIndex + 1;
            // Find the end of the parent's children block
            while (
                insertAtIndex < currentItems.length && 
                (currentItems[insertAtIndex].indent || 0) > parentIndent
            ) {
                insertAtIndex++;
            }
    
            const newSubItem: RabDetailItem = {
                id: `${newType}-${Date.now()}`,
                type: newType,
                uraianPekerjaan: newUraian,
                volume: newType === 'item' ? 1.00 : 0,
                satuan: '',
                hargaSatuan: 0,
                keterangan: '',
                isEditing: true,
                isSaved: false,
                priceSource: newType === 'item' ? 'manual' : undefined,
                isNew: true,
                indent: newIndent,
            };
            
            const newItems = [...currentItems];
            newItems.splice(insertAtIndex, 0, newSubItem);
            return newItems;
        });
        setHasUnsavedChanges(true);
    }, []);

    const handleToggleDeleteItem = useCallback((id: string) => {
        const item = detailItems.find(i => i.id === id);
        if (!item) return;

        setDetailItems(currentItems =>
            currentItems.map(i =>
                i.id === id ? { ...i, isDeleted: !i.isDeleted } : i
            )
        );
        setHasUnsavedChanges(true);
        toast.success(item.isDeleted ? `"${item.uraianPekerjaan}" dipulihkan.` : `"${item.uraianPekerjaan}" ditandai untuk dihapus.`);
    }, [detailItems]);

    const handleMoveRow = useCallback((index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= detailItems.length) return;
        setDetailItems(items => { const reorderedItems = [...items]; const [movedItem] = reorderedItems.splice(index, 1); reorderedItems.splice(newIndex, 0, movedItem); return reorderedItems; });
        setHasUnsavedChanges(true);
    }, [detailItems]);

    const handleManageAhs = useCallback((id: string) => {
        const item = detailItems.find(i => i.id === id);
        if (item) {
            setEditingAhsItem(item);
        }
    }, [detailItems]);

    const handleSaveAhs = useCallback((
        itemId: string,
        newAhs: AhsComponent[],
        newUnitPrice: number,
        pph: number,
        overhead: number,
        margin: number
    ) => {
        // Update the item in the current BQ detail
        setDetailItems(items => items.map(item => {
            if (item.id === itemId) {
                return { ...item, ahs: newAhs, hargaSatuan: newUnitPrice, pph, overhead, margin, priceSource: 'ahs' };
            }
            return item;
        }));
        
        setHasUnsavedChanges(true);
        setEditingAhsItem(null);
        toast.success('AHS berhasil diperbarui!');
    }, []);

    // --- Pricing Logic Implementation ---

    const handleStartAhsCreationWithAiForMissing = async (itemId: string) => {
        setIsMissingItemsModalOpen(false); // Close current modal
        const item = detailItems.find(i => i.id === itemId);
        if (!item) return;

        const toastId = toast.loading('Membuat AHS dengan AI...');
        setDetailItems(current => current.map(i => i.id === itemId ? { ...i, isPricingLoading: true } : i));

        try {
            const newAhs = await generateAhsForSingleItem(item.uraianPekerjaan);
            if (newAhs.length > 0) {
                setDetailItems(current => current.map(i => i.id === itemId ? { ...i, ahs: newAhs, isPricingLoading: false } : i));
                handleManageAhs(itemId); // Open the editor for review
                toast.success('AHS dibuat! Silakan periksa dan simpan.', { id: toastId });
            } else {
                 toast.error('AI tidak dapat membuat AHS untuk pekerjaan ini.', { id: toastId });
                 setDetailItems(current => current.map(i => ({ ...i, isPricingLoading: false })));
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal membuat AHS.', { id: toastId });
            setDetailItems(current => current.map(i => ({ ...i, isPricingLoading: false })));
        }
    };
    
    // --- BQ Generation Logic ---
    const handleGeneratedBq = (
        generatedItems: Omit<RabDetailItem, 'id' | 'isEditing' | 'isSaved'>[],
        projectDetails: { projectName: string, workDuration: number }
    ) => {
        const newItems = generatedItems.map((item, index) => ({
            ...item,
            id: `${item.type}-${Date.now()}-${index}`,
            isEditing: false,
            isSaved: true,
            isNew: true, // Mark as new
            hargaSatuan: 0,
            keterangan: item.keterangan || '',
            ahs: [],
        }));

        setDetailItems(newItems);
        // Also update the main BQ info
        setBq(prevBq => prevBq ? { ...prevBq, projectName: projectDetails.projectName } : null);
        setWorkDuration(projectDetails.workDuration);

        setHasUnsavedChanges(true);
        setIsGenerateModalOpen(false);
        toast.success('BQ berhasil digenerate! Jangan lupa untuk menyimpan perubahan.');
    };

    // --- Export & Save Functions ---

    const generatePdf = useCallback((outputType: 'save' | 'datauristring' = 'save') => {
        if (!bq) return null;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageMargin = 14;

        // --- 1. HEADER ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('BILL OF QUANTITY (BQ)', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(bq.projectName, pageWidth / 2, 27, { align: 'center' });

        doc.setFontSize(8);
        const infoText = `eMPR: ${bq.eMPR}  |  Revisi: ${revisionText}`;
        doc.text(infoText, pageWidth / 2, 32, { align: 'center' });

        // --- 2. TABLE ---
        const formatVol = (val: number | null) => {
            if (val === null) return '';
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
        };
        
        const boldStyle = { fontStyle: 'bold' };
        const headerBgColor: [number, number, number] = [243, 244, 246];
        const categoryBgColor: [number, number, number] = [229, 231, 235];
        const defaultTextColor: [number, number, number] = [15, 23, 42];
        const borderColor: [number, number, number] = [203, 213, 225];

        const head = [['NO', 'URAIAN PEKERJAAN', 'SAT', 'VOL', 'KETERANGAN']];
        
        const displayedItems = sourceItems.filter(item => !item.isDeleted);

        const body = displayedItems.map(item => {
            let uraianText = item.uraianPekerjaan;
            if (item.isNew && !item.isDeleted) uraianText = `(BARU) ${uraianText}`;
            if (item.isDeleted) uraianText = `(DIHAPUS) ${uraianText}`;

            let rowData;
            const itemNumber = itemNumbers.get(item.id) || '';

            if (item.type === 'category') {
                rowData = [
                    { content: itemNumber, styles: boldStyle },
                    { content: uraianText, styles: boldStyle },
                    '', '', 
                    { content: item.keterangan || '', styles: boldStyle }
                ];
            } else {
                rowData = [
                    itemNumber,
                    uraianText,
                    item.satuan,
                    formatVol(item.volume),
                    item.keterangan || ''
                ];
            }
             (rowData as any).isNew = item.isNew;
            (rowData as any).isDeleted = item.isDeleted;
            (rowData as any).isCategory = item.type === 'category';
            (rowData as any).indent = item.indent || 0;
            return rowData;
        });

        autoTable(doc, {
            startY: 38,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: headerBgColor, textColor: defaultTextColor, fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 7.5 },
            styles: { fontSize: 7.5, cellPadding: 2, valign: 'top', lineWidth: 0.1, lineColor: borderColor },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' }, 
                1: { cellWidth: 85, halign: 'left' }, 
                2: { halign: 'center', cellWidth: 15 }, 
                3: { halign: 'right', cellWidth: 15 }, 
                4: { halign: 'left', cellWidth: 'auto' },
            },
            didParseCell: (data) => {
                const rawData = data.row.raw as any;
                 if(data.column.index === 1 && rawData.indent > 0) {
                     data.cell.styles.cellPadding = { ...data.cell.styles.cellPadding as any, left: (data.cell.styles.cellPadding as any).left + rawData.indent * 4 };
                }
                 if (rawData.isCategory) {
                    data.cell.styles.fillColor = categoryBgColor;
                    data.cell.styles.textColor = defaultTextColor;
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rawData.isNew && !rawData.isDeleted) data.cell.styles.fillColor = [220, 252, 231];
                if (rawData.isDeleted) data.cell.styles.textColor = [220, 38, 38];
            },
            didDrawCell: (data) => {
                const { cell, doc } = data;
                const rawData = data.row.raw as any;
                if (rawData.isDeleted && data.section === 'body') {
                    doc.setDrawColor(220, 38, 38);
                    doc.setLineWidth(0.2);
                    const textLines = Array.isArray(cell.text) ? cell.text : [cell.text as string];
                    const fontSize = cell.styles.fontSize;
                    const k = doc.internal.scaleFactor;
                    const lineHeight = fontSize * 1.15 / k;
                    const textBlockHeight = textLines.length * lineHeight;
                    let startY = cell.y + cell.padding('top');
                    if (cell.styles.valign === 'middle') startY += (cell.height - cell.padding('vertical') - textBlockHeight) / 2;
                    else if (cell.styles.valign === 'bottom') startY += cell.height - cell.padding('vertical') - textBlockHeight;
                    textLines.forEach((line: string, i: number) => {
                        const textWidth = doc.getTextWidth(line);
                        let startX = cell.x + cell.padding('left');
                        if (cell.styles.halign === 'center') startX = cell.x + (cell.width / 2) - (textWidth / 2);
                        else if (cell.styles.halign === 'right') startX = cell.x + cell.width - textWidth - cell.padding('right');
                        const lineY = startY + (i * lineHeight) + (fontSize * 0.35 / k);
                        doc.line(startX, lineY, startX + textWidth, lineY);
                    });
                }
            },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Halaman ${data.pageNumber}`, pageWidth - pageMargin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        
        // --- 4. FOOTER INFO ---
        let footerY = finalY + 12;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const line1 = `BQ ini dibuat oleh ${creatorName} dan disetujui secara elektronik oleh ${approverName}.`;
        const line2 = `Dokumen BQ ini diterbitkan oleh sistem dan tidak membutuhkan tanda tangan dari Pejabat PT Astra Honda Motor.`;
        const line3 = `Lama Pekerjaan: ${workDuration || '-'} hari kalender.`;
        
        const fullText = `${line1}\n${line2}\n\n${line3}`;
        const splitText = doc.splitTextToSize(fullText, pageWidth - (pageMargin * 2));
        doc.text(splitText, pageMargin, footerY);
        
        if (outputType === 'save') {
            doc.save(`BQ-${bq.eMPR}-${bq.projectName.replace(/\s/g, '_')}.pdf`);
            return null;
        } else {
            return doc.output('datauristring');
        }
    }, [bq, sourceItems, creatorName, approverName, workDuration, revisionText, itemNumbers]);


    const handleSaveData = () => {
        if (!bq) return;
        setIsSubmitting(true);
        const itemsToSave = detailItems.filter(item => !item.isDeleted);
        const finalItems = itemsToSave.map(item => {
            const { isNew, isDeleted, ...rest } = item;
            return { ...rest, isEditing: false, isSaved: true, isPricingLoading: false };
        });

        const updatedBq: RabDocument = { ...bq, detailItems: finalItems, pdfReady: true, creatorName, approverName, workDuration: Number(workDuration) || undefined, revisionText };
        
        setTimeout(() => {
            setBqData(prevBqData => prevBqData.map(r => r.id === bqId ? updatedBq : r));
            setDetailItems(finalItems);
            setHasUnsavedChanges(false);
            setIsSubmitting(false);
            toast.success('BQ berhasil disimpan!');
        }, 500);
    };

    const handleConfirmLock = () => {
        if (!bq) return;
        setIsLockConfirmOpen(false);
        setIsSubmitting(true);

        const updatedBq: RabDocument = { 
            ...bq,
            isLocked: true, 
            status: 'Selesai',
            detailItems: detailItems.map(item => ({ ...item, isEditing: false, isSaved: true, isPricingLoading: false })),
            creatorName,
            approverName,
            workDuration: Number(workDuration) || undefined,
            revisionText
        };
        
        setTimeout(() => {
            setBqData(prevBqData => prevBqData.map(r => r.id === bqId ? updatedBq : r));
            setHasUnsavedChanges(false);
            setIsSubmitting(false);
            toast.success('BQ berhasil dikunci dan ditandai Selesai!');
        }, 300);
    };

    const handleStartRevision = () => {
        if (!bq) return;

        const newRevision = {
            timestamp: new Date().toISOString(),
            items: detailItems,
        };

        const history = [...(bq.revisionHistory || []), newRevision];
        const newRevisionText = `Revisi ${history.length}`;
        
        const updatedBq = {
            ...bq,
            isLocked: false,
            status: 'Pending' as const,
            revisionHistory: history,
            revisionText: newRevisionText,
        };
        
        setBq(updatedBq);
        setRevisionText(newRevisionText);
        setHasUnsavedChanges(true);
        setViewingRevisionIndex('current');

        toast.success('Mode revisi aktif. Lakukan perubahan lalu klik Simpan.');
    };

    const handleExportPdf = () => {
        toast.promise(
            new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        generatePdf('save');
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }, 250);
            }),
            {
                loading: 'Membuat PDF...',
                success: 'PDF berhasil diunduh!',
                error: 'Gagal membuat PDF.',
            }
        );
    };

    const handleDownloadTemplate = () => {
        const instructionHeaders = [
            ['PETUNJUK PENGISIAN TEMPLATE BQ'],
            ['1. KATEGORI: Tulis dengan HURUF BESAR pada kolom "Uraian Pekerjaan".'],
            ['2. ITEM PEKERJAAN: Tulis dengan format normal di bawah kategori yang sesuai.'],
            ['3. Jangan mengubah atau menghapus baris header di bawah ini (baris 5).'],
        ];

        const mainHeaders = [['Uraian Pekerjaan', 'Satuan', 'Volume', 'Keterangan']];

        const examples = [
            ['PEKERJAAN PERSIAPAN', '', '', 'Ini adalah contoh KATEGORI'],
            ['Pembersihan Lokasi dan Pematokan', 'Ls', 1, 'Contoh item pekerjaan'],
            ['PEKERJAAN STRUKTUR', '', '', 'Contoh KATEGORI lainnya'],
            ['Pekerjaan Pondasi Tiang Pancang', 'm3', 100, 'Beton K-225'],
            ['Pekerjaan Struktur Beton Bertulang', 'm3', 150.5, 'Beton K-300'],
        ];
        
        const sheetData = [ ...instructionHeaders, [], ...mainHeaders, ...examples ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws['!cols'] = [ { wch: 60 }, { wch: 10 }, { wch: 15 }, { wch: 40 } ];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template BQ");
        XLSX.writeFile(wb, "Template_BQ.xlsx");
        toast.success("Template Excel telah diunduh!");
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

                if (!json || json.length < 1) {
                    toast.error("File Excel kosong atau tidak valid.");
                    return;
                }
                
                const headerRowIndex = json.findIndex(row => 
                    row[0]?.toString().trim() === 'Uraian Pekerjaan' &&
                    row[1]?.toString().trim() === 'Satuan'
                );

                if(headerRowIndex === -1){
                    toast.error("Format template tidak sesuai. Header tidak ditemukan.");
                    return;
                }
                
                const dataRows = json.slice(headerRowIndex + 1);

                const newItems: RabDetailItem[] = dataRows.map((row, index) => {
                    const uraian = String(row[0] || '');
                    const volume = parseFloat(String(row[2] || '0').replace(',', '.'));
                    const isCategory = !volume && uraian === uraian.toUpperCase() && uraian.trim() !== '';
                    
                    const itemType: 'category' | 'item' = isCategory ? 'category' : 'item';

                    return {
                        id: `${isCategory ? 'cat' : 'item'}-${Date.now()}-${index}`,
                        type: itemType,
                        uraianPekerjaan: uraian,
                        volume: isCategory ? 0 : volume,
                        satuan: isCategory ? '' : String(row[1] || ''),
                        hargaSatuan: 0,
                        keterangan: String(row[3] || ''),
                        isEditing: false,
                        isSaved: true,
                    };
                }).filter(item => item.uraianPekerjaan.trim() !== '');

                setDetailItems(newItems);
                setHasUnsavedChanges(true);
                toast.success('Data berhasil diimpor dari Excel!');
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                toast.error("Gagal mengimpor file Excel. Pastikan formatnya benar.");
            } finally {
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleOpenApprovalModal = () => {
        const toastId = toast.loading('Menyiapkan PDF...');
        setTimeout(() => {
            try {
                const uri = generatePdf('datauristring');
                if (uri) {
                    setPdfPreviewUri(uri);
                    setIsApprovalModalOpen(true);
                    toast.success('PDF siap untuk dikirim.', { id: toastId });
                } else {
                     throw new Error("PDF URI is null");
                }
            } catch (e) {
                console.error("Failed to generate PDF for approval", e);
                toast.error('Gagal membuat PDF.', { id: toastId });
            }
        }, 50);
    };

    const handleSendApprovalEmail = ({ to, cc, subject, body }: { to: string, cc: string, subject: string, body: string }) => {
        if (!bq) return;

        const updatedBq = {
            ...bq,
            status: 'Menunggu Approval' as const,
            approvalRequestDetails: {
                requestedAt: new Date().toISOString(),
                requestedBy: 'Admin', 
                sentTo: to,
            },
            detailItems: detailItems.map(item => ({ ...item, isEditing: false, isSaved: true, isPricingLoading: false })),
            creatorName,
            approverName,
            workDuration: Number(workDuration) || undefined,
            revisionText,
        };
        setBqData(prev => prev.map(r => r.id === bqId ? updatedBq : r));
        setBq(updatedBq); // update local state as well
        setHasUnsavedChanges(false);

        setIsApprovalModalOpen(false);
        toast.success('BQ telah ditandai "Menunggu Approval".');

        let mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if (cc) {
            mailtoLink += `&cc=${encodeURIComponent(cc)}`;
        }
        window.open(mailtoLink, '_blank');
    };

    const handleCloseAhsEditor = useCallback(() => {
        setEditingAhsItem(null);
    }, []);
    
    const handleCloseMissingItemsModal = useCallback(() => {
        setIsMissingItemsModalOpen(false);
    }, []);

    if (!bq) return <div className="text-center p-8 bg-gray-100 dark:bg-gray-900 h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32}/></div>;
    
    const inlineInputClass = "bg-transparent border-b border-gray-400/50 dark:border-gray-500/50 focus:border-honda-red focus:ring-0 focus:outline-none p-0 mx-1";

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'dark:bg-gray-700 dark:text-white' }}/>
            <GenerateBqModal 
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                onComplete={handleGeneratedBq}
                currentProjectName={bq?.projectName}
            />
            {editingAhsItem && (
                 <AhsEditorModal
                    isOpen={!!editingAhsItem}
                    onClose={handleCloseAhsEditor}
                    item={editingAhsItem}
                    onSave={handleSaveAhs}
                    priceDatabase={priceDatabase}
                    setPriceDatabase={setPriceDatabase}
                    workItems={workItems}
                    setWorkItems={setWorkItems}
                />
            )}
            <MissingItemsModal 
                isOpen={isMissingItemsModalOpen} 
                onClose={handleCloseMissingItemsModal} 
                missingItems={missingWorkItems} 
                onStartAhsCreation={() => {}}
                onStartAhsCreationWithAi={handleStartAhsCreationWithAiForMissing}
            />
            <ApprovalModal 
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                onSend={handleSendApprovalEmail}
                rab={bq}
                pdfDataUri={pdfPreviewUri}
            />
             <ConfirmationModal 
                isOpen={isLockConfirmOpen}
                onClose={() => setIsLockConfirmOpen(false)}
                onConfirm={handleConfirmLock}
                title="Kunci BQ"
                message="Apakah Anda yakin ingin mengunci BQ ini? Setelah dikunci, seluruh isian tidak dapat diubah kecuali dilakukan revisi."
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg no-print">
                    <header className="text-center mb-6 border-b dark:border-gray-700 pb-6 relative">
                        {bq.isLocked && (
                            <div className="absolute top-0 left-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                                <Lock size={12}/>
                                <span>BQ Terkunci</span>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">BILL OF QUANTITY (BQ)</h1>
                        <p className="text-md text-gray-600 dark:text-gray-400 mt-2">{bq.projectName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">eMPR: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">{bq.eMPR}</span></p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic flex items-center justify-center">
                            Revisi:
                            <input
                                type="text"
                                value={revisionText}
                                onChange={(e) => { setRevisionText(e.target.value); setHasUnsavedChanges(true); }}
                                readOnly={effectiveIsLocked}
                                className="bg-transparent border-b border-gray-400/50 dark:border-gray-500/50 focus:border-honda-red focus:ring-0 focus:outline-none p-0 mx-1 w-24 text-center text-xs italic read-only:border-transparent read-only:cursor-default"
                            />
                        </p>
                    </header>
                    
                     {bq.revisionHistory && bq.revisionHistory.length > 0 && (
                        <div className="mb-6 border-b-2 border-gray-200 dark:border-gray-700">
                            <nav className="-mb-0.5 flex space-x-6" aria-label="Revisions">
                                {bq.revisionHistory.map((revision, index) => {
                                    const revisionName = index === 0 ? "BQ Awal" : `BQ Rev-${index}`;
                                    return (
                                        <button
                                            key={revision.timestamp}
                                            onClick={() => setViewingRevisionIndex(index)}
                                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                                viewingRevisionIndex === index
                                                    ? 'border-honda-red text-honda-red'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {revisionName}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setViewingRevisionIndex('current')}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                        viewingRevisionIndex === 'current'
                                            ? 'border-honda-red text-honda-red'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-500'
                                    }`}
                                >
                                    {bq.revisionText || "Versi Saat Ini"}
                                    {viewingRevisionIndex === 'current' && <span className="text-green-600 font-semibold ml-2">(Dapat Diedit)</span>}
                                </button>
                            </nav>
                        </div>
                    )}


                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-2">
                            <button onClick={handleAddCategory} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Kategori</button>
                            <button onClick={handleAddItem} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Baris</button>
                        </div>
                         <div className="flex items-center gap-3">
                             <button onClick={() => setIsGenerateModalOpen(true)} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                                <Wand2 size={14} /> Generate BQ
                            </button>
                             <div className="relative" ref={fileActionsMenuRef}>
                                <button
                                    onClick={() => setIsFileActionsOpen(p => !p)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition"
                                >
                                    <FileText size={14} />
                                    Opsi File
                                    <ChevronDown size={14} className={`transition-transform ${isFileActionsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isFileActionsOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-1">
                                        <button 
                                            onClick={() => { fileInputRef.current?.click(); setIsFileActionsOpen(false); }} 
                                            disabled={effectiveIsLocked}
                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Upload size={14} /> Import dari Excel
                                        </button>
                                        <button 
                                            onClick={() => { handleDownloadTemplate(); setIsFileActionsOpen(false); }}
                                            disabled={effectiveIsLocked}
                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Download size={14} /> Download Template
                                        </button>
                                        <button 
                                            onClick={() => { handleExportPdf(); setIsFileActionsOpen(false); }} 
                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                            <FileDown size={14} /> Export ke PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800/30 shadow-inner">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-sm align-top text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-2 py-2 w-20 text-center font-semibold text-sm">No.</th>
                                    <th className="px-2 py-2 min-w-[300px] font-semibold text-center text-sm">Uraian Pekerjaan</th>
                                    <th className="px-2 py-2 w-24 text-center font-semibold text-sm">Sat</th>
                                    <th className="px-2 py-2 w-28 text-center font-semibold text-sm">Vol</th>
                                    <th className="px-2 py-2 min-w-[150px] font-semibold text-center text-sm">Keterangan</th>
                                    <th className="px-2 py-2 w-20 text-center font-semibold text-sm">AKSI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((item, index) => (
                                    <BqDetailRow 
                                        key={item.id} 
                                        item={item}
                                        itemNumberString={itemNumbers.get(item.id) || ''}
                                        rowIndex={sourceItems.findIndex(d => d.id === item.id)} 
                                        totalRows={sourceItems.length} 
                                        onUpdate={handleItemChange} 
                                        onToggleDelete={handleToggleDeleteItem} 
                                        onToggleEdit={handleToggleEdit} 
                                        onSaveRow={handleSaveRow} 
                                        onMove={handleMoveRow} 
                                        isLocked={effectiveIsLocked}
                                        onAddSubItem={handleAddSubItem}
                                     />
                                 ))}
                            </tbody>
                        </table>
                    </div>

                    
                    <div className="mt-8 border-t dark:border-gray-700 pt-6">
                        <div className="flex items-start text-xs italic text-gray-500 dark:text-gray-400">
                            <FileText size={18} className="mr-3 flex-shrink-0 mt-0.5 text-gray-400" />
                            <div className="space-y-1">
                                <p>BQ ini dibuat oleh <input type="text" value={creatorName} onChange={(e) => { setCreatorName(e.target.value); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-32 read-only:border-transparent read-only:cursor-default`} />
                                dan disetujui secara elektronik oleh <input type="text" value={approverName} onChange={(e) => { setApproverName(e.target.value); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-32 read-only:border-transparent read-only:cursor-default`} />.</p>
                                <p>Dokumen BQ ini diterbitkan oleh sistem dan tidak membutuhkan tanda tangan dari Pejabat PT Astra Honda Motor.</p>
                                <p>Lama Pekerjaan: <input type="number" value={workDuration} onChange={(e) => { setWorkDuration(e.target.value === '' ? '' : parseInt(e.target.value)); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-16 text-center read-only:border-transparent read-only:cursor-default`} /> hari kalender.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t dark:border-gray-700 gap-3">
                        <button onClick={() => navigate('/bq/daftar')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition w-full md:w-auto justify-center">
                            <ArrowLeft size={16} /> Kembali
                        </button>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {bq.isLocked ? (
                                <button onClick={handleStartRevision} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-lg hover:shadow-orange-500/50">
                                    <Edit size={16}/>
                                    Revisi
                                </button>
                            ) : (
                                <button onClick={() => setIsLockConfirmOpen(true)} disabled={hasUnsavedChanges || isSubmitting || isReadOnlyView} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition shadow-lg hover:shadow-slate-500/50 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed">
                                    <Lock size={16}/>
                                    Kunci
                                </button>
                            )}
                             <button onClick={handleOpenApprovalModal} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed" disabled={hasUnsavedChanges || isSubmitting || effectiveIsLocked}>
                                <Send size={16} />
                                <span>Kirim</span>
                            </button>
                            <button onClick={handleSaveData} disabled={!hasUnsavedChanges || isSubmitting || effectiveIsLocked} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-destructive rounded-lg hover:bg-destructive/90 transition shadow-lg disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Simpan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                     {hasUnsavedChanges && !bq.isLocked && <div className="text-center text-yellow-600 dark:text-yellow-400 text-xs mt-3">Ada perubahan yang belum disimpan. Mohon simpan terlebih dahulu.</div>}
                </div>
            </div>
        </div>
    );
};

export default BqDetail;
