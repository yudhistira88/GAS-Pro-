





import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { type RabDetailItem, type AhsComponent, type PriceDatabaseItem, type WorkItem } from '../types';
import { X, Plus, Trash2, Database, Save, CheckCircle, Zap, AlertTriangle, Pencil, Loader2, BookmarkPlus, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateSingleItemPrice, generateAhsForSingleItem } from '../services/geminiService';

interface AhsEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: RabDetailItem | null;
    onSave: (
        itemId: string,
        newAhs: AhsComponent[],
        newUnitPrice: number,
        pph: number,
        overhead: number,
        margin: number
    ) => void;
    priceDatabase: PriceDatabaseItem[];
    setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
    workItems: WorkItem[];
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

const allCategories: AhsComponent['category'][] = ['Material', 'Jasa Pekerja', 'Alat Bantu'];
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


const AhsEditorModal = ({ isOpen, onClose, item, onSave, priceDatabase, setPriceDatabase, workItems, setWorkItems }: AhsEditorModalProps) => {
    const [components, setComponents] = useState<AhsComponent[]>([]);
    const [pph, setPph] = useState(0);
    const [overhead, setOverhead] = useState(0);
    const [margin, setMargin] = useState(0);
    const [newItemToSaveToDb, setNewItemToSaveToDb] = useState<Record<string, boolean>>({});
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({});
    const modalRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isWorkItemInDb, setIsWorkItemInDb] = useState(true);
    
    useEffect(() => {
        if (item) {
            const initialComponents = (item.ahs || []).map((c, i) => ({
                ...c,
                id: c.id || `ahs-initial-${item.id}-${i}`,
                category: c.category || 'Material',
                source: c.source || 'manual',
            }));
            setComponents(JSON.parse(JSON.stringify(initialComponents)));
            setPph(item.pph || 0);
            setOverhead(item.overhead || 0);
            setMargin(item.margin || 0);
            setNewItemToSaveToDb({});
            setLoadingAi({});
            setIsGenerating(false);

            if (workItems) {
                const exists = workItems.some(wi => wi.name.toLowerCase() === item.uraianPekerjaan.toLowerCase());
                setIsWorkItemInDb(exists);
            }
        }
    }, [item, workItems]);

    const handleComponentChange = (index: number, field: keyof AhsComponent, value: any) => {
        const updatedComponents = [...components];
        const isManualValueEdit = ['unitPrice', 'quantity', 'componentName', 'unit'].includes(field);
        
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
        // Find exact match in database (case-insensitive)
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

    const basePrice = useMemo(() => components.reduce((sum, comp) => sum + (Number(comp.quantity) * Number(comp.unitPrice)), 0), [components]);
    const finalPrice = useMemo(() => {
        const totalPercentage = (Number(pph) || 0) + (Number(overhead) || 0) + (Number(margin) || 0);
        return basePrice * (1 + totalPercentage / 100);
    }, [basePrice, pph, overhead, margin]);

    const handleSave = () => {
        if (!item) return;
        const newDbItems: PriceDatabaseItem[] = [];
        components.forEach(comp => {
            if (newItemToSaveToDb[comp.id]) {
                if (comp.componentName.trim() && comp.unit.trim() && comp.unitPrice > 0) {
                    const existing = priceDatabase.find(p => p.itemName.toLowerCase() === comp.componentName.toLowerCase());
                    if (!existing) {
                        newDbItems.push({
                            id: `db-${Date.now()}-${comp.id}`,
                            category: comp.category,
                            itemName: comp.componentName,
                            unit: comp.unit,
                            unitPrice: comp.unitPrice,
                            lastUpdated: new Date().toISOString(),
                        });
                    }
                }
            }
        });

        if (newDbItems.length > 0) {
            setPriceDatabase(prev => [...prev, ...newDbItems]);
            toast.success(`${newDbItems.length} item baru disimpan ke Database Harga!`);
        }
        
        onSave(item.id, components, finalPrice, Number(pph), Number(overhead), Number(margin));
    };

    const handleSaveToWorkItemDb = () => {
        if (!item || isWorkItemInDb) return;
        
        const newWorkItem: WorkItem = {
            id: `wi-${Date.now()}`,
            name: item.uraianPekerjaan,
            category: 'Sipil', // Default category for now
            unit: item.satuan,
            defaultPrice: finalPrice,
            source: 'AHS',
            lastUpdated: new Date().toISOString(),
            defaultAhs: components,
        };

        setWorkItems(prev => [...prev, newWorkItem]);
        setIsWorkItemInDb(true); // Update state to hide the button
        toast.success(`✅ "${newWorkItem.name}" berhasil dimasukkan ke database.`);
    };

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
        if (!item?.uraianPekerjaan) return;
        setIsGenerating(true);
        const toastId = toast.loading('Membuat AHS dengan AI...');
        try {
            const ahsComponents = await generateAhsForSingleItem(item.uraianPekerjaan);
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
    const selectClasses = "w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-xs";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-5xl relative animate-fade-in-up flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                <div className="flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Editor Analisa Harga Satuan (AHS)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.uraianPekerjaan}</p>
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
                        allCategories.map(category => {
                             const categoryComponents = components.filter(c => c.category === category);
                             if (categoryComponents.length === 0) return null;
                             return (
                                <div key={category}>
                                     <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{category}</h4>
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
                                                if (comp.category !== category) return null;
                                                const suggestions = priceDatabase.filter(p => p.itemName.toLowerCase().includes(comp.componentName.toLowerCase()) && comp.componentName.trim().length > 1);
                                                const canSaveToDb = comp.componentName.trim() && comp.unit.trim() && comp.unitPrice > 0 && !priceDatabase.some(p => p.itemName.toLowerCase() === comp.componentName.toLowerCase());
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
                                                    <td className="px-2 py-1"><select value={comp.category} onChange={(e) => handleComponentChange(index, 'category', e.target.value)} className={selectClasses}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
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
                                                        {canSaveToDb && (<button onClick={() => setNewItemToSaveToDb(p => ({ ...p, [comp.id]: !p[comp.id]}))} className={`p-1 transition ${newItemToSaveToDb[comp.id] ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`} title="Tandai untuk disimpan ke Database Harga">{newItemToSaveToDb[comp.id] ? <CheckCircle size={14}/> : <BookmarkPlus size={14}/>}</button>)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                 </div>
                             )
                        })
                    )}
                </div>
                 <div className="flex-shrink-0 mt-4">
                    <button onClick={handleAddNewComponent} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-honda-red rounded-md hover:bg-red-700 transition"><Plus size={14} /> Tambah Komponen</button>

                    <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-start">
                        <div className="space-y-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400">PPH (%)</label><input type="number" value={pph} onChange={(e) => setPph(parseFloat(e.target.value) || 0)} className={`${inputClasses} mt-1`} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Overhead (%)</label><input type="number" value={overhead} onChange={(e) => setOverhead(parseFloat(e.target.value) || 0)} className={`${inputClasses} mt-1`} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Margin (%)</label><input type="number" value={margin} onChange={(e) => setMargin(parseFloat(e.target.value) || 0)} className={`${inputClasses} mt-1`} /></div>
                        </div>
                        <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg h-full flex flex-col justify-center">
                            <h5 className="text-sm font-semibold mb-3 text-center">Rincian Perhitungan</h5>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between"><span>Harga Dasar (Material + Jasa + Alat)</span> <span className="font-mono">Rp {formatNumber(basePrice)}</span></div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Biaya Tambahan ({(pph + overhead + margin).toFixed(2)}%)</span> <span className="font-mono">+ Rp {formatNumber(finalPrice - basePrice)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t-2 dark:border-gray-600 pt-2 mt-2"><span>Total Harga Satuan Akhir</span> <span className="font-mono text-honda-red">Rp {formatNumber(finalPrice)}</span></div>
                            </div>
                        </div>
                    </div>
                    
                    {!isWorkItemInDb && components.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-r-lg">
                             <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <BookmarkPlus className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                        Pekerjaan ini belum ada di database.
                                    </p>
                                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                        <p>
                                            Simpan pekerjaan ini beserta AHS-nya ke database untuk digunakan lagi di proyek lain.
                                        </p>
                                    </div>
                                    <div className="mt-3">
                                        <button 
                                            onClick={handleSaveToWorkItemDb}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 dark:focus:ring-offset-blue-900/20 focus:ring-blue-500 transition shadow"
                                        >
                                            Masukkan ke Database Pekerjaan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="flex justify-end items-center mt-6 pt-4 border-t dark:border-gray-700">
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow"><Save size={16}/> Simpan AHS & Terapkan Harga</button>
                    </div>
                    <div className="text-xs text-center text-gray-400 mt-2">* Total AHS ini akan menjadi Harga Satuan pada baris RAB.</div>
                 </div>
            </div>
        </div>
    );
};

export default AhsEditorModal;