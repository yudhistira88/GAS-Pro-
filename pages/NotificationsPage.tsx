import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { CheckCircle, Clock, MessageSquare, Server, Check, Bell } from 'lucide-react';

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  icon: string;
  link?: string;
}

interface NotificationsPageProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const icons: { [key: string]: React.ReactElement } = {
  CheckCircle: <CheckCircle className="text-green-500" />,
  Clock: <Clock className="text-yellow-500" />,
  MessageSquare: <MessageSquare className="text-blue-500" />,
  Server: <Server className="text-gray-500" />,
};


const NotificationsPage = ({ notifications, setNotifications }: NotificationsPageProps) => {

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleMarkAsRead = (id: number) => {
        setNotifications(
            notifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }

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
                        <ReactRouterDOM.Link
                            to={notif.link || '#'}
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id)}
                        >
                            <div 
                                className={`flex items-start gap-4 p-4 border-l-4 rounded-r-lg transition-colors ${
                                    !notif.read 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">{icons[notif.icon] || <Bell/>}</div>
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
                        </ReactRouterDOM.Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;