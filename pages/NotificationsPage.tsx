import React, { useState } from 'react';
import { CheckCircle, Clock, MessageSquare, Server, Check } from 'lucide-react';

const initialNotifications = [
  { id: 1, text: 'RAB #RAB005 telah disetujui.', time: '5 menit lalu', read: false, icon: <CheckCircle className="text-green-500" /> },
  { id: 2, text: 'Proyek "Website E-commerce Klien A" mendekati tenggat waktu.', time: '2 jam lalu', read: false, icon: <Clock className="text-yellow-500" /> },
  { id: 3, text: 'Komentar baru pada Laporan Proyek "Pembangunan Kantor Cabang".', time: '1 hari lalu', read: true, icon: <MessageSquare className="text-blue-500" /> },
  { id: 4, text: 'Pemeliharaan sistem dijadwalkan malam ini pukul 23:00.', time: '2 hari lalu', read: true, icon: <Server className="text-gray-500" /> },
  { id: 5, text: 'Database harga material berhasil diimpor.', time: '3 hari lalu', read: true, icon: <CheckCircle className="text-green-500" /> },
  { id: 6, text: 'Tugas baru ditambahkan ke Proyek "Migrasi Sistem Gudang".', time: '3 hari lalu', read: true, icon: <MessageSquare className="text-blue-500" /> },
];

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState(initialNotifications);

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Notifikasi</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Lihat semua pemberitahuan Anda di satu tempat.</p>
                    </div>
                    <button 
                        onClick={handleMarkAllAsRead} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow"
                    >
                        <Check size={16} />
                        Tandai semua dibaca
                    </button>
                </div>

                <div className="space-y-4">
                    {notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className={`flex items-start gap-4 p-4 border-l-4 rounded-r-lg transition-colors ${
                                !notif.read 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                                : 'bg-gray-50 dark:bg-gray-700/50 border-transparent'
                            }`}
                        >
                            <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">{notif.icon}</div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800 dark:text-gray-100">{notif.text}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && (
                                <div className="flex-shrink-0">
                                    <span className="h-2.5 w-2.5 bg-blue-500 rounded-full block" title="Belum dibaca"></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
