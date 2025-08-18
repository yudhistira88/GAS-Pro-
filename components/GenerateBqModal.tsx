
import React, { useState, useEffect } from 'react';
import { type RabDetailItem } from '../types';
import { X, Wand2, Loader2, FileText, Calendar, MapPin, HardHat, ArrowLeft } from 'lucide-react';
import { generateBqQuestions, generateBqFromDetails, type DynamicQuestion, type BqPromptDetails } from '../services/geminiService';
import toast from 'react-hot-toast';

interface GenerateBqModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (generatedItems: Omit<RabDetailItem, 'id' | 'isEditing' | 'isSaved'>[], projectDetails: { projectName: string, workDuration: number }) => void;
    currentProjectName?: string;
}

const GenerateBqModal = ({ isOpen, onClose, onComplete, currentProjectName }: GenerateBqModalProps) => {
    // Initial details state
    const [projectTitle, setProjectTitle] = useState(currentProjectName || '');
    const [duration, setDuration] = useState<number | ''>('');
    const [location, setLocation] = useState('Jabodetabek');
    const [workerType, setWorkerType] = useState<'Sertifikasi' | 'Non Sertifikasi'>('Sertifikasi');
    
    // State for multi-step process
    const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setProjectTitle(currentProjectName || '');
            setDuration('');
            setLocation('Jabodetabek');
            setWorkerType('Sertifikasi');
            setDynamicQuestions([]);
            setAnswers({});
            setError('');
            setIsLoading(false);
        }
    }, [isOpen, currentProjectName]);

    const handleAnswerChange = (key: string, value: string) => {
        setAnswers(prev => ({...prev, [key]: value}));
    };

    const generateFinalBq = async (initialDetails: BqPromptDetails, questions: DynamicQuestion[], currentAnswers: Record<string, string | number>) => {
        setIsLoading(true);
        setLoadingMessage('Membuat Bill of Quantity...');
        try {
            const generatedItems = await generateBqFromDetails({
                promptDetails: initialDetails,
                answers: currentAnswers,
                questions: questions,
            });
             if (generatedItems && generatedItems.length > 0) {
                onComplete(generatedItems, { projectName: initialDetails.projectTitle, workDuration: initialDetails.duration });
                toast.success('BQ berhasil dibuat oleh AI!');
            } else {
                toast.error('Gagal membuat BQ. Coba dengan deskripsi yang lebih detail.');
            }
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi AI.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const initialDetails: BqPromptDetails = { projectTitle, duration: Number(duration), location, workerType };
        if (!initialDetails.projectTitle || !initialDetails.duration) {
            setError('Judul Proyek dan Durasi wajib diisi.');
            return;
        }
        setError('');
        
        // --- Step 1: Get Questions ---
        if (dynamicQuestions.length === 0) {
            setIsLoading(true);
            setLoadingMessage('Menganalisis proyek & menyiapkan pertanyaan...');
            try {
                const questions = await generateBqQuestions(initialDetails);
                if (questions.length > 0) {
                    setDynamicQuestions(questions);
                } else {
                    toast('Tidak ada pertanyaan lanjutan, BQ akan dibuat langsung.', { icon: 'ℹ️' });
                    await generateFinalBq(initialDetails, [], {});
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Gagal mendapatkan pertanyaan dari AI.');
                setError('Gagal mendapatkan pertanyaan dari AI. Silakan coba lagi.');
            } finally {
                setIsLoading(false);
            }
        } 
        // --- Step 2: Generate BQ ---
        else {
             await generateFinalBq(initialDetails, dynamicQuestions, answers);
        }
    };
    
    if (!isOpen) return null;

    const inputClasses = "w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-honda-red";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
    const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500";

    const isQuestionStep = dynamicQuestions.length > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex flex-col items-center justify-center rounded-xl">
                        <Loader2 className="animate-spin text-honda-red" size={48} />
                        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-200">{loadingMessage}</p>
                    </div>
                )}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-2">
                        <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {isQuestionStep ? 'Jawab Pertanyaan Tambahan' : 'Generate BQ Otomatis'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                         {isQuestionStep ? 'Berikan detail lebih lanjut untuk hasil yang lebih akurat.' : 'Isi detail proyek untuk dibuatkan BQ oleh AI.'}
                    </p>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isQuestionStep ? (
                        <>
                            <div>
                                <label htmlFor="projectTitle" className={labelClasses}>Judul Proyek</label>
                                <div className="relative">
                                   <FileText size={18} className={iconClasses}/>
                                   <input type="text" id="projectTitle" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Contoh: Renovasi Gedung Kantor 2 Lantai" className={inputClasses} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="duration" className={labelClasses}>Lama Pekerjaan (hari)</label>
                                     <div className="relative">
                                       <Calendar size={18} className={iconClasses}/>
                                       <input type="number" id="duration" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Contoh: 90" className={inputClasses} required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="location" className={labelClasses}>Lokasi Proyek</label>
                                    <div className="relative">
                                       <MapPin size={18} className={iconClasses}/>
                                       <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Jakarta" className={inputClasses} required />
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label className={labelClasses}>Tipe Pekerja</label>
                                 <div className="relative">
                                    <HardHat size={18} className={iconClasses}/>
                                    <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-md p-1 pl-10">
                                        <button type="button" onClick={() => setWorkerType('Sertifikasi')} className={`flex-1 py-1 rounded-md text-sm transition ${workerType === 'Sertifikasi' ? 'bg-indigo-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Sertifikasi</button>
                                        <button type="button" onClick={() => setWorkerType('Non Sertifikasi')} className={`flex-1 py-1 rounded-md text-sm transition ${workerType === 'Non Sertifikasi' ? 'bg-indigo-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Non Sertifikasi</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in-up">
                            {dynamicQuestions.map(q => (
                                <div key={q.key}>
                                    <label htmlFor={q.key} className={labelClasses}>{q.question}</label>
                                    <input 
                                        type={q.type} 
                                        id={q.key}
                                        value={answers[q.key] || ''}
                                        onChange={(e) => handleAnswerChange(q.key, e.target.value)}
                                        className={inputClasses + ' pl-4'} // No icon for these
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center gap-4 pt-4">
                        {isQuestionStep && (
                             <button type="button" onClick={() => setDynamicQuestions([])} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">
                                <ArrowLeft size={16}/> Kembali
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:underline">Batal</button>
                        <button type="submit" disabled={isLoading} className="w-48 flex justify-center items-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow disabled:bg-gray-400">
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : (isQuestionStep ? 'Generate BQ' : 'Lanjutkan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateBqModal;
