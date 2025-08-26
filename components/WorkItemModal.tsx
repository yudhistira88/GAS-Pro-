import React, { useState, useEffect } from 'react';
import { type WorkItem, type WorkItemCategory } from '../types';
import { X, Plus, Save, HardHat, ClipboardList, Ruler, CircleDollarSign, BookOpen } from 'lucide-react';
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

    const inputWrapperClasses = "relative w-full";
    const inputIconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none";
    const inputFieldClasses = "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
    const labelClasses = "block text-sm font-medium text-foreground mb-1.5";

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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <HardHat size={28}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {isEditMode ? 'Edit Item Pekerjaan' : 'Tambah Item Pekerjaan Baru'}
                            </h2>
                            <p className="text-sm text-muted-foreground">Isi detail pekerjaan untuk database.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm" role="alert">{error}</div>}
                        
                         <div>
                            <label htmlFor="name" className={labelClasses}>Nama Pekerjaan</label>
                            <div className={inputWrapperClasses}>
                                <ClipboardList size={18} className={inputIconClasses} />
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputFieldClasses} required/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="category" className={labelClasses}>Kategori</label>
                                <div className="flex items-center gap-2">
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} className={`${inputFieldClasses} pl-4 flex-grow`} required>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setIsAddCatOpen(true)} className="p-2.5 flex-shrink-0 bg-muted rounded-md hover:bg-muted/80 transition" title="Tambah Kategori Baru">
                                        <Plus size={20}/>
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="unit" className={labelClasses}>Satuan</label>
                                <div className={inputWrapperClasses}>
                                    <Ruler size={18} className={inputIconClasses} />
                                    <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className={inputFieldClasses} required placeholder="e.g., m2, m3, titik"/>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="defaultPrice" className={labelClasses}>Harga Default (IDR)</label>
                                <div className={inputWrapperClasses}>
                                    <span className={`${inputIconClasses} font-bold text-lg`}>Rp</span>
                                    <input type="number" name="defaultPrice" id="defaultPrice" value={formData.defaultPrice} onChange={handleChange} className={inputFieldClasses} required min="0"/>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="source" className={labelClasses}>Sumber</label>
                                <div className={inputWrapperClasses}>
                                    <BookOpen size={18} className={inputIconClasses} />
                                    <select name="source" id="source" value={formData.source} onChange={handleChange} className={`${inputFieldClasses} pl-10`} required>
                                        <option value="Manual">Manual</option>
                                        <option value="AHS">AHS</option>
                                        <option value="Import">Import</option>
                                        <option value="AI">AI</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                     <div className="flex items-center justify-end p-6 border-t border-border rounded-b-xl bg-muted/50">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">Batal</button>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow">
                                 <Save size={16} />
                                 Simpan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

export default WorkItemModal;