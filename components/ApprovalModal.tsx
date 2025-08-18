import React, { useState, useEffect } from 'react';
import { type RabDocument } from '../types';
import { X, Send, Paperclip } from 'lucide-react';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (details: { to: string, cc: string, subject: string, body: string }) => void;
    rab: RabDocument | null;
    pdfDataUri: string | null;
}

const ApprovalModal = ({ isOpen, onClose, onSend, rab, pdfDataUri }: ApprovalModalProps) => {
    const [toEmail, setToEmail] = useState('atasan@proyekku.com');
    const [ccEmail, setCcEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (rab) {
            const isBq = rab.eMPR.toUpperCase().startsWith('BQ');
            const docType = isBq ? 'BQ' : 'RAB';
            const docName = isBq ? 'Bill of Quantity (BQ)' : 'Rencana Anggaran Biaya (RAB)';
            const senderName = rab.creatorName || "Tim Proyek";
            setSubject(`Approval ${docType} - ${rab.projectName}`);
            setBody(
`Yth. Bapak/Ibu,

Bersama ini kami sampaikan ${docName} untuk proyek "${rab.projectName}" dengan detail sebagaimana terlampir.

Mohon dapat direview dan di-approve untuk kelanjutan proses berikutnya.

Terima kasih atas perhatian dan kerjasamanya.

Hormat kami,
${senderName}`
            );
        }
    }, [rab]);

    const handleSendClick = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!toEmail || !emailRegex.test(toEmail)) {
            setError('Silakan masukkan alamat email tujuan yang valid.');
            return;
        }
        if (ccEmail && !emailRegex.test(ccEmail)) {
            setError('Alamat email CC tidak valid.');
            return;
        }
        setError('');
        onSend({ to: toEmail, cc: ccEmail, subject, body });
    };

    if (!isOpen || !rab) return null;

    const docType = rab.eMPR.toUpperCase().startsWith('BQ') ? 'BQ' : 'RAB';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl relative animate-fade-in-up flex flex-col" style={{ height: '90vh' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Kirim {docType} untuk Approval</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Left: Form */}
                    <div className="flex flex-col space-y-4">
                        <div>
                            <label htmlFor="toEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Tujuan</label>
                            <input
                                type="email"
                                id="toEmail"
                                value={toEmail}
                                onChange={(e) => setToEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                        </div>
                         <div>
                            <label htmlFor="ccEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CC (Opsional)</label>
                            <input
                                type="email"
                                id="ccEmail"
                                value={ccEmail}
                                onChange={(e) => setCcEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                placeholder="Pisahkan dengan koma untuk lebih dari satu"
                            />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjek</label>
                            <input
                                type="text"
                                id="subject"
                                value={subject}
                                readOnly
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 cursor-not-allowed"
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        <div>
                            <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Isi Email</label>
                            <textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={8}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                        </div>
                    </div>

                    {/* Right: PDF Preview */}
                    <div className="flex flex-col min-h-0">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                           <Paperclip size={16}/> Lampiran: Pratinjau PDF
                        </h4>
                        {pdfDataUri ? (
                            <iframe src={pdfDataUri} className="w-full flex-grow border dark:border-gray-700 rounded-md" title="PDF Preview"></iframe>
                        ) : (
                            <div className="w-full flex-grow border-2 border-dashed dark:border-gray-700 rounded-md flex items-center justify-center text-gray-500">
                                Memuat Pratinjau PDF...
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                    <button onClick={handleSendClick} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow">
                        <Send size={16}/>
                        <span>Kirim Email</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;
