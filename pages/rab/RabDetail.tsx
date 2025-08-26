










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
    if (amount === null || typeof amount === 'undefined' || isNaN(amount) || amount === 0) return '';
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

// --- HELPER COMPONENTS (Moved from inside RabDetail) ---

const PriceSourceIndicator = ({ source }: { source?: RabDetailItem['priceSource'] }) => {
    const styles = {
        db: { icon: <Database size={10} />, text: 'DB', className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
        ahs: { icon: <Calculator size={10} />, text: 'AHS', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
        combined: { icon: <Layers size={10} />, text: 'Gabungan', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
        manual: { icon: <Pencil size={10} />, text: 'Manual', className: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-400' },
    };
    if (!source || !styles[source]) return null;
    const current = styles[source];
    return <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${current.className}`}>{current.icon}{current.text}</span>;
}

const PriceSourceDropdown = ({ item, onSelectSource, onManageAhs, isLocked }: { item: RabDetailItem, onSelectSource: (source: RabDetailItem['priceSource']) => void, onManageAhs: () => void, isLocked: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (source: RabDetailItem['priceSource']) => {
        onSelectSource(source);
        setIsOpen(false);
    }
    
    return (
        <div className="relative w-full" ref={menuRef}>
            <button
                onClick={() => setIsOpen(p => !p)}
                disabled={isLocked || item.isDeleted}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <PriceSourceIndicator source={item.priceSource || 'manual'} />
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && !isLocked && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-1">
                    <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Sumber Harga</div>
                    <button onClick={() => handleSelect('db')} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Database size={14} /> Gunakan Database</button>
                    <button onClick={() => handleSelect('ahs')} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Calculator size={14} /> Gunakan AHS</button>
                    <button onClick={() => handleSelect('combined')} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Layers size={14} /> Gabungan (DB &rarr; AHS)</button>
                    <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                     <button onClick={() => { onManageAhs(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><SlidersHorizontal size={14} /> Atur/Edit AHS</button>
                </div>
            )}
        </div>
    );
};

const PriceSourceModal = ({ isOpen, onClose, onApply }: { isOpen: boolean, onClose: () => void, onApply: (source: RabDetailItem['priceSource']) => void }) => {
    const [source, setSource] = useState<RabDetailItem['priceSource']>('combined');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tentukan Sumber Harga</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pilih metode pengambilan harga satuan untuk seluruh pekerjaan dalam RAB ini.</p>
                <div className="space-y-3">
                    <label className="flex items-center p-3 border dark:border-gray-700 rounded-lg cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-600 transition">
                        <input type="radio" name="price-source" value="db" checked={source === 'db'} onChange={() => setSource('db')} className="h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Gunakan Database</span>
                    </label>
                     <label className="flex items-center p-3 border dark:border-gray-700 rounded-lg cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-600 transition">
                        <input type="radio" name="price-source" value="ahs" checked={source === 'ahs'} onChange={() => setSource('ahs')} className="h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Gunakan AHS</span>
                    </label>
                     <label className="flex items-center p-3 border dark:border-gray-700 rounded-lg cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-600 transition">
                        <input type="radio" name="price-source" value="combined" checked={source === 'combined'} onChange={() => setSource('combined')} className="h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Gabungan (Utama Database &rarr; Cadangan AHS)</span>
                    </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                    <button onClick={() => onApply(source)} className="px-4 py-2 text-sm font-semibold text-white bg-destructive rounded-lg hover:bg-destructive/90 transition shadow">Terapkan</button>
                </div>
            </div>
        </div>
    )
}

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

interface RabDetailRowProps {
    item: RabDetailItem;
    itemNumberString: string;
    rowIndex: number;
    totalRows: number;
    onUpdate: (id: string, field: keyof RabDetailItem, value: any) => void;
    onToggleDelete: (id: string) => void;
    onToggleEdit: (id: string) => void;
    onSaveRow: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onManageAhs: (id: string) => void;
    onApplyLocalPriceSource: (itemId: string, source: RabDetailItem['priceSource']) => void;
    categorySubtotals: Map<string, number>;
    isLocked: boolean;
    onAddSubItem: (id: string) => void;
}

const RabDetailRow = React.memo(({ item, itemNumberString, rowIndex, totalRows, onUpdate, onToggleDelete, onToggleEdit, onSaveRow, onMove, onManageAhs, onApplyLocalPriceSource, categorySubtotals, isLocked, onAddSubItem }: RabDetailRowProps) => {
    const inputClasses = "w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-destructive focus:border-transparent transition bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-xs placeholder-gray-400";
    const viewClasses = "block px-1 py-1 text-xs";
    const isCategory = item.type === 'category';
    
    const canEdit = !isLocked && item.isEditing && !item.isDeleted;
    const isDeleted = !!item.isDeleted;
    const isNew = !!item.isNew && !item.isEditing && !isDeleted;

    const rowClasses = [
        isCategory ? 'bg-gray-200/70 dark:bg-gray-700/70 font-bold' : 'bg-white dark:bg-gray-800/60',
        'border-b dark:border-gray-700/50 hover:bg-destructive/5 dark:hover:bg-destructive/10 transition-colors duration-200',
        isDeleted ? 'bg-red-50/50 dark:bg-red-900/40 text-red-700 dark:text-red-500 opacity-70' : '',
        isNew ? 'bg-green-50/50 dark:bg-green-900/40' : ''
    ].join(' ');

    const textClasses = isDeleted ? 'line-through' : '';
    
    const indentLevel = item.indent || 0;
    const indentPadding = { paddingLeft: `${indentLevel * 1.5}rem` };

    const addSubItemTitle = item.type === 'category' ? 'Tambah Sub Kategori' : 'Tambah Sub Item';
    
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

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
            <button disabled={isLocked} onClick={() => onToggleDelete(item.id)} className={`p-1 transition-colors ${isDeleted ? 'text-blue-600 hover:text-blue-500' : 'text-gray-500 hover:text-destructive dark:hover:text-red-400'} disabled:opacity-30 disabled:cursor-not-allowed`} title={isDeleted ? "Pulihkan Baris" : "Hapus Baris"}>
                 {isDeleted ? <RotateCcw size={12}/> : <Trash2 size={12}/>}
            </button>
        </div>
    );

    const moveButtons = (
        <div className="flex items-center justify-center gap-x-1 h-full">
            <span className={`text-xs text-gray-800 dark:text-gray-300 w-10 text-center ${isCategory ? 'font-bold' : ''}`}>{itemNumberString}</span>
            <div className="flex flex-col">
                <button onClick={() => onMove(rowIndex, 'up')} disabled={isLocked || rowIndex === 0} className="p-0.5 text-gray-400 hover:text-destructive disabled:opacity-20 disabled:cursor-not-allowed" title="Pindah Atas"><ArrowUp size={10} /></button>
                <button onClick={() => onMove(rowIndex, 'down')} disabled={isLocked || rowIndex === totalRows - 1} className="p-0.5 text-gray-400 hover:text-destructive disabled:opacity-20 disabled:cursor-not-allowed" title="Pindah Bawah"><ArrowDown size={10} /></button>
            </div>
        </div>
    );

    return (
        <tr className={rowClasses}>
            <td className="px-1 py-1 text-center align-top w-16">{moveButtons}</td>
            <td className="px-2 py-1 align-top min-w-[300px]" style={indentPadding}>
                {canEdit ? (<AutoResizeTextarea value={item.uraianPekerjaan} onChange={(e) => onUpdate(item.id, 'uraianPekerjaan', e.target.value)} className={`${inputClasses} text-left ${isCategory ? 'font-bold text-xs' : 'text-xs'}`} />) : (<span className={`${viewClasses} ${textClasses}`}>{item.uraianPekerjaan}</span>)}
            </td>
            <td className="px-2 py-1 align-top w-24">
                {canEdit && !isCategory ? (<input type="text" value={item.satuan} onChange={(e) => onUpdate(item.id, 'satuan', e.target.value)} className={`${inputClasses} text-center`} />) : (<span className={`${viewClasses} text-center ${textClasses}`}>{isCategory ? '' : item.satuan}</span>)}
            </td>
            <td className="px-2 py-1 align-top w-28">
                {canEdit && !isCategory ? (
                    <input
                        type="text"
                        defaultValue={item.volume ? item.volume.toString().replace('.', ',') : ''}
                        onKeyDown={handleInputKeyDown}
                        onBlur={(e) => {
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
                        }}
                        className={`${inputClasses} text-right`}
                    />
                ) : (
                    <span className={`${viewClasses} text-right ${textClasses}`}>{isCategory ? '' : (item.volume ? item.volume.toFixed(2).replace('.', ',') : '')}</span>
                )}
            </td>
            <td className="px-2 py-1 align-top w-40 relative">
                {item.isPricingLoading && <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 animate-spin text-destructive" size={14} />}
                 {canEdit && !isCategory ? (
                    <input
                        type="text"
                        defaultValue={item.hargaSatuan ? item.hargaSatuan.toString() : ''}
                        onKeyDown={handleInputKeyDown}
                        onBlur={(e) => {
                            const value = e.currentTarget.value;
                            if (value.startsWith('=')) {
                                const expression = value.substring(1).replace(/,/g, '.');
                                try {
                                    const result = new Function('return ' + expression)();
                                    if (typeof result === 'number' && !isNaN(result)) {
                                        onUpdate(item.id, 'hargaSatuan', Math.round(result));
                                        onUpdate(item.id, 'priceSource', 'manual');
                                    } else {
                                        toast.error('Hasil formula tidak valid.');
                                    }
                                } catch (err) {
                                    toast.error('Formula tidak valid.');
                                }
                            } else {
                                const parsedValue = parseFloat(value.replace(',', '.'));
                                onUpdate(item.id, 'hargaSatuan', isNaN(parsedValue) ? 0 : Math.round(parsedValue));
                                onUpdate(item.id, 'priceSource', 'manual');
                            }
                        }}
                        className={`${inputClasses} text-right`}
                    />
                ) : (
                    <span className={`${viewClasses} text-right ${textClasses}`}>{isCategory ? '' : formatNumber(item.hargaSatuan)}</span>
                )}
            </td>
            <td className={`px-2 py-1 align-top text-right w-44 text-xs ${isCategory ? 'font-bold text-gray-900 dark:text-gray-200' : 'text-gray-800 dark:text-gray-100'} ${textClasses}`}>{formatNumber(isCategory ? (categorySubtotals.get(item.id) || 0) : ((item.volume || 0) * item.hargaSatuan))}</td>
            <td className="px-2 py-1 align-top min-w-[150px]">
                {canEdit ? (<AutoResizeTextarea value={item.keterangan} onChange={(e) => onUpdate(item.id, 'keterangan', e.target.value)} className={`${inputClasses} text-left`} />) : (<span className={`${viewClasses} ${textClasses}`}>{item.keterangan}</span>)}
            </td>
            <td className="px-2 py-1 text-center align-top w-20">{actionButtons}</td>
            <td className="px-2 py-1 text-center align-top w-32">
                {!isCategory && (
                   <PriceSourceDropdown item={item} onSelectSource={(source) => onApplyLocalPriceSource(item.id, source)} onManageAhs={() => onManageAhs(item.id)} isLocked={isLocked}/>
                )}
            </td>
        </tr>
    );
});
RabDetailRow.displayName = 'RabDetailRow';

// --- Main Component ---
const RabDetail = ({ rabData, setRabData, priceDatabase, setPriceDatabase, workItems, setWorkItems }: { rabData: RabDocument[]; setRabData: React.Dispatch<React.SetStateAction<RabDocument[]>>; priceDatabase: PriceDatabaseItem[]; setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>; workItems: WorkItem[]; setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>> }) => {
    const { rabId } = useParams<{ rabId: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileActionsMenuRef = useRef<HTMLDivElement>(null);

    const [rab, setRab] = useState<RabDocument | null>(null);
    const [detailItems, setDetailItems] = useState<RabDetailItem[]>([]);
    const [creatorName, setCreatorName] = useState('');
    const [approverName, setApproverName] = useState('');
    const [workDuration, setWorkDuration] = useState<number | ''>('');
    const [revisionText, setRevisionText] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAhsItem, setEditingAhsItem] = useState<RabDetailItem | null>(null);
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [viewingRevisionIndex, setViewingRevisionIndex] = useState<number | 'current'>('current');


    // State for the new pricing workflow
    const [isPriceSourceModalOpen, setIsPriceSourceModalOpen] = useState(false);
    const [isMissingItemsModalOpen, setIsMissingItemsModalOpen] = useState(false);
    const [missingWorkItems, setMissingWorkItems] = useState<RabDetailItem[]>([]);

    // State for Approval Modal
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);

    // State for file actions dropdown
    const [isFileActionsOpen, setIsFileActionsOpen] = useState(false);

    const isReadOnlyView = viewingRevisionIndex !== 'current';
    const effectiveIsLocked = useMemo(() => rab?.isLocked || isReadOnlyView, [rab?.isLocked, isReadOnlyView]);

    useEffect(() => {
        const currentRab = rabData.find(r => r.id === rabId);
        if (currentRab) {
            setRab(currentRab);
            setDetailItems(JSON.parse(JSON.stringify(currentRab.detailItems || [])));
            setCreatorName(currentRab.creatorName || 'Admin Proyek');
            setApproverName(currentRab.approverName || 'Manajemen');
            setWorkDuration(currentRab.workDuration || '');
            setRevisionText(currentRab.revisionText || 'manual');
            setHasUnsavedChanges(false);
            setViewingRevisionIndex('current');
        } else {
            navigate('/rab/daftar');
        }
    }, [rabId, rabData, navigate]);

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
        if (viewingRevisionIndex === 'current' || !rab?.revisionHistory) {
            return detailItems; // The current state being edited
        }
        // If viewingRevisionIndex is a number, it's an index into the history array.
        return rab.revisionHistory[viewingRevisionIndex]?.items || [];
    }, [detailItems, rab?.revisionHistory, viewingRevisionIndex]);

    const visibleItems = useMemo(() => showDeleted ? sourceItems : sourceItems.filter(item => !item.isDeleted), [sourceItems, showDeleted]);
    
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

    const totalRAB = useMemo(() => sourceItems.reduce((sum, item) => sum + (item.type === 'item' && !item.isDeleted ? (Number(item.volume) * Number(item.hargaSatuan)) : 0), 0), [sourceItems]);

    const categorySubtotals = useMemo(() => {
        const subtotals = new Map<string, number>();
        sourceItems.forEach((item, index) => {
            if (item.type === 'category') {
                let subtotal = 0;
                for (let i = index + 1; i < sourceItems.length; i++) {
                    const nextItem = sourceItems[i];
                    if (nextItem.type === 'category' && (nextItem.indent || 0) <= (item.indent || 0)) {
                        break; 
                    }
                    if (nextItem.type === 'item' && !nextItem.isDeleted) {
                        subtotal += ((nextItem.volume || 0) * nextItem.hargaSatuan);
                    }
                }
                subtotals.set(item.id, subtotal);
            }
        });
        return subtotals;
    }, [sourceItems]);

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
        // Update the item in the current RAB detail
        setDetailItems(items => items.map(item => {
            if (item.id === itemId) {
                return { ...item, ahs: newAhs, hargaSatuan: newUnitPrice, pph, overhead, margin, priceSource: 'ahs' };
            }
            return item;
        }));
        
        // This is a good place to check if the work item should be added to the main DB,
        // but the new feature in the modal handles this interactively.
        // The logic below is now superseded by the button in the modal.

        setHasUnsavedChanges(true);
        setEditingAhsItem(null);
        toast.success('AHS berhasil diperbarui!');
    }, []);

    // --- Pricing Logic Implementation ---

    const applyPrices = useCallback((source: RabDetailItem['priceSource'], itemsToUpdate: RabDetailItem[]) => {
        const itemsWithPrices = itemsToUpdate.map(item => {
            let newPrice = item.hargaSatuan;
            let finalSource = item.priceSource;
            const workItem = workItems.find(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
            
            if (source === 'db') {
                newPrice = workItem!.defaultPrice;
                finalSource = 'db';
            } else if (source === 'ahs') {
                const ahs = workItem?.defaultAhs || item.ahs;
                const basePrice = (ahs || []).reduce((sum, comp) => sum + (comp.quantity * comp.unitPrice), 0);
                const totalPercentage = (item.pph || 0) + (item.overhead || 0) + (item.margin || 0);
                newPrice = basePrice * (1 + totalPercentage / 100);
                finalSource = 'ahs';
            } else if (source === 'combined') {
                 if (workItem) {
                    newPrice = workItem.defaultPrice;
                    finalSource = 'db';
                } else {
                    const basePrice = (item.ahs || []).reduce((sum, comp) => sum + (comp.quantity * comp.unitPrice), 0);
                    const totalPercentage = (item.pph || 0) + (item.overhead || 0) + (item.margin || 0);
                    newPrice = basePrice * (1 + totalPercentage / 100);
                    finalSource = 'ahs';
                }
            }
            return { ...item, hargaSatuan: newPrice, priceSource: finalSource, isPricingLoading: false };
        });

        setDetailItems(currentItems => {
            const newItemsMap = new Map(itemsWithPrices.map(i => [i.id, i]));
            return currentItems.map(item => newItemsMap.get(item.id) || item);
        });

        setHasUnsavedChanges(true);
        toast.success('Harga berhasil diterapkan.');
    }, [workItems]);

    const handleApplyPriceSource = useCallback(async (source: RabDetailItem['priceSource'], itemIds?: string[]) => {
        const allWorkItemsInRAB = detailItems.filter(i => i.type === 'item' && !i.isDeleted);
        const itemsToProcess = itemIds ? allWorkItemsInRAB.filter(i => itemIds.includes(i.id)) : allWorkItemsInRAB;
        if (itemsToProcess.length === 0) return;

        // NEW: Automatic AHS Generation Flow for "Gunakan AHS" on all items
        if (source === 'ahs' && !itemIds) {
            const itemsNeedingAhs = itemsToProcess.filter(item => {
                const workItem = workItems.find(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
                const hasExistingAhs = (item.ahs && item.ahs.length > 0) || (workItem?.defaultAhs && workItem.defaultAhs.length > 0);
                return !hasExistingAhs && item.uraianPekerjaan.trim() !== '';
            });

            let itemsWithGeneratedAhs = [...detailItems];

            if (itemsNeedingAhs.length > 0) {
                setDetailItems(current => current.map(item => itemsNeedingAhs.some(p => p.id === item.id) ? { ...item, isPricingLoading: true } : item));
                
                const generationPromise = Promise.allSettled(
                    itemsNeedingAhs.map(item => generateAhsForSingleItem(item.uraianPekerjaan).then(ahs => ({ id: item.id, ahs, uraian: item.uraianPekerjaan })))
                );
                
                await toast.promise(generationPromise, {
                    loading: `Membuat AHS otomatis untuk ${itemsNeedingAhs.length} item...`,
                    success: 'Pembuatan AHS selesai.',
                    error: 'Gagal membuat AHS untuk beberapa item.'
                });

                const results = await generationPromise;
                let successfulCount = 0;
                const failedItems: string[] = [];

                itemsWithGeneratedAhs = itemsWithGeneratedAhs.map(currentItem => {
                    const result = results.find(res => res.status === 'fulfilled' && res.value.id === currentItem.id);
                    if (result && result.status === 'fulfilled') {
                        if (result.value.ahs.length > 0) {
                            successfulCount++;
                            return { ...currentItem, ahs: result.value.ahs, isPricingLoading: false };
                        }
                        failedItems.push(result.value.uraian);
                        return { ...currentItem, isPricingLoading: false };
                    }
                    // Find corresponding rejected promise if any
                     const rejectedResult = results.find(res => res.status === 'rejected' && res.reason && typeof res.reason === 'object' && 'id' in res.reason && (res.reason as any).id === currentItem.id);
                     if(rejectedResult){
                         return { ...currentItem, isPricingLoading: false };
                     }
                    return currentItem;
                });
                
                setDetailItems(itemsWithGeneratedAhs); // Update state with newly generated AHS and remove loading spinners

                if (failedItems.length > 0) toast.error(`Tidak dapat membuat AHS untuk: ${failedItems.join(', ')}`);
                if (successfulCount > 0) toast.success(`${successfulCount} AHS berhasil dibuat.`);

            } else {
                toast.success("Semua item sudah memiliki AHS.");
            }
            
            // Proceed to apply prices using the potentially updated items
            applyPrices('ahs', itemsWithGeneratedAhs.filter(i => i.type === 'item'));
            return;
        }

        // --- Original logic for DB, Combined, and single-item AHS pricing ---
        setDetailItems(current => current.map(item => itemsToProcess.some(p => p.id === item.id) ? { ...item, isPricingLoading: true } : item));
        
        let missing: RabDetailItem[] = [];
        if (source === 'db' || source === 'combined') {
            missing = itemsToProcess.filter(item => {
                const workItemExists = workItems.some(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
                if (source === 'combined' && !workItemExists) {
                    return !item.ahs || item.ahs.length === 0;
                }
                return !workItemExists;
            });
        }
        if (source === 'ahs' && itemIds) { // only for single item AHS
            missing = itemsToProcess.filter(item => {
                 const workItem = workItems.find(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
                 const ahs = workItem?.defaultAhs || item.ahs;
                 return !ahs || ahs.length === 0;
            });
        }
        
        if (missing.length > 0) {
            setMissingWorkItems(missing);
            setIsMissingItemsModalOpen(true);
            setDetailItems(current => current.map(item => ({...item, isPricingLoading: false })));
            return;
        }

        applyPrices(source, itemsToProcess);

    }, [detailItems, workItems, applyPrices]);
    
    const handleApplyLocalPriceSource = useCallback(async (itemId: string, source: RabDetailItem['priceSource']) => {
        if (source === 'ahs') {
            const item = detailItems.find(i => i.id === itemId);
            if (!item) return;
    
            const workItem = workItems.find(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
            const existingAhs = workItem?.defaultAhs || item.ahs;
    
            if (existingAhs && existingAhs.length > 0) {
                // If AHS exists, just apply it
                handleApplyPriceSource('ahs', [itemId]);
            } else {
                // If AHS does not exist, generate with AI then open modal
                const toastId = toast.loading('Membuat AHS dengan AI...');
                setDetailItems(current => current.map(i => i.id === itemId ? { ...i, isPricingLoading: true } : i));
                try {
                    const newAhs = await generateAhsForSingleItem(item.uraianPekerjaan);
                    if (newAhs.length > 0) {
                        const tempItemWithAhs = { ...item, ahs: newAhs, isPricingLoading: false };
                        setEditingAhsItem(tempItemWithAhs); // This will open the modal
                        toast.success('AHS dibuat! Silakan periksa dan simpan.', { id: toastId });
                    } else {
                         toast.error('AI tidak dapat membuat AHS untuk pekerjaan ini.', { id: toastId });
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Gagal membuat AHS.', { id: toastId });
                } finally {
                    setDetailItems(current => current.map(i => ({ ...i, isPricingLoading: false })));
                }
            }
        } else {
            // For other sources, use the existing logic
            handleApplyPriceSource(source, [itemId]);
        }
    }, [detailItems, workItems, handleApplyPriceSource]);

    const handleApplyGlobalPriceSource = (source: RabDetailItem['priceSource']) => {
        setIsPriceSourceModalOpen(false);
        handleApplyPriceSource(source);
    };
    
    const handleStartAhsCreationForMissing = (itemId: string) => {
        setIsMissingItemsModalOpen(false);
        handleManageAhs(itemId);
    }
    
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
    
    // --- Export & Save Functions ---

    const generatePdf = useCallback((outputType: 'save' | 'datauristring' = 'save') => {
        if (!rab) return null;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageMargin = 14;

        // --- 1. HEADER (with smaller fonts) ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('RENCANA ANGGARAN BIAYA', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(rab.projectName, pageWidth / 2, 27, { align: 'center' });

        doc.setFontSize(8);
        const infoText = `eMPR: ${rab.eMPR}  |  Revisi: ${revisionText}`;
        doc.text(infoText, pageWidth / 2, 32, { align: 'center' });

        // --- 2. TABLE ---
        const formatInt = (val: number) => {
            if (isNaN(val)) return '0';
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
        };
        const formatVol = (val: number | null) => {
            if (val === null) return '';
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
        };
        
        const boldStyle = { fontStyle: 'bold' };
        const headerBgColor: [number, number, number] = [243, 244, 246]; // Corresponds to gray-100
        const categoryBgColor: [number, number, number] = [229, 231, 235]; // Corresponds to gray-200
        const defaultTextColor: [number, number, number] = [15, 23, 42];
        const borderColor: [number, number, number] = [203, 213, 225];

        const head = [['NO', 'URAIAN PEKERJAAN', 'SAT', 'VOL', 'HARGA SATUAN (Rp)', 'JUMLAH\n(Rp)', 'KETERANGAN']];
        
        const displayedItems = showDeleted ? sourceItems : sourceItems.filter(item => !item.isDeleted);

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
                    '', '', '',
                    { content: formatInt(categorySubtotals.get(item.id) || 0), styles: boldStyle },
                    { content: item.keterangan || '', styles: boldStyle }
                ];
            } else {
                rowData = [
                    itemNumber,
                    uraianText,
                    item.satuan,
                    formatVol(item.volume),
                    formatInt(item.hargaSatuan),
                    formatInt((item.volume || 0) * item.hargaSatuan),
                    item.keterangan || ''
                ];
            }
            // Attach temporary flags for styling hook
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
                0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 58, halign: 'left' }, 2: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right', cellWidth: 15 }, 4: { halign: 'right', cellWidth: 25 }, 5: { halign: 'right', cellWidth: 25 }, 6: { halign: 'left', cellWidth: 'auto' },
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
                    if (data.column.index === 5) data.cell.styles.halign = 'right';
                    else if (data.column.index !== 1 && data.column.index !== 6) data.cell.styles.halign = 'center';
                }
                
                if (rawData.isNew && !rawData.isDeleted) {
                    data.cell.styles.fillColor = [220, 252, 231]; // light green
                }

                if (rawData.isDeleted) {
                    data.cell.styles.textColor = [220, 38, 38]; // red
                }
            },
            didDrawCell: (data) => {
                const { cell, doc } = data;
                const rawData = data.row.raw as any;

                if (rawData.isDeleted && data.section === 'body') {
                    doc.setDrawColor(220, 38, 38); // red
                    doc.setLineWidth(0.2);

                    const textLines = Array.isArray(cell.text) ? cell.text : [cell.text as string];
                    const fontSize = cell.styles.fontSize;
                    const k = doc.internal.scaleFactor;
                    const lineHeight = fontSize * 1.15 / k;

                    const textBlockHeight = textLines.length * lineHeight;
                    let startY = cell.y + cell.padding('top');
                    if (cell.styles.valign === 'middle') {
                        startY += (cell.height - cell.padding('vertical') - textBlockHeight) / 2;
                    } else if (cell.styles.valign === 'bottom') {
                        startY += cell.height - cell.padding('vertical') - textBlockHeight;
                    }

                    textLines.forEach((line: string, i: number) => {
                        const textWidth = doc.getTextWidth(line);
                        
                        let startX = cell.x + cell.padding('left');
                        if (cell.styles.halign === 'center') {
                            startX = cell.x + (cell.width / 2) - (textWidth / 2);
                        } else if (cell.styles.halign === 'right') {
                            startX = cell.x + cell.width - textWidth - cell.padding('right');
                        }

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
        
        // --- 3. TOTAL ---
        const totalY = finalY + 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('TOTAL', pageWidth - pageMargin - 50, totalY, { align: 'right' });
        doc.setTextColor(228, 0, 43);
        doc.text(`Rp ${formatInt(totalRAB)}`, pageWidth - pageMargin, totalY, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        // --- 4. FOOTER INFO ---
        let footerY = totalY + 12;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const line1 = `RAB ini dibuat oleh ${creatorName} dan disetujui secara elektronik oleh ${approverName}.`;
        const line2 = `Dokumen RAB ini diterbitkan oleh sistem dan tidak membutuhkan tanda tangan dari Pejabat PT Astra Honda Motor.`;
        const line3 = `Lama Pekerjaan: ${workDuration || '-'} hari kalender.`;
        const line4 = `RAB tidak memperhitungkan kondisi khusus seperti: stock barang kontraktor, lokasi pekerjaan yang sama, vendor penuh, volume kecil, atau durasi tidak normal.`;
        
        const fullText = `${line1}\n${line2}\n\n${line3}\n${line4}`;
        const splitText = doc.splitTextToSize(fullText, pageWidth - (pageMargin * 2));
        doc.text(splitText, pageMargin, footerY);
        
        if (outputType === 'save') {
            doc.save(`RAB-${rab.eMPR}-${rab.projectName.replace(/\s/g, '_')}.pdf`);
            return null;
        } else {
            return doc.output('datauristring');
        }
    }, [rab, sourceItems, totalRAB, creatorName, approverName, workDuration, revisionText, categorySubtotals, showDeleted, itemNumbers]);


    const handleSaveData = () => {
        if (!rab) return;
        setIsSubmitting(true);
        // Filter out soft-deleted items PERMANENTLY before saving
        const itemsToSave = detailItems.filter(item => !item.isDeleted);
        // Clean up isNew flag from the items that will be saved
        const finalItems = itemsToSave.map(item => {
            const { isNew, isDeleted, ...rest } = item;
            return { ...rest, isEditing: false, isSaved: true, isPricingLoading: false };
        });

        const updatedRab: RabDocument = { ...rab, detailItems: finalItems, pdfReady: true, creatorName, approverName, workDuration: Number(workDuration) || undefined, revisionText };
        
        setTimeout(() => {
            setRabData(prevRabData => prevRabData.map(r => r.id === rabId ? updatedRab : r));
            setDetailItems(finalItems);
            setHasUnsavedChanges(false);
            setIsSubmitting(false);
            toast.success('RAB berhasil disimpan!');
        }, 500);
    };

    const handleConfirmLock = () => {
        if (!rab) return;
        setIsLockConfirmOpen(false);
        setIsSubmitting(true);

        const updatedRab: RabDocument = { 
            ...rab,
            isLocked: true, 
            status: 'Selesai',
            detailItems: detailItems.map(item => ({ ...item, isEditing: false, isSaved: true, isPricingLoading: false })),
            creatorName,
            approverName,
            workDuration: Number(workDuration) || undefined,
            revisionText
        };
        
        setTimeout(() => {
            setRabData(prevRabData => prevRabData.map(r => r.id === rabId ? updatedRab : r));
            setHasUnsavedChanges(false);
            setIsSubmitting(false);
            toast.success('RAB berhasil dikunci dan ditandai Selesai!');
        }, 300);
    };

    const handleStartRevision = () => {
        if (!rab) return;

        const newRevision = {
            timestamp: new Date().toISOString(),
            items: detailItems,
        };

        const history = [...(rab.revisionHistory || []), newRevision];
        const newRevisionText = `Revisi ${history.length}`;
        
        const updatedRab = {
            ...rab,
            isLocked: false,
            status: 'Pending' as const,
            revisionHistory: history,
            revisionText: newRevisionText,
        };
        
        setRab(updatedRab);
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
        setIsFileActionsOpen(false);
    };

    const handleDownloadTemplate = () => {
        const instructionHeaders = [
            ['PETUNJUK PENGISIAN TEMPLATE RAB'],
            ['1. KATEGORI: Tulis dengan HURUF BESAR pada kolom "Uraian Pekerjaan". Biarkan kolom "Volume" dan "Harga Satuan" kosong.'],
            ['2. ITEM PEKERJAAN: Tulis dengan format normal di bawah kategori yang sesuai.'],
            ['3. ANGKA: Pastikan kolom "Volume" dan "Harga Satuan" hanya berisi angka (gunakan titik . untuk desimal jika perlu).'],
            ['4. Jangan mengubah atau menghapus baris header di bawah ini (baris 6).'],
        ];

        const mainHeaders = [['Uraian Pekerjaan', 'Satuan', 'Volume', 'Harga Satuan (Rp)', 'Keterangan']];

        const examples = [
            ['PEKERJAAN PERSIAPAN', '', '', '', 'Ini adalah contoh KATEGORI'],
            ['Pembersihan Lokasi dan Pematokan', 'Ls', 1, 5000000, 'Contoh item pekerjaan'],
            ['PEKERJAAN STRUKTUR', '', '', '', 'Contoh KATEGORI lainnya'],
            ['Pekerjaan Pondasi Tiang Pancang', 'm3', 100, 1200000, 'Beton K-225'],
            ['Pekerjaan Struktur Beton Bertulang', 'm3', 150.5, 4500000, 'Beton K-300'],
        ];
        
        const sheetData = [ ...instructionHeaders, [], ...mainHeaders, ...examples ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws['!cols'] = [ { wch: 60 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 40 } ];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template RAB");
        XLSX.writeFile(wb, "Template_RAB.xlsx");
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
                
                // Find the header row to start processing data from the correct place
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
                    const hargaSatuan = parseInt(String(row[3] || '0'));
                    const isCategory = !volume && !hargaSatuan && uraian === uraian.toUpperCase() && uraian.trim() !== '';
                    
                    const itemType: 'category' | 'item' = isCategory ? 'category' : 'item';

                    return {
                        id: `${isCategory ? 'cat' : 'item'}-${Date.now()}-${index}`,
                        type: itemType,
                        uraianPekerjaan: uraian,
                        volume: isCategory ? 0 : volume,
                        satuan: isCategory ? '' : String(row[1] || ''),
                        hargaSatuan: isCategory ? 0 : hargaSatuan,
                        keterangan: String(row[4] || ''),
                        isEditing: false,
                        isSaved: true,
                        priceSource: isCategory ? undefined : 'manual' as const,
                    };
                }).filter(item => item.uraianPekerjaan.trim() !== ''); // Filter out completely empty rows

                setDetailItems(newItems);
                setHasUnsavedChanges(true);
                toast.success('Data berhasil diimpor dari Excel!');
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                toast.error('Gagal mengimpor file Excel. Pastikan formatnya benar.');
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
        if (!rab) return;

        const updatedRab = {
            ...rab,
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
        setRabData(prev => prev.map(r => r.id === rabId ? updatedRab : r));
        setRab(updatedRab); // update local state as well
        setHasUnsavedChanges(false);

        setIsApprovalModalOpen(false);
        toast.success('RAB telah ditandai "Menunggu Approval".');

        let mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if (cc) {
            mailtoLink += `&cc=${encodeURIComponent(cc)}`;
        }
        window.open(mailtoLink, '_blank');
    };

    const handleCloseAhsEditor = useCallback(() => {
        setEditingAhsItem(null);
    }, []);

    const handleClosePriceSourceModal = useCallback(() => {
        setIsPriceSourceModalOpen(false);
    }, []);
    
    const handleCloseMissingItemsModal = useCallback(() => {
        setIsMissingItemsModalOpen(false);
    }, []);

    if (!rab) return <div className="text-center p-8 bg-gray-100 dark:bg-gray-900 h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32}/></div>;
    
    const inlineInputClass = "bg-transparent border-b border-gray-400/50 dark:border-gray-500/50 focus:border-destructive focus:ring-0 focus:outline-none p-0 mx-1";

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'dark:bg-gray-700 dark:text-white' }}/>
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
            <PriceSourceModal isOpen={isPriceSourceModalOpen} onClose={handleClosePriceSourceModal} onApply={handleApplyGlobalPriceSource} />
            <MissingItemsModal 
                isOpen={isMissingItemsModalOpen} 
                onClose={handleCloseMissingItemsModal} 
                missingItems={missingWorkItems} 
                onStartAhsCreation={handleManageAhs}
                onStartAhsCreationWithAi={handleStartAhsCreationWithAiForMissing}
            />
            <ApprovalModal 
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                onSend={handleSendApprovalEmail}
                rab={rab}
                pdfDataUri={pdfPreviewUri}
            />
             <ConfirmationModal 
                isOpen={isLockConfirmOpen}
                onClose={() => setIsLockConfirmOpen(false)}
                onConfirm={handleConfirmLock}
                title="Kunci RAB"
                message="Apakah Anda yakin ingin mengunci RAB ini? Setelah dikunci, seluruh isian tidak dapat diubah kecuali dilakukan revisi."
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg no-print">
                    <header className="text-center mb-6 border-b dark:border-gray-700 pb-6 relative">
                        {rab.isLocked && (
                            <div className="absolute top-0 left-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                                <Lock size={12}/>
                                <span>RAB Terkunci</span>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">RENCANA ANGGARAN BIAYA</h1>
                        <p className="text-md text-gray-600 dark:text-gray-400 mt-2">{rab.projectName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">eMPR: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">{rab.eMPR}</span></p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic flex items-center justify-center">
                            Revisi:
                            <input
                                type="text"
                                value={revisionText}
                                onChange={(e) => { setRevisionText(e.target.value); setHasUnsavedChanges(true); }}
                                readOnly={effectiveIsLocked}
                                className="bg-transparent border-b border-gray-400/50 dark:border-gray-500/50 focus:border-destructive focus:ring-0 focus:outline-none p-0 mx-1 w-24 text-center text-xs italic read-only:border-transparent read-only:cursor-default"
                            />
                        </p>
                    </header>
                    
                     {rab.revisionHistory && rab.revisionHistory.length > 0 && (
                        <div className="mb-6 border-b-2 border-gray-200 dark:border-gray-700">
                            <nav className="-mb-0.5 flex space-x-6" aria-label="Revisions">
                                {rab.revisionHistory.map((revision, index) => {
                                    const revisionName = index === 0 ? "RAB Awal" : `RAB Rev-${index}`;
                                    return (
                                        <button
                                            key={revision.timestamp}
                                            onClick={() => setViewingRevisionIndex(index)}
                                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                                viewingRevisionIndex === index
                                                    ? 'border-destructive text-destructive'
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
                                            ? 'border-destructive text-destructive'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-500'
                                    }`}
                                >
                                    {rab.revisionText || "Versi Saat Ini"}
                                    {viewingRevisionIndex === 'current' && <span className="text-green-600 font-semibold ml-2">(Dapat Diedit)</span>}
                                </button>
                            </nav>
                        </div>
                    )}


                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-2">
                            <button onClick={handleAddCategory} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Kategori</button>
                            <button onClick={handleAddItem} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Baris</button>
                             <div className="flex items-center text-sm ml-4 border-l pl-4 dark:border-gray-600">
                                <input type="checkbox" id="show-deleted" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="show-deleted" className="ml-2 text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                                    Tampilkan item dihapus
                                </label>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
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
                                            onClick={handleExportPdf}
                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                            <FileDown size={14} /> Export ke PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                            <button onClick={() => setIsPriceSourceModalOpen(true)} disabled={effectiveIsLocked} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Zap size={14} /> Generate Harga</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800/30 shadow-inner">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-sm align-top text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-2 py-2 w-16 text-center font-semibold text-sm">No.</th><th className="px-2 py-2 min-w-[300px] font-semibold text-center text-sm">Uraian Pekerjaan</th><th className="px-2 py-2 w-24 text-center font-semibold text-sm">Sat</th><th className="px-2 py-2 w-28 text-center font-semibold text-sm">Vol</th><th className="px-2 py-2 w-40 text-center font-semibold text-sm">Harga Satuan</th><th className="px-2 py-2 w-44 text-center font-semibold text-sm">Jumlah</th><th className="px-2 py-2 min-w-[150px] font-semibold text-center text-sm">Keterangan</th><th className="px-2 py-2 w-20 text-center font-semibold text-sm">AKSI</th><th className="px-2 py-2 w-32 text-center font-semibold text-sm">Sumber Harga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((item, index) => (
                                    <RabDetailRow 
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
                                        onManageAhs={handleManageAhs} 
                                        onApplyLocalPriceSource={handleApplyLocalPriceSource}
                                        categorySubtotals={categorySubtotals}
                                        isLocked={effectiveIsLocked}
                                        onAddSubItem={handleAddSubItem}
                                     />
                                 ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <div className="text-right">
                            <span className="text-md font-semibold text-gray-600 dark:text-gray-400">TOTAL:</span>
                            <span className="text-xl text-red-600 font-bold ml-4">{formatNumber(totalRAB)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 border-t dark:border-gray-700 pt-6">
                        <div className="flex items-start text-xs italic text-gray-500 dark:text-gray-400">
                            <FileText size={18} className="mr-3 flex-shrink-0 mt-0.5 text-gray-400" />
                            <div className="space-y-1">
                                <p>RAB ini dibuat oleh <input type="text" value={creatorName} onChange={(e) => { setCreatorName(e.target.value); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-32 read-only:border-transparent read-only:cursor-default`} />
                                dan disetujui secara elektronik oleh <input type="text" value={approverName} onChange={(e) => { setApproverName(e.target.value); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-32 read-only:border-transparent read-only:cursor-default`} />.</p>
                                <p>Dokumen RAB ini diterbitkan oleh sistem dan tidak membutuhkan tanda tangan dari Pejabat PT Astra Honda Motor.</p>
                                <p>Lama Pekerjaan: <input type="number" value={workDuration} onChange={(e) => { setWorkDuration(e.target.value === '' ? '' : parseInt(e.target.value)); setHasUnsavedChanges(true); }} readOnly={effectiveIsLocked} className={`${inlineInputClass} w-16 text-center read-only:border-transparent read-only:cursor-default`} /> hari kalender.</p>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p className="font-semibold not-italic text-gray-600 dark:text-gray-300">RAB tidak memperhitungkan kondisi khusus seperti:</p>
                            <ol className="list-decimal list-inside pl-2 space-y-0.5 italic">
                                <li>Stock barang kontraktor</li>
                                <li>Lokasi pekerjaan yang ditenderkan sama dengan pekerjaan yang sedang berjalan</li>
                                <li>Vendor sedang penuh atau tidak ada pekerjaan</li>
                                <li>Volume pekerjaan kecil</li>
                                <li>Durasi pekerjaan yang diminta tidak normal</li>
                            </ol>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t dark:border-gray-700 gap-3">
                        <button onClick={() => navigate('/rab/daftar')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition w-full md:w-auto justify-center">
                            <ArrowLeft size={16} /> Kembali
                        </button>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {rab.isLocked ? (
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
                     {hasUnsavedChanges && !rab.isLocked && <div className="text-center text-yellow-600 dark:text-yellow-400 text-xs mt-3">Ada perubahan yang belum disimpan. Mohon simpan terlebih dahulu.</div>}
                </div>
            </div>
        </div>
    );
};

export default RabDetail;
