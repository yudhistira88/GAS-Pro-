import React, { useState, useEffect } from 'react';
import { type WorkItem, type WorkItemCategory } from '../types';
import { X, Plus } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';

type FormData = Omit<WorkItem, 'id' | 'lastUpdated' | 'defaultAhs'>;

interface WorkItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData & { id?: string }) => void;
    initialData: WorkItem | null;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const emptyFormState = (categories: string[]): FormData => ({
    name: '',
    category: categories[0] || 'Sipil',
    unit: '',
    defaultPrice: 0,
    source: 'Manual',
});

const WorkItemModal = ({ isOpen, onClose, onSave, initialData, categories, setCategories }: WorkItemModalProps) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState(categories));
    const [error, setError] = useState('');
    const [isAddCatOpen, setIsAddCatOpen] = useState(false);
    
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    category: initialData.category,
                    unit: initialData.unit,
                    defaultPrice: initialData.defaultPrice,
                    source: initialData.source,
                });
            } else {
                setFormData(emptyFormState(categories));
            }
            setError('');
        }
    }, [isOpen, initialData, categories]);

    const inputClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumericField = name === 'defaultPrice';

        setFormData(prev => ({
            ...prev,
            [name]: isNumericField ? (value === '' ? 0 : parseInt(value, 10)) : value,
        }));
    };
    
    const handleSaveNewCategory = (name: string) => {
        setCategories(prev => [...prev, name]);
        setFormData(prev => ({ ...prev, category: name }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, unit, defaultPrice, category } = formData;
        if (!name || !unit || defaultPrice <= 0) {
            setError('Nama Pekerjaan, Satuan, dan Harga harus diisi dengan benar.');
            return;
        }
        if (!category) {
            setError('Pekerjaan wajib memiliki kategori.');
            return;
        }
        setError('');
        
        const dataToSave = isEditMode
            ? { ...formData, id: initialData?.id }
            : formData;

        onSave(dataToSave);
    };
    
    if (!isOpen) return null;

    return (
        <>
        <AddCategoryModal 
            isOpen={isAddCatOpen}
            onClose={() => setIsAddCatOpen(false)}
            onSave={handleSaveNewCategory}
            title="Tambah Kategori Pekerjaan"
            existingCategories={categories}
        />
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isEditMode ? 'Edit Item Pekerjaan' : 'Tambah Item Pekerjaan Baru'}
                </h2>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className={labelClasses}>Nama Pekerjaan</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClasses} required/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className={labelClasses}>Kategori</label>
                            <div className="flex items-center gap-2">
                                <select name="category" id="category" value={formData.category} onChange={handleChange} className={inputClasses} required>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <button type="button" onClick={() => setIsAddCatOpen(true)} className="p-2 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition" title="Tambah Kategori Baru">
                                    <Plus size={20}/>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="unit" className={labelClasses}>Satuan</label>
                            <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className={inputClasses} required placeholder="e.g., m2, m3, titik"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="defaultPrice" className={labelClasses}>Harga Default (IDR)</label>
                            <input type="number" name="defaultPrice" id="defaultPrice" value={formData.defaultPrice} onChange={handleChange} className={inputClasses} required min="0"/>
                        </div>
                         <div>
                            <label htmlFor="source" className={labelClasses}>Sumber</label>
                            <select name="source" id="source" value={formData.source} onChange={handleChange} className={inputClasses} required>
                                <option value="Manual">Manual</option>
                                <option value="AHS">AHS</option>
                                <option value="Import">Import</option>
                                <option value="AI">AI</option>
                            </select>
                        </div>
                    </div>
                   
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                             Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

export default WorkItemModal;