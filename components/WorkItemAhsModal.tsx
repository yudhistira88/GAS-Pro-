




import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { type WorkItem, type AhsComponent, type PriceDatabaseItem } from '../types';
import { X, Plus, Trash2, Database, Save, CheckCircle, Zap, AlertTriangle, Pencil, Loader2, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateSingleItemPrice, generateAhsForSingleItem } from '../services/geminiService';

interface WorkItemAhsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WorkItem | null;
    onSave: (updatedItem: WorkItem) => void;
    priceDatabase: PriceDatabaseItem[];
}

const formatNumber = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

const SourceIndicator = ({ source }: { source: AhsComponent['source'] }) => {
    const styles = {
        db: { icon: <Database size={12} />, text: 'DB', color: 'text-green-600 dark:text-green-400' },
        ai: { icon: <Zap size={12} />, text: 'AI', color: 'text-blue-500 dark:text-blue-400' },
        manual: { icon: <Pencil size={12} />, text: 'Manual', color: 'text-gray-500 dark:text-gray-400' },
    };
    const current = styles[source] || styles.manual;
    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${current.color} bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full`} title={`Sumber: ${current.text}`}>
            {current.icon}
            <span>{current.text}</span>
        </div>
    );
};

const WorkItemAhsModal = ({ isOpen, onClose, item, onSave, priceDatabase }: WorkItemAhsModalProps) => {
    const [components, setComponents] = useState<AhsComponent[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({});
    const modalRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (item) {
            const initialComponents = (item.defaultAhs || []).map((c, i) => ({
                ...c,
                id: c.id || `ahs-default-${item.id}-${i}`,
                source: c.source || 'manual',
            }));
            setComponents(JSON.parse(JSON.stringify(initialComponents)));
            setLoadingAi({});
            setIsGenerating(false);
        }
    }, [item]);

    const handleComponentChange = (index: number, field: keyof AhsComponent, value: any) => {
        const updatedComponents = [...components];
        const isManualValueEdit = ['unitPrice', 'quantity', 'componentName', 'unit', 'category'].includes(field);
        
        updatedComponents[index] = {
            ...updatedComponents[index],
            [field]: value,
            source: isManualValueEdit ? 'manual' : updatedComponents[index].source,
        };
        setComponents(updatedComponents);
    };

    const handleAddNewComponent = () => {
        setComponents([...components, { id: `ahs-new-${Date.now()}`, componentName: '', quantity: 1, unit: '', unitPrice: 0, category: 'Material', source: 'manual' }]);
    };
    
    const handleAiSearch = async (index: number) => {
        const componentName = components[index]?.componentName;
        if (!componentName || componentName.trim().length < 3) {
            toast.error("Masukkan nama komponen yang valid untuk dicari.");
            return;
        }
        setLoadingAi(prev => ({ ...prev, [index]: true }));
        try {
            const result = await generateSingleItemPrice(componentName);
            if (result.unitPrice > 0) {
                const updatedComponents = [...components];
                updatedComponents[index] = { ...updatedComponents[index], unit: result.unit, unitPrice: result.unitPrice, category: result.category, source: 'ai' };
                setComponents(updatedComponents);
                toast.success(`Estimasi AI untuk "${componentName}" ditemukan.`);
            } else {
                toast.error(`Tidak ditemukan estimasi AI untuk "${componentName}".`);
            }
        } catch (e) { toast.error("Gagal menghubungi AI."); } finally { setLoadingAi(prev => ({ ...prev, [index]: false })); }
    };
    
    const handleDbSearch = (index: number) => {
        const componentName = components[index]?.componentName;
        if (!componentName || componentName.trim().length < 2) {
            toast.error("Masukkan nama komponen untuk dicari di database.");
            return;
        }
        const bestMatch = priceDatabase.find(p => p.itemName.toLowerCase() === componentName.toLowerCase());
        
        if (bestMatch) {
            handleSuggestionSelect(index, bestMatch);
            toast.success(`"${bestMatch.itemName}" ditemukan di database.`);
        } else {
            toast.error(`"${componentName}" tidak ditemukan di database.`);
        }
    };

    const handleRemoveComponent = (index: number) => {
        setComponents(components.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!item) return;
        const updatedItem: WorkItem = {
            ...item,
            defaultAhs: components,
            defaultPrice: basePrice,
            lastUpdated: new Date().toISOString(),
            source: components.length > 0 ? 'AHS' : 'Manual',
        };
        onSave(updatedItem);
    };

    const basePrice = useMemo(() => components.reduce((sum, comp) => sum + (Number(comp.quantity) * Number(comp.unitPrice)), 0), [components]);

    const handleSuggestionSelect = (compIndex: number, suggestion: PriceDatabaseItem) => {
        const updatedComponents = [...components];
        updatedComponents[compIndex] = {
            ...updatedComponents[compIndex],
            componentName: suggestion.itemName,
            unit: suggestion.unit,
            unitPrice: suggestion.unitPrice,
            category: suggestion.category,
            source: 'db',
        };
        setComponents(updatedComponents);
        setActiveSuggestionBox(null);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
             setActiveSuggestionBox(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    const handleGenerateAhsWithAi = async () => {
        if (!item?.name) return;
        setIsGenerating(true);
        const toastId = toast.loading('Membuat AHS dengan AI...');
        try {
            const ahsComponents = await generateAhsForSingleItem(item.name);
            if (ahsComponents.length > 0) {
                setComponents(ahsComponents.map(c => ({...c, source: 'ai'})));
                toast.success('AHS berhasil dibuat oleh AI!', { id: toastId });
            } else {
                toast.error('AI tidak dapat membuat AHS untuk pekerjaan ini.', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan saat menghubungi AI.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen || !item) return null;

    const inputClasses = "w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-xs placeholder-gray-400";
    const allPriceCategories = useMemo(() => Array.from(new Set(priceDatabase.map(p => p.category))), [priceDatabase]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl relative animate-fade-in-up flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                <div className="flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Editor AHS Default</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.name}</p>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                     {components.length === 0 ? (
                         <div className="text-center py-16 px-6 border-2 border-dashed dark:border-gray-700 rounded-lg">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18h.01"></path><path d="M12 15h.01"></path><path d="M12 12h.01"></path></svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">AHS belum dibuat.</h3>
                            <p className="mt-1 text-sm text-gray-500">Buat komponen secara manual atau generate otomatis dengan AI.</p>
                            <div className="mt-6">
                               <button
                                   type="button"
                                   onClick={handleGenerateAhsWithAi}
                                   disabled={isGenerating}
                                   className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                               >
                                    {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                                    {isGenerating ? 'Membuat...' : 'Generate AHS Otomatis'}
                                </button>
                            </div>
                        </div>
                     ) : (
                        <table className="w-full text-sm table-fixed">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-2 py-2 text-left w-[25%]">Komponen</th>
                                    <th className="px-2 py-2 text-center w-[15%]">Kategori</th>
                                    <th className="px-2 py-2 text-center w-[10%]">Kuantitas</th>
                                    <th className="px-2 py-2 text-center w-[10%]">Satuan</th>
                                    <th className="px-2 py-2 text-right w-[15%]">Harga Satuan</th>
                                    <th className="px-2 py-2 text-center w-[15%]">Sumber</th>
                                    <th className="px-2 py-2 text-center w-[10%]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.map((comp, index) => {
                                    const suggestions = priceDatabase.filter(p => p.itemName.toLowerCase().includes(comp.componentName.toLowerCase()) && comp.componentName.trim().length > 1);
                                    return (
                                    <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 align-top">
                                        <td className="px-2 py-1 relative">
                                            <div className="flex items-center gap-1">
                                                <input type="text" placeholder="Nama Material/Jasa..." value={comp.componentName} onChange={(e) => { handleComponentChange(index, 'componentName', e.target.value); setActiveSuggestionBox(index); }} onFocus={() => setActiveSuggestionBox(index)} className={inputClasses} />
                                            </div>
                                            {activeSuggestionBox === index && suggestions.length > 0 && (
                                                <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 border dark:border-gray-600 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                                                    {suggestions.map(s => (<div key={s.id} onClick={() => handleSuggestionSelect(index, s)} className="p-2 text-xs cursor-pointer hover:bg-honda-red hover:text-white dark:hover:bg-honda-red">{s.itemName} <span className="text-gray-400">({formatNumber(s.unitPrice)})</span></div>))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-1"><select value={comp.category} onChange={(e) => handleComponentChange(index, 'category', e.target.value)} className={inputClasses}>{allPriceCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                                        <td className="px-2 py-1"><input type="number" step="0.01" value={comp.quantity} onChange={(e) => handleComponentChange(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`} /></td>
                                        <td className="px-2 py-1"><input type="text" value={comp.unit} onChange={(e) => handleComponentChange(index, 'unit', e.target.value)} className={`${inputClasses} text-center`} /></td>
                                        <td className="px-2 py-1"><input type="number" value={comp.unitPrice} onChange={(e) => handleComponentChange(index, 'unitPrice', parseInt(e.target.value, 10) || 0)} className={`${inputClasses} text-right`} /></td>
                                        <td className="px-2 py-1 text-center flex justify-center items-center h-full pt-2">
                                            <SourceIndicator source={comp.source} />
                                            {comp.source === 'ai' && (<span title="Harga ini adalah estimasi AI. Verifikasi sebelum digunakan."><AlertTriangle size={14} className="text-yellow-500 ml-1" /></span>)}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <div className="flex items-center justify-center pt-1">
                                                <button onClick={() => handleDbSearch(index)} className="p-1 text-gray-400 hover:text-green-500 transition" title="Cari di Database Harga"><Database size={14} /></button>
                                                {loadingAi[index] ? <Loader2 size={14} className="animate-spin text-blue-500"/> : <button onClick={() => handleAiSearch(index)} className="p-1 text-gray-400 hover:text-blue-500 transition" title="Cari harga dengan AI"><Zap size={14} /></button>}
                                                <button onClick={() => handleRemoveComponent(index)} className="p-1 text-gray-500 hover:text-red-500 transition" title="Hapus Komponen"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    )}
                </div>
                 <div className="flex-shrink-0 mt-4">
                    <button onClick={handleAddNewComponent} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-honda-red rounded-md hover:bg-red-700 transition"><Plus size={14} /> Tambah Komponen</button>

                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                        <div className="text-sm">Perubahan ini akan mengubah <b className="font-semibold">Harga Default</b> pekerjaan.</div>
                        <div className="text-right">
                           <div className="flex items-baseline gap-3">
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Harga Satuan:</span>
                                <span className="text-lg font-bold text-honda-red">Rp {formatNumber(basePrice)}</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-6 pt-4 border-t dark:border-gray-700">
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow"><Save size={16}/> Simpan AHS Default</button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default WorkItemAhsModal;