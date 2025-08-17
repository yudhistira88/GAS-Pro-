import React, { useState, useEffect } from 'react';
import { type Project, type ProjectPhase } from '../types';
import { X } from 'lucide-react';

type FormData = Omit<Project, 'id' | 'phases'> & { planStartDate: string };

const emptyFormState: FormData = {
    name: '',
    team: [],
    status: 'Not Started',
    dueDate: '', // Will be used as planEndDate
    progress: 0,
    group: '',
    planStartDate: '',
};

const CreateProjectModal = ({ isOpen, onClose, onSave, initialData }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Project, 'id'> & { id?: string }) => void;
    initialData: Project | null;
}) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState);
    const [teamInput, setTeamInput] = useState('');
    const [phasesInput, setPhasesInput] = useState('');
    const [error, setError] = useState('');

    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const hasPhases = initialData.phases && initialData.phases.length > 0;
                // Use first phase start and last phase end as the main dates
                const planStartDate = hasPhases && initialData.phases[0].plan.start ? initialData.phases[0].plan.start : '';
                const planEndDate = hasPhases && initialData.phases[initialData.phases.length - 1].plan.end ? initialData.phases[initialData.phases.length - 1].plan.end : initialData.dueDate;

                setFormData({
                    name: initialData.name,
                    team: initialData.team,
                    status: initialData.status,
                    progress: initialData.progress,
                    group: initialData.group || '',
                    planStartDate: planStartDate ? new Date(planStartDate).toISOString().split('T')[0] : '',
                    dueDate: planEndDate ? new Date(planEndDate).toISOString().split('T')[0] : '',
                });
                setTeamInput(initialData.team.join(', '));
                setPhasesInput(initialData.phases?.map(p => p.name).join('\n') || '');
            } else {
                setFormData(emptyFormState);
                setTeamInput('');
                setPhasesInput('Feasibility\nPlanning & Design\nConstruction\nClose Out');
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const inputClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const progress = parseInt(e.target.value, 10);
        let newStatus: Project['status'] = 'In Progress';
        if (progress <= 0) {
            newStatus = 'Not Started';
        } else if (progress >= 100) {
            newStatus = 'Completed';
        }
        setFormData(prev => ({ ...prev, progress, status: newStatus }));
    }
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as Project['status'];
        let newProgress = formData.progress;
        if (newStatus === 'Not Started') {
            newProgress = 0;
        } else if (newStatus === 'Completed') {
            newProgress = 100;
        } else if (newStatus === 'In Progress' && (formData.progress <= 0 || formData.progress >= 100)) {
            newProgress = 10;
        }
        setFormData(prev => ({...prev, status: newStatus, progress: newProgress}));
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !teamInput || !formData.planStartDate || !formData.dueDate) {
            setError('Nama, Tim, Tanggal Mulai dan Selesai harus diisi.');
            return;
        }

        const startDate = new Date(formData.planStartDate);
        const endDate = new Date(formData.dueDate);
        if (endDate < startDate) {
            setError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
            return;
        }
        
        setError('');

        const teamArray = teamInput.split(',').map(name => name.trim()).filter(Boolean);
        if(teamArray.length === 0){
             setError('Anggota Tim harus diisi.');
            return;
        }
        
        const phaseNames = phasesInput.split('\n').map(name => name.trim()).filter(Boolean);
        if (phaseNames.length === 0) {
            setError('Proyek harus memiliki setidaknya satu fase.');
            return;
        }

        const phaseColors = ['#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#6366f1', '#a855f7'];

        const phases: ProjectPhase[] = [];
        const totalDuration = endDate.getTime() - startDate.getTime();

        if (phaseNames.length > 0) {
            const durationPerPhase = totalDuration / phaseNames.length;
            let currentStartDate = startDate.getTime();

            for (let i = 0; i < phaseNames.length; i++) {
                const phaseStartDate = new Date(currentStartDate);
                // Ensure the next phase starts exactly where the previous ended
                const phaseEndDate = (i === phaseNames.length - 1) ? endDate : new Date(currentStartDate + durationPerPhase);
                
                phases.push({
                    id: `phase-${Date.now()}-${i}`,
                    name: phaseNames[i],
                    plan: {
                        start: phaseStartDate.toISOString().split('T')[0],
                        end: phaseEndDate.toISOString().split('T')[0],
                    },
                    actual: { start: null, end: null },
                    color: phaseColors[i % phaseColors.length],
                });
                
                currentStartDate = phaseEndDate.getTime();
            }
        }


        const dataToSave: Omit<Project, 'id'> & { id?: string } = {
            ...formData,
            team: teamArray,
            phases: phases,
        };
        
        delete (dataToSave as any).planStartDate;

        if (isEditMode) {
            dataToSave.id = initialData?.id;
        }

        onSave(dataToSave);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isEditMode ? 'Edit Proyek' : 'Buat Proyek Baru'}
                </h2>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClasses}>Nama Proyek</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="group" className={labelClasses}>Kelompok Proyek</label>
                        <input type="text" name="group" id="group" value={formData.group || ''} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="teamInput" className={labelClasses}>Anggota Tim (pisahkan dengan koma)</label>
                        <input type="text" id="teamInput" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} className={inputClasses} required />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="planStartDate" className={labelClasses}>Tanggal Mulai Rencana</label>
                            <input type="date" name="planStartDate" id="planStartDate" value={formData.planStartDate} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className={labelClasses}>Tanggal Selesai Rencana</label>
                            <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} className={inputClasses} required />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="phasesInput" className={labelClasses}>Fase Proyek (satu per baris)</label>
                        <textarea name="phasesInput" id="phasesInput" value={phasesInput} onChange={(e) => setPhasesInput(e.target.value)} rows={4} className={inputClasses}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="status" className={labelClasses}>Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleStatusChange} className={inputClasses}>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="progress" className={labelClasses}>Progress ({formData.progress}%)</label>
                             <input type="range" min="0" max="100" value={formData.progress} onChange={handleProgressChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-honda-red" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                            {isEditMode ? 'Simpan Perubahan' : 'Buat Proyek'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
