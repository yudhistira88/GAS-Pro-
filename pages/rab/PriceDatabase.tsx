import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { type PriceDatabaseItem, type WorkItem, type WorkItemCategory } from '../../types';
import { Search, Plus, Upload, Download, Filter, MoreVertical, Pencil, Trash2, X, HardHat, Settings, Check, Edit } from 'lucide-react';
import PriceItemModal from '../../components/PriceItemModal';
import WorkItemModal from '../../components/WorkItemModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import WorkItemAhsModal from '../../components/WorkItemAhsModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import AdminAuthModal from '../../components/AdminAuthModal';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';

// --- SHARED UTILS & INTERFACES ---

interface DatabaseContext {
  priceDatabase: PriceDatabaseItem[];
  setPriceDatabase: React.Dispatch<React.SetStateAction<PriceDatabaseItem[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  priceCategories: string[];
  setPriceCategories: React.Dispatch<React.SetStateAction<string[]>>;
  workCategories: string[];
  setWorkCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

// --- CATEGORY MANAGEMENT MODAL ---
const ManageCategoriesModal = ({ isOpen, onClose, title, categories, setCategories, items, setItems, itemCategoryField }: { 
    isOpen: boolean, 
    onClose: () => void, 
    title: string, 
    categories: string[], 
    setCategories: React.Dispatch<React.SetStateAction<string[]>>,
    items: (PriceDatabaseItem[] | WorkItem[]),
    setItems: React.Dispatch<React.SetStateAction<any>>,
    itemCategoryField: 'category'
}) => {
    const [editingCat, setEditingCat] = useState<{ oldName: string, newName: string} | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const [reassignTarget, setReassignTarget] = useState('');
    const [isAddCatOpen, setIsAddCatOpen] = useState(false);

    const itemsInCat = (catName: string) => items.filter(i => i[itemCategoryField] === catName).length;
    const otherCats = (catName: string) => categories.filter(c => c !== catName);

    const handleStartEdit = (catName: string) => setEditingCat({ oldName: catName, newName: catName });
    
    const handleSaveEdit = () => {
        if (!editingCat) return;
        const { oldName, newName } = editingCat;
        if (!newName.trim()) {
            toast.error("Nama kategori tidak boleh kosong.");
            return;
        }
        if (newName.toLowerCase() !== oldName.toLowerCase() && categories.some(c => c.toLowerCase() === newName.toLowerCase())) {
            toast.error("Kategori dengan nama tersebut sudah ada.");
            return;
        }
        // Update category list
        setCategories(cats => cats.map(c => c === oldName ? newName : c));
        // Update items
        setItems((prevItems: any[]) => prevItems.map(i => i[itemCategoryField] === oldName ? { ...i, [itemCategoryField]: newName } : i));
        
        toast.success(`Kategori "${oldName}" diubah menjadi "${newName}".`);
        setEditingCat(null);
    };

    const handleDeleteRequest = (catName: string) => {
        if (itemsInCat(catName) > 0) {
            setDeleteCandidate(catName);
            const potentialTargets = otherCats(catName);
            setReassignTarget(potentialTargets.length > 0 ? potentialTargets[0] : '');
        } else {
            setCategories(cats => cats.filter(c => c !== catName));
            toast.success(`Kategori "${catName}" berhasil dihapus.`);
        }
    };
    
    const handleConfirmDelete = () => {
        if (!deleteCandidate) return;
        if (otherCats(deleteCandidate).length > 0 && !reassignTarget) {
            toast.error("Pilih kategori tujuan untuk memindahkan item.");
            return;
        }

        // Reassign items if needed
        if (reassignTarget) {
            setItems((prevItems: any[]) => prevItems.map(i => i[itemCategoryField] === deleteCandidate ? { ...i, [itemCategoryField]: reassignTarget } : i));
        }
        
        // Delete category
        setCategories(cats => cats.filter(c => c !== deleteCandidate));
        toast.success(`Kategori "${deleteCandidate}" dihapus dan item telah dipindahkan.`);
        setDeleteCandidate(null);
    };

    const handleSaveNewCategory = (name: string) => {
        setCategories(prev => [...prev, name]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <AddCategoryModal isOpen={isAddCatOpen} onClose={() => setIsAddCatOpen(false)} onSave={handleSaveNewCategory} title="Tambah Kategori Baru" existingCategories={categories} />
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {categories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            {editingCat?.oldName === cat ? (
                                <input type="text" value={editingCat.newName} onChange={e => setEditingCat({...editingCat, newName: e.target.value})} className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-honda-red text-sm" autoFocus />
                            ) : (
                                <span className="text-sm">{cat} ({itemsInCat(cat)})</span>
                            )}
                            <div className="flex items-center gap-1 ml-4">
                                {editingCat?.oldName === cat ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-500"><Check size={18} /></button>
                                        <button onClick={() => setEditingCat(null)} className="p-1 text-red-600 hover:text-red-500"><X size={18} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleStartEdit(cat)} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={16} /></button>
                                        <button onClick={() => handleDeleteRequest(cat)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {deleteCandidate && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                        <h4 className="font-bold text-red-800 dark:text-red-200">Hapus Kategori "{deleteCandidate}"?</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">Kategori ini memiliki {itemsInCat(deleteCandidate)} item. Pindahkan item ke kategori lain sebelum menghapus.</p>
                        {otherCats(deleteCandidate).length > 0 ? (
                            <div className="mt-2">
                                <label className="text-sm font-medium">Pindahkan ke:</label>
                                <select value={reassignTarget} onChange={e => setReassignTarget(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm">
                                    {otherCats(deleteCandidate).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleConfirmDelete} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Pindahkan & Hapus</button>
                                    <button onClick={() => setDeleteCandidate(null)} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
                                </div>
                            </div>
                        ) : (
                             <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">Tidak ada kategori lain untuk tujuan pemindahan. Buat kategori baru terlebih dahulu.</p>
                        )}
                    </div>
                )}
                <div className="mt-6 border-t dark:border-gray-700 pt-4 flex justify-between">
                     <button onClick={() => setIsAddCatOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow"><Plus size={16} /> Tambah Baru</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Tutup</button>
                </div>
            </div>
        </div>
    );
};


// --- PRICE ITEMS VIEW (Material, Alat Bantu, Jasa Pekerja) ---

const PriceItemsActionMenu = ({ item, onEdit, onDelete }: { item: PriceDatabaseItem, onEdit: () => void, onDelete: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><MoreVertical size={18} /></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast">
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16} className="mr-2"/> Edit</button>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} className="mr-2"/> Hapus</button>
                </div>
            )}
        </div>
    );
};

const PriceItemsView = ({ priceDatabase, setPriceDatabase, priceCategories, setPriceCategories }: Pick<DatabaseContext, 'priceDatabase' | 'setPriceDatabase' | 'priceCategories' | 'setPriceCategories'>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSubTab, setActiveSubTab] = useState<string>('Material');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PriceDatabaseItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [updateOnUpload, setUpdateOnUpload] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isManageCatModalOpen, setIsManageCatModalOpen] = useState(false);

     useEffect(() => {
        if (!priceCategories.includes(activeSubTab) && priceCategories.length > 0) {
            setActiveSubTab(priceCategories[0]);
        }
    }, [priceCategories, activeSubTab]);

    const subTabClasses = (isActive: boolean) =>
      `px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
        isActive ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`;
    
    const filteredData = useMemo(() => {
        return priceDatabase
            .filter(item => item.category === activeSubTab && item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [priceDatabase, searchTerm, activeSubTab]);

    const handleOpenCreateModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEditModal = (item: PriceDatabaseItem) => { setEditingItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleDeleteRequest = (id: string) => { setItemToDelete(id); setIsConfirmOpen(true); };
    const confirmDelete = () => {
        if (itemToDelete) {
            setPriceDatabase(prev => prev.filter(p => p.id !== itemToDelete));
            toast.success('Item berhasil dihapus.');
        }
        setIsConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleSaveItem = (data: Omit<PriceDatabaseItem, 'id' | 'lastUpdated'> & { id?: string }) => {
        const isDuplicate = priceDatabase.some(p => p.itemName.toLowerCase() === data.itemName.toLowerCase() && p.category === data.category && p.id !== data.id);
        if (isDuplicate) {
            toast.error("Item dengan nama dan kategori yang sama sudah ada.");
            return;
        }

        if (data.id) { // Update
            setPriceDatabase(prev => prev.map(p => p.id === data.id ? { ...p, ...data, lastUpdated: new Date().toISOString() } as PriceDatabaseItem : p));
            toast.success('Item berhasil diperbarui.');
        } else { // Create
            const newItem: PriceDatabaseItem = { ...data, id: `db-item-${Date.now()}`, lastUpdated: new Date().toISOString() };
            setPriceDatabase(prev => [newItem, ...prev]);
            toast.success('Item baru berhasil ditambahkan.');
        }
        handleCloseModal();
    };

    const handleExport = () => {
        const dataToExport = filteredData.map(({ id, ...rest }) => rest);
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Database Harga");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
        saveAs(blob, `database_harga_${activeSubTab}.xlsx`);
        toast.success("Data berhasil diekspor!");
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
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                if (!json || json.length < 1) {
                    toast.error("File Excel kosong atau tidak valid.");
                    return;
                }
                
                let addedCount = 0; let updatedCount = 0;
                const newDb = [...priceDatabase];

                json.forEach(row => {
                    const itemName = row['itemName']?.toString().trim();
                    const category = row['category']?.toString().trim();
                    
                    if (!itemName || !category) return;
                     if (!priceCategories.includes(category)) {
                        setPriceCategories(prev => [...prev, category]);
                     }

                    const existingIndex = newDb.findIndex(item => item.itemName.toLowerCase() === itemName.toLowerCase() && item.category === category);

                    if (existingIndex !== -1 && updateOnUpload) {
                        newDb[existingIndex] = { ...newDb[existingIndex], unit: row['unit']?.toString() || newDb[existingIndex].unit, unitPrice: Number(row['unitPrice']) || newDb[existingIndex].unitPrice, priceSource: row['priceSource']?.toString() || newDb[existingIndex].priceSource, lastUpdated: new Date().toISOString() };
                        updatedCount++;
                    } else if (existingIndex === -1) {
                        newDb.push({ id: `db-item-${Date.now()}-${addedCount}`, itemName, category, unit: row['unit']?.toString() || '', unitPrice: Number(row['unitPrice']) || 0, priceSource: row['priceSource']?.toString() || '', lastUpdated: new Date().toISOString() });
                        addedCount++;
                    }
                });

                setPriceDatabase(newDb);
                toast.success(`${addedCount} item ditambahkan, ${updatedCount} item diperbarui.`);

            } catch (error) { toast.error("Gagal mengimpor file Excel.");
            } finally { if(event.target) event.target.value = ''; }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
             <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Hapus Item" message="Apakah Anda yakin ingin menghapus item ini dari database?" />
             <PriceItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} initialData={editingItem} categories={priceCategories} setCategories={setPriceCategories} />
             <ManageCategoriesModal isOpen={isManageCatModalOpen} onClose={() => setIsManageCatModalOpen(false)} title="Kelola Kategori Harga" categories={priceCategories} setCategories={setPriceCategories} items={priceDatabase} setItems={setPriceDatabase} itemCategoryField="category" />

            <div className="flex items-center gap-2 mb-6 bg-gray-100 dark:bg-gray-900 p-2 rounded-lg overflow-x-auto">
                {priceCategories.map(tab => (
                    <button key={tab} onClick={() => setActiveSubTab(tab)} className={subTabClasses(activeSubTab === tab)}>{tab}</button>
                ))}
                <button onClick={() => setIsManageCatModalOpen(true)} className="ml-2 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition" title="Kelola Kategori">
                    <Settings size={18} />
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-1/3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="search" placeholder="Cari Nama Item..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" /></div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition"><Upload size={16} /> Import</button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition"><Download size={16} /> Export</button>
                    <button onClick={handleOpenCreateModal} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition shadow"><Plus size={16} /> Tambah</button>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                <label htmlFor="updateOnUpload" className="flex items-center cursor-pointer"><input type="checkbox" id="updateOnUpload" checked={updateOnUpload} onChange={(e) => setUpdateOnUpload(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-honda-red focus:ring-honda-red dark:bg-gray-700 dark:border-gray-600"/><span className="ml-2">Perbarui item yang sudah ada saat import</span></label>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama Item</th><th scope="col" className="px-6 py-3 text-right">Harga Satuan</th><th scope="col" className="px-6 py-3 text-center">Satuan</th><th scope="col" className="px-6 py-3">Sumber Harga</th><th scope="col" className="px-6 py-3">Update Terakhir</th><th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{item.itemName}</th><td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(item.unitPrice)}</td><td className="px-6 py-4 text-center">{item.unit}</td><td className="px-6 py-4">{item.priceSource || '-'}</td><td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(item.lastUpdated)}</td><td className="px-6 py-4 text-center"><PriceItemsActionMenu item={item} onEdit={() => handleOpenEditModal(item)} onDelete={() => handleDeleteRequest(item.id)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredData.length === 0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400"><p>Tidak ada data yang cocok.</p></div>}
            </div>
        </div>
    );
};

// --- WORK ITEMS VIEW (Daftar Pekerjaan) ---

const WorkItemsActionMenu = ({ item, onEdit, onDelete, onEditAhs }: { item: WorkItem, onEdit: () => void, onDelete: () => void, onEditAhs: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><MoreVertical size={18} /></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-1">
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Pencil size={16} /> Edit Detail</button>
                    <button onClick={() => { onEditAhs(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><HardHat size={16} /> Atur AHS</button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Trash2 size={16} /> Hapus</button>
                </div>
            )}
        </div>
    );
};

const WorkItemsView = ({ workItems, setWorkItems, workCategories, setWorkCategories, priceDatabase, setPriceDatabase }: DatabaseContext) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<WorkItemCategory | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isManageCatModalOpen, setIsManageCatModalOpen] = useState(false);
    const [isAhsModalOpen, setIsAhsModalOpen] = useState(false);
    const [editingAhsItem, setEditingAhsItem] = useState<WorkItem | null>(null);
    const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
    const [onAdminAuthSuccess, setOnAdminAuthSuccess] = useState<(() => void) | null>(null);

    const location = useLocation();
    const isRabModule = location.pathname.startsWith('/rab');

    const requestAdminAuth = (callback: () => void) => {
        setOnAdminAuthSuccess(() => callback);
        setIsAdminAuthModalOpen(true);
    };

    const filteredData = useMemo(() => {
        return workItems
            .filter(item => {
                const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
            })
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [workItems, searchTerm, categoryFilter]);

    const groupedData = useMemo(() => {
        return filteredData.reduce((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, WorkItem[]>);
    }, [filteredData]);

    const orderedCategories = useMemo(() => {
        return workCategories.filter(cat => groupedData[cat] && groupedData[cat].length > 0);
    }, [workCategories, groupedData]);
    
    const handleOpenCreateModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEditModal = (item: WorkItem) => { setEditingItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleOpenAhsModal = (item: WorkItem) => {
        setEditingAhsItem(item);
        setIsAhsModalOpen(true);
    };

    const handleDeleteRequest = (id: string) => { setItemToDelete(id); setIsConfirmOpen(true); };
    const confirmDelete = () => {
        if (itemToDelete) {
            setWorkItems(prev => prev.filter(p => p.id !== itemToDelete));
            toast.success('Pekerjaan berhasil dihapus.');
        }
        setIsConfirmOpen(false); setItemToDelete(null);
    };
    
    const handleSaveItem = (data: Omit<WorkItem, 'id' | 'lastUpdated'> & { id?: string }) => {
        const isDuplicate = workItems.some(p => p.name.toLowerCase() === data.name.toLowerCase() && p.id !== data.id);
        if (isDuplicate) {
            toast.error("Pekerjaan dengan nama yang sama sudah ada.");
            return;
        }

        if (data.id) { // Update
            setWorkItems(prev => prev.map(p => p.id === data.id ? { ...p, ...data, lastUpdated: new Date().toISOString() } as WorkItem : p));
            toast.success('Pekerjaan berhasil diperbarui.');
        } else { // Create
            const newItem: WorkItem = { ...data, id: `wi-item-${Date.now()}`, lastUpdated: new Date().toISOString(), defaultAhs: [] };
            setWorkItems(prev => [newItem, ...prev]);
            toast.success('Pekerjaan baru berhasil ditambahkan.');
        }
        handleCloseModal();
    };
    
    const handleSaveAhs = (updatedItem: WorkItem) => {
        setWorkItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setIsAhsModalOpen(false);
        setEditingAhsItem(null);
        toast.success(`AHS default untuk "${updatedItem.name}" berhasil disimpan.`);
    };
    
    const colWidths = isRabModule ? {
        name: 'w-[35%]', category: 'w-[12%]', unit: 'w-[8%]', price: 'w-[15%]', source: 'w-[8%]', updated: 'w-[12%]', actions: 'w-[10%]'
    } : {
        name: 'w-[45%]', category: 'w-[15%]', unit: '', price: '', source: 'w-[10%]', updated: 'w-[15%]', actions: 'w-[15%]'
    };


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Hapus Pekerjaan" message="Apakah Anda yakin ingin menghapus item pekerjaan ini dari daftar?" />
            <WorkItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} initialData={editingItem} categories={workCategories} setCategories={setWorkCategories} />
            <ManageCategoriesModal isOpen={isManageCatModalOpen} onClose={() => setIsManageCatModalOpen(false)} title="Kelola Kategori Pekerjaan" categories={workCategories} setCategories={setWorkCategories} items={workItems} setItems={setWorkItems} itemCategoryField="category" />
            {editingAhsItem && <WorkItemAhsModal isOpen={isAhsModalOpen} onClose={() => setIsAhsModalOpen(false)} onSave={handleSaveAhs} item={editingAhsItem} priceDatabase={priceDatabase} />}
            <AdminAuthModal
                isOpen={isAdminAuthModalOpen}
                onClose={() => {
                    setIsAdminAuthModalOpen(false);
                    setOnAdminAuthSuccess(null);
                }}
                onSuccess={() => {
                    if (onAdminAuthSuccess) {
                        onAdminAuthSuccess();
                    }
                    setIsAdminAuthModalOpen(false);
                    setOnAdminAuthSuccess(null);
                }}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                    <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="search" placeholder="Cari Nama Pekerjaan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" /></div>
                    <div className="relative"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} className="appearance-none w-full sm:w-auto text-sm p-2 pl-4 pr-8 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"><option value="all">Semua Kategori</option>{workCategories.map(c => <option key={c} value={c}>{c}</option>)}</select><Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div>
                     <button onClick={() => setIsManageCatModalOpen(true)} className="text-sm text-gray-600 dark:text-gray-300 hover:text-honda-red dark:hover:text-honda-red flex items-center gap-1"><Settings size={14} /> Kelola Kategori</button>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto"><button onClick={() => requestAdminAuth(handleOpenCreateModal)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition shadow"><Plus size={16} /> Tambah Pekerjaan</button></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className={`px-6 py-3 ${colWidths.name}`}>Nama Pekerjaan</th>
                            <th scope="col" className={`px-6 py-3 ${colWidths.category}`}>Kategori</th>
                            {isRabModule && <th scope="col" className={`px-6 py-3 text-center ${colWidths.unit}`}>Satuan</th>}
                            {isRabModule && <th scope="col" className={`px-6 py-3 text-right ${colWidths.price}`}>Harga Satuan</th>}
                            <th scope="col" className={`px-6 py-3 ${colWidths.source}`}>Sumber</th>
                            <th scope="col" className={`px-6 py-3 ${colWidths.updated}`}>Update Terakhir</th>
                            <th scope="col" className={`px-6 py-3 text-center ${colWidths.actions}`}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                         {orderedCategories.map(category => (
                            <React.Fragment key={category}>
                                <tr>
                                    <td colSpan={isRabModule ? 7 : 5} className="px-6 py-3 bg-gray-100 dark:bg-gray-700/80 font-bold text-gray-800 dark:text-gray-200 text-sm sticky top-0 z-[5]">
                                        {category}
                                    </td>
                                </tr>
                                {groupedData[category].map((item) => (
                                    <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white break-words">{item.name}</th>
                                        <td className="px-6 py-4 break-words">{item.category}</td>
                                        {isRabModule && <td className="px-6 py-4 text-center">{item.unit}</td>}
                                        {isRabModule && <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(item.defaultPrice)}</td>}
                                        <td className="px-6 py-4">{item.source}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(item.lastUpdated)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <WorkItemsActionMenu 
                                                item={item} 
                                                onEdit={() => requestAdminAuth(() => handleOpenEditModal(item))} 
                                                onDelete={() => requestAdminAuth(() => handleDeleteRequest(item.id))}
                                                onEditAhs={() => requestAdminAuth(() => handleOpenAhsModal(item))}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                 {filteredData.length === 0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400"><p>Tidak ada data pekerjaan yang cocok.</p></div>}
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

const PriceDatabase = () => {
    const context = useOutletContext<DatabaseContext>();
    const location = useLocation();
    const isBqModule = location.pathname.startsWith('/bq');
    
    const [activeTab, setActiveTab] = useState<'items' | 'works'>(isBqModule ? 'works' : 'items');

    const tabClasses = (isActive: boolean) =>
      `px-6 py-3 text-sm font-semibold border-b-2 transition-colors duration-300 ${
        isActive
          ? 'border-honda-red text-honda-red'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
      }`;
      
    if (isBqModule) {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <WorkItemsView {...context} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveTab('items')} className={tabClasses(activeTab === 'items')}>Material, Alat & Jasa</button>
                <button onClick={() => setActiveTab('works')} className={tabClasses(activeTab === 'works')}>Daftar Pekerjaan</button>
            </div>
            
            {activeTab === 'items' && (
                <PriceItemsView 
                    priceDatabase={context.priceDatabase} 
                    setPriceDatabase={context.setPriceDatabase}
                    priceCategories={context.priceCategories}
                    setPriceCategories={context.setPriceCategories}
                />
            )}

            {activeTab === 'works' && (
                <WorkItemsView {...context} />
            )}
        </div>
    );
};

export default PriceDatabase;