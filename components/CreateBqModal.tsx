import React, { useState, useEffect } from 'react';
import { type RabDocument } from '../types';
import { X, FileText, User, ClipboardList, CircleDollarSign, Calendar, Save } from 'lucide-react';

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
    surveyDate: '',
    receivedDate: null,
    finishDate: null,
    status: 'Survey',
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
                    surveyDate: initialData.surveyDate,
                    receivedDate: initialData.receivedDate,
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

    const inputWrapperClasses = "relative w-full";
    const inputIconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none";
    const inputFieldClasses = "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
    const labelClasses = "block text-sm font-medium text-foreground mb-1.5";

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
        const { eMPR, projectName, pic, surveyDate } = formData;
        if (!eMPR || !projectName || !pic || !surveyDate) {
            setError('eMPR, Uraian Project, PIC, dan Tgl. Survey harus diisi.');
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-3xl transform transition-all animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText size={28}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {isEditMode ? 'Edit BQ' : 'Buat BQ Baru'}
                            </h2>
                            <p className="text-sm text-muted-foreground">Isi detail Bill of Quantity di bawah ini.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                         {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm" role="alert">{error}</div>}
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="eMPR" className={labelClasses}>eMPR</label>
                                <div className={inputWrapperClasses}>
                                    <ClipboardList size={18} className={inputIconClasses} />
                                    <input type="text" name="eMPR" id="eMPR" value={formData.eMPR} onChange={handleChange} className={inputFieldClasses} required/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="pic" className={labelClasses}>PIC</label>
                                <div className={inputWrapperClasses}>
                                    <User size={18} className={inputIconClasses} />
                                    <input type="text" name="pic" id="pic" value={formData.pic} onChange={handleChange} className={inputFieldClasses} required/>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="projectName" className={labelClasses}>Uraian Project</label>
                             <div className={inputWrapperClasses}>
                                <FileText size={18} className={inputIconClasses} />
                                <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleChange} className={inputFieldClasses} required/>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="status" className={labelClasses}>Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className={`${inputFieldClasses} pl-4`} required>
                                <option value="Survey">Survey</option>
                                <option value="Approval">Approval</option>
                                <option value="Diterima">Diterima</option>
                                <option value="Ditolak">Ditolak</option>
                                <option value="Selesai">Selesai</option>
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="keterangan" className={labelClasses}>Keterangan</label>
                            <textarea name="keterangan" id="keterangan" value={formData.keterangan || ''} onChange={handleChange} className={`${inputFieldClasses} pl-4 h-24`} rows={3}></textarea>
                        </div>
                        
                        <div className="border-t border-border pt-6">
                             <h3 className="text-md font-semibold text-foreground mb-4">Timeline</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                 <div>
                                    <label htmlFor="surveyDate" className={labelClasses}>Tgl. Survey</label>
                                     <div className={inputWrapperClasses}>
                                         <Calendar size={18} className={inputIconClasses} />
                                         <input type="date" name="surveyDate" id="surveyDate" value={formData.surveyDate} onChange={handleChange} className={inputFieldClasses} required/>
                                     </div>
                                </div>
                                <div>
                                    <label htmlFor="receivedDate" className={labelClasses}>Tgl. Diterima</label>
                                    <div className={inputWrapperClasses}>
                                         <Calendar size={18} className={inputIconClasses} />
                                         <input type="date" name="receivedDate" id="receivedDate" value={formData.receivedDate || ''} onChange={handleChange} className={inputFieldClasses} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="finishDate" className={labelClasses}>Tgl. Selesai</label>
                                     <div className={inputWrapperClasses}>
                                         <Calendar size={18} className={inputIconClasses} />
                                         <input type="date" name="finishDate" id="finishDate" value={formData.finishDate || ''} onChange={handleChange} className={inputFieldClasses} />
                                     </div>
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
                                 {isEditMode ? 'Simpan Perubahan' : 'Simpan & Lanjut'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBqModal;