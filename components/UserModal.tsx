
import React, { useState, useEffect } from 'react';
import { type User } from '../types';
import { X } from 'lucide-react';

type FormData = Omit<User, 'id' | 'lastLogin'>;

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData & { id?: string }) => void;
    initialData: User | null;
}

const emptyFormState: FormData = {
    name: '',
    email: '',
    role: 'Purchasing',
    status: 'Active',
    password: '',
};

const UserModal = ({ isOpen, onClose, onSave, initialData }: UserModalProps) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState);
    const [error, setError] = useState('');
    
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    email: initialData.email,
                    role: initialData.role,
                    status: initialData.status,
                    password: '', // Password is not pre-filled for editing
                });
            } else {
                setFormData(emptyFormState);
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const inputClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password } = formData;
        if (!name || !email) {
            setError('Nama dan Email harus diisi.');
            return;
        }
        if (!isEditMode && (!password || password.length < 5)) {
            setError('Password baru minimal harus 5 karakter.');
            return;
        }
        if (isEditMode && password && password.length < 5) {
            setError('Jika diubah, password minimal harus 5 karakter.');
            return;
        }

        setError('');
        
        const dataToSave: any = { ...formData };
        if (isEditMode) {
            dataToSave.id = initialData?.id;
            // Only include password if it was changed
            if (!dataToSave.password) {
                delete dataToSave.password;
            }
        }

        onSave(dataToSave);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h2>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelClasses}>Nama Lengkap</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClasses} required/>
                        </div>
                        <div>
                            <label htmlFor="email" className={labelClasses}>Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClasses} required/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="role" className={labelClasses}>Role</label>
                            <select name="role" id="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                                <option value="Purchasing">Purchasing</option>
                                <option value="OBM">OBM</option>
                                <option value="GAS Project">GAS Project</option>
                                <option value="Manager GAS">Manager GAS</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className={labelClasses}>Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className={inputClasses} required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="password" className={labelClasses}>Password</label>
                        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className={inputClasses} placeholder={isEditMode ? 'Kosongkan jika tidak ingin diubah' : ''} />
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
    );
};

export default UserModal;
