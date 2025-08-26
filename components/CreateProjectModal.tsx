
import React, { useState, useEffect } from 'react';
import { type Project, type ProjectPhase } from '../types';
import { X, Briefcase, Layers, Users, Calendar, Save, FileText } from 'lucide-react';

type FormData = Omit<Project, 'id' | 'phases'> & { planStartDate: string };

const emptyFormState: FormData = {
    name: '',
    team: [],
    status: 'Not Started',
    dueDate: '', // Will be used as planEndDate
    progress: 0,
    group: '',
    description: '',
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
                    description: initialData.description || '',
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

    const inputWrapperClasses = "relative w-full";
    const inputIconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none";
    const inputFieldClasses = "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
    const labelClasses = "block text-sm font-medium text-foreground mb-1.5";
    
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Briefcase size={28}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {isEditMode ? 'Edit Proyek' : 'Buat Proyek Baru'}
                            </h2>
                            <p className="text-sm text-muted-foreground">Isi detail proyek di bawah ini.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm" role="alert">{error}</div>}

                        <section className="space-y-4">
                             <h3 className="text-md font-semibold text-foreground border-b border-border pb-2">Detail Proyek</h3>
                             <div>
                                <label htmlFor="name" className={labelClasses}>Nama Proyek</label>
                                <div className={inputWrapperClasses}>
                                    <Briefcase size={18} className={inputIconClasses} />
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputFieldClasses} required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="group" className={labelClasses}>Kelompok Proyek</label>
                                <div className={inputWrapperClasses}>
                                    <Layers size={18} className={inputIconClasses} />
                                    <input type="text" name="group" id="group" value={formData.group || ''} onChange={handleChange} className={inputFieldClasses} />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="description" className={labelClasses}>Deskripsi Proyek</label>
                                <div className={inputWrapperClasses}>
                                    <FileText size={18} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                                    <textarea
                                        name="description"
                                        id="description"
                                        rows={3}
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        className={`${inputFieldClasses} pl-10 h-24`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="teamInput" className={labelClasses}>Anggota Tim (pisahkan dengan koma)</label>
                                <div className={inputWrapperClasses}>
                                    <Users size={18} className={inputIconClasses} />
                                    <input type="text" id="teamInput" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} className={inputFieldClasses} required />
                                </div>
                            </div>
                        </section>
                        
                        <section className="space-y-4 border-t border-border pt-6">
                            <h3 className="text-md font-semibold text-foreground border-b border-border pb-2">Timeline & Fase</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="planStartDate" className={labelClasses}>Tanggal Mulai Rencana</label>
                                    <div className={inputWrapperClasses}>
                                        <Calendar size={18} className={inputIconClasses} />
                                        <input type="date" name="planStartDate" id="planStartDate" value={formData.planStartDate} onChange={handleChange} className={inputFieldClasses} required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className={labelClasses}>Tanggal Selesai Rencana</label>
                                    <div className={inputWrapperClasses}>
                                        <Calendar size={18} className={inputIconClasses} />
                                        <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} className={inputFieldClasses} required />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="phasesInput" className={labelClasses}>Fase Proyek (satu per baris)</label>
                                <textarea name="phasesInput" id="phasesInput" value={phasesInput} onChange={(e) => setPhasesInput(e.target.value)} rows={4} className={`${inputFieldClasses} pl-4 h-32`}></textarea>
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-border pt-6">
                            <h3 className="text-md font-semibold text-foreground border-b border-border pb-2">Status & Progres</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="status" className={labelClasses}>Status</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleStatusChange} className={`${inputFieldClasses} pl-4`}>
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                     <label htmlFor="progress" className={labelClasses}>Progress ({formData.progress}%)</label>
                                     <input type="range" min="0" max="100" value={formData.progress} onChange={handleProgressChange} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-6 border-t border-border rounded-b-xl bg-muted/50">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">Batal</button>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow">
                                <Save size={16} />
                                {isEditMode ? 'Simpan Perubahan' : 'Buat Proyek'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;