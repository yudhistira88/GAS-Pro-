
import React, { useContext, useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Bell, UserCircle, LayoutDashboard, FileText, Briefcase, Sun, Moon, Shield, 
  Settings, LogOut, User, CheckCircle, Clock, MessageSquare, Server 
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = ReactRouterDOM.useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'RAB #RAB005 telah disetujui.', time: '5 menit lalu', read: false, icon: <CheckCircle className="text-green-500" /> },
    { id: 2, text: 'Proyek "Website E-commerce Klien A" mendekati tenggat waktu.', time: '2 jam lalu', read: false, icon: <Clock className="text-yellow-500" /> },
    { id: 3, text: 'Komentar baru pada Laporan Proyek "Pembangunan Kantor Cabang".', time: '1 hari lalu', read: true, icon: <MessageSquare className="text-blue-500" /> },
    { id: 4, text: 'Pemeliharaan sistem dijadwalkan malam ini pukul 23:00.', time: '2 hari lalu', read: true, icon: <Server className="text-gray-500" /> },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllAsRead = () => {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setIsNotificationsOpen(false);
  }

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-2 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
      isActive
        ? 'border-honda-red text-honda-red font-semibold'
        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-honda-red dark:hover:text-white hover:border-red-300'
    }`;
  
  const dropdownItemClasses = "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md";

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm px-4 md:px-6 flex justify-between items-center z-20 sticky top-0 transition-colors duration-300">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-honda-red tracking-wider">GAS Pro!</h1>
        <nav className="flex items-center space-x-4 h-full hidden md:flex">
          <ReactRouterDOM.NavLink to="/dashboard" className={navLinkClasses}>
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Dashboard
          </ReactRouterDOM.NavLink>
          {currentUser && !['OBM', 'Purchasing'].includes(currentUser.role) && (
            <ReactRouterDOM.NavLink to="/rab" className={navLinkClasses}>
              <FileText className="mr-2 h-5 w-5" />
              RAB
            </ReactRouterDOM.NavLink>
          )}
          <ReactRouterDOM.NavLink to="/project" className={navLinkClasses}>
            <Briefcase className="mr-2 h-5 w-5" />
            Project
          </ReactRouterDOM.NavLink>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </button>
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Bell size={24} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-honda-red text-white text-xs font-bold">{unreadCount}</span>}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast">
                    <div className="p-3 flex justify-between items-center border-b dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">Notifikasi</h4>
                        <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`flex items-start gap-3 p-3 border-b dark:border-gray-700/50 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <div className="flex-shrink-0 mt-1">{notif.icon}</div>
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{notif.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 text-center border-t dark:border-gray-700">
                        <ReactRouterDOM.Link to="/notifications" className="text-sm font-medium text-blue-600 hover:underline">Lihat semua notifikasi</ReactRouterDOM.Link>
                    </div>
                 </div>
            )}
        </div>
        
        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UserCircle size={28} className="text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{currentUser?.name || 'User'}</span>
            </button>
            {isUserMenuOpen && (
                 <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-up-fast p-2">
                    {currentUser?.role === 'Admin' && (
                      <ReactRouterDOM.Link to="/admin" className={dropdownItemClasses}><Shield size={16} className="mr-2"/> Panel Admin</ReactRouterDOM.Link>
                    )}
                    <ReactRouterDOM.Link to="/profile" className={dropdownItemClasses}><User size={16} className="mr-2"/> Profil</ReactRouterDOM.Link>
                    <ReactRouterDOM.Link to="#" className={dropdownItemClasses}><Settings size={16} className="mr-2"/> Pengaturan</ReactRouterDOM.Link>
                    <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                    <button onClick={handleLogout} className={`${dropdownItemClasses} text-red-600 dark:text-red-400`}><LogOut size={16} className="mr-2"/> Keluar</button>
                 </div>
            )}
        </div>

      </div>
    </header>
  );
};

export default Header;
