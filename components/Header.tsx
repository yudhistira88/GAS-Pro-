import React, { useContext, useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Bell, UserCircle, Sun, Moon, Shield, 
  Settings, LogOut, User, CheckCircle, Clock, MessageSquare, Server, Menu 
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
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
    { id: 4, text: 'Pemeliharaan sistem dijadwalkan malam ini pukul 23:00.', time: '2 hari lalu', read: true, icon: <Server className="text-muted-foreground" /> },
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
  
  const dropdownItemClasses = "flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Breadcrumbs or Page Title can go here */}
      <div className="flex-1">
        {/* Example: <h1 className="text-lg font-semibold">Dashboard</h1> */}
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative text-muted-foreground hover:text-foreground">
              <Bell size={22} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{unreadCount}</span>}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute right-0 mt-3 w-80 bg-card border rounded-lg shadow-lg z-20 animate-fade-in-up-fast">
                    <div className="p-3 flex justify-between items-center border-b">
                        <h4 className="font-semibold text-card-foreground">Notifikasi</h4>
                        <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:underline">Tandai semua dibaca</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`flex items-start gap-3 p-3 border-b ${!notif.read ? 'bg-primary/5' : ''}`}>
                                <div className="flex-shrink-0 mt-1">{notif.icon}</div>
                                <div>
                                    <p className="text-sm text-foreground">{notif.text}</p>
                                    <p className="text-xs text-muted-foreground">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 text-center border-t">
                        <ReactRouterDOM.Link to="/notifications" onClick={() => setIsNotificationsOpen(false)} className="text-sm font-medium text-primary hover:underline">Lihat semua notifikasi</ReactRouterDOM.Link>
                    </div>
                 </div>
            )}
        </div>
        
        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-muted">
              <UserCircle size={28} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:block">{currentUser?.name || 'User'}</span>
            </button>
            {isUserMenuOpen && (
                 <div className="absolute right-0 mt-3 w-48 bg-card border rounded-lg shadow-lg z-20 animate-fade-in-up-fast p-2">
                    {currentUser?.role === 'Admin' && (
                      <ReactRouterDOM.Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className={dropdownItemClasses}><Shield size={16} className="mr-2"/> Panel Admin</ReactRouterDOM.Link>
                    )}
                    <ReactRouterDOM.Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className={dropdownItemClasses}><User size={16} className="mr-2"/> Profil</ReactRouterDOM.Link>
                    <ReactRouterDOM.Link to="#" onClick={() => setIsUserMenuOpen(false)} className={dropdownItemClasses}><Settings size={16} className="mr-2"/> Pengaturan</ReactRouterDOM.Link>
                    <div className="border-t my-1 border-border"></div>
                    <button onClick={handleLogout} className={`${dropdownItemClasses} text-destructive`}><LogOut size={16} className="mr-2"/> Keluar</button>
                 </div>
            )}
        </div>

      </div>
    </header>
  );
};

export default Header;
