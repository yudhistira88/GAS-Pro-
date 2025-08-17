import React, { useState, useEffect } from 'react';
import { type PriceDatabaseItem } from '../types';
import { X, Plus } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';

type FormData = Omit<PriceDatabaseItem, 'id' | 'lastUpdated'>;

interface PriceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData & { id?: string }) => void;
    initialData: PriceDatabaseItem | null;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const emptyFormState = (categories: string[]): FormData => ({
    category: categories[0] || 'Material',
    itemName: '',
    unit: '',
    unitPrice: 0,
    priceSource: '',
});

const PriceItemModal = ({ isOpen, onClose, onSave, initialData, categories, setCategories }: PriceItemModalProps) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState(categories));
    const [error, setError] = useState('');
    const [isAddCatOpen, setIsAddCatOpen] = useState(false);
    
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    category: initialData.category,
                    itemName: initialData.itemName,
                    unit: initialData.unit,
                    unitPrice: initialData.unitPrice,
                    priceSource: initialData.priceSource || '',
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
        const isNumericField = name === 'unitPrice';

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
        const { itemName, unit, unitPrice } = formData;
        if (!itemName || !unit || unitPrice <= 0) {
            setError('Nama Item, Satuan, dan Harga harus diisi dengan benar.');
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
            title="Tambah Kategori Harga Baru"
            existingCategories={categories}
        />
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isEditMode ? 'Edit Item Harga' : 'Tambah Item Harga Baru'}
                </h2>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="itemName" className={labelClasses}>Nama Item</label>
                        <input type="text" name="itemName" id="itemName" value={formData.itemName} onChange={handleChange} className={inputClasses} required/>
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
                            <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className={inputClasses} required placeholder="e.g., m3, sak, HOK"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unitPrice" className={labelClasses}>Harga Satuan (IDR)</label>
                            <input type="number" name="unitPrice" id="unitPrice" value={formData.unitPrice} onChange={handleChange} className={inputClasses} required min="0"/>
                        </div>
                        <div>
                            <label htmlFor="priceSource" className={labelClasses}>Sumber Harga (Opsional)</label>
                            <input type="text" name="priceSource" id="priceSource" value={formData.priceSource || ''} onChange={handleChange} className={inputClasses}/>
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

export default PriceItemModal;