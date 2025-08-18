import React, { useState, useEffect } from 'react';
import { type RabDocument } from '../types';
import { X } from 'lucide-react';

type FormData = Omit<RabDocument, 'id' | 'sla' | 'detailItems' | 'pdfReady' | 'approvalRequestDetails' | 'isLocked' | 'revisionHistory'>;

interface CreateBqModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData & { id?: string }) => void;
    initialData: RabDocument | null;
}

const emptyFormState: FormData = {
    eMPR: '',
    projectName: '',
    pic: '',
    receivedRejectedDate: '',
    approvedDate: null,
    finishDate: null,
    status: 'Pending',
    tenderValue: null,
    keterangan: null,
};

const CreateBqModal = ({ isOpen, onClose, onSave, initialData }: CreateBqModalProps) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState);
    const [error, setError] = useState('');
    
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    eMPR: initialData.eMPR,
                    projectName: initialData.projectName,
                    pic: initialData.pic,
                    receivedRejectedDate: initialData.receivedRejectedDate,
                    approvedDate: initialData.approvedDate,
                    finishDate: initialData.finishDate,
                    status: initialData.status,
                    tenderValue: initialData.tenderValue,
                    keterangan: initialData.keterangan,
                });
            } else {
                setFormData(emptyFormState);
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const inputClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'date' && value === '') {
             setFormData(prev => ({ ...prev, [name]: null }));
             return;
        }

        const isNumericField = name === 'tenderValue';

        setFormData(prev => ({
            ...prev,
            [name]: isNumericField ? (value === '' ? null : parseInt(value, 10)) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { eMPR, projectName, pic, receivedRejectedDate } = formData;
        if (!eMPR || !projectName || !pic || !receivedRejectedDate) {
            setError('eMPR, Uraian Project, PIC, dan Tgl Diterima harus diisi.');
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-3xl relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isEditMode ? 'Edit BQ' : 'Buat BQ Baru'}
                </h2>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="eMPR" className={labelClasses}>eMPR</label>
                            <input type="text" name="eMPR" id="eMPR" value={formData.eMPR} onChange={handleChange} className={inputClasses} required/>
                        </div>
                        <div>
                            <label htmlFor="pic" className={labelClasses}>PIC</label>
                            <input type="text" name="pic" id="pic" value={formData.pic} onChange={handleChange} className={inputClasses} required/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="projectName" className={labelClasses}>Uraian Project</label>
                        <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleChange} className={inputClasses} required/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="tenderValue" className={labelClasses}>Nilai Tender (IDR)</label>
                            <input type="number" name="tenderValue" id="tenderValue" value={formData.tenderValue || ''} onChange={handleChange} className={inputClasses} min="0"/>
                        </div>
                        <div>
                            <label htmlFor="status" className={labelClasses}>Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className={inputClasses} required>
                                <option value="Pending">Pending</option>
                                <option value="Menunggu Approval">Menunggu Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="keterangan" className={labelClasses}>Keterangan</label>
                        <textarea name="keterangan" id="keterangan" value={formData.keterangan || ''} onChange={handleChange} className={inputClasses} rows={3}></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t dark:border-gray-700 pt-4">
                         <div>
                            <label htmlFor="receivedRejectedDate" className={labelClasses}>Tanggal Diterima</label>
                            <input type="date" name="receivedRejectedDate" id="receivedRejectedDate" value={formData.receivedRejectedDate} onChange={handleChange} className={inputClasses} required/>
                        </div>
                        <div>
                            <label htmlFor="approvedDate" className={labelClasses}>Tanggal Disetujui</label>
                            <input type="date" name="approvedDate" id="approvedDate" value={formData.approvedDate || ''} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="finishDate" className={labelClasses}>Tanggal Selesai</label>
                            <input type="date" name="finishDate" id="finishDate" value={formData.finishDate || ''} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                             {isEditMode ? 'Simpan Perubahan' : 'Simpan & Lanjut'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBqModal;
