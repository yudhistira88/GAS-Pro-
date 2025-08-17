import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    title: string;
    existingCategories: string[];
}

const AddCategoryModal = ({ isOpen, onClose, onSave, title, existingCategories }: AddCategoryModalProps) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            setError('Nama kategori tidak boleh kosong.');
            return;
        }
        if (existingCategories.some(cat => cat.toLowerCase() === name.trim().toLowerCase())) {
            setError('Kategori dengan nama tersebut sudah ada.');
            return;
        }
        onSave(name.trim());
        setName('');
        setError('');
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama kategori baru..."
                    autoFocus
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">Simpan</button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
