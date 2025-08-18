import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { X, User, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AdminAuthModal = ({ isOpen, onClose, onSuccess }: AdminAuthModalProps) => {
    const { users } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthenticate = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const adminUser = users.find(
                u => u.role === 'Admin' && u.email.toLowerCase() === email.toLowerCase()
            );

            if (adminUser && adminUser.password === password) {
                toast.success('Autentikasi Admin berhasil!');
                onSuccess();
            } else {
                setError('Email atau password Admin tidak valid.');
                toast.error('Autentikasi gagal.');
            }
            setIsLoading(false);
        }, 500);
    };
    
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Autentikasi Admin</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Aksi ini membutuhkan hak akses Admin. Silakan masukkan kredensial Admin.</p>
                </div>

                {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4 text-sm" role="alert">{error}</div>}

                <form onSubmit={handleAuthenticate} className="space-y-4 mt-6">
                    <div>
                        <label className="text-sm font-medium text-foreground sr-only">Email Admin</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Admin"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground sr-only">Password Admin</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password Admin"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">Batal</button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-40 flex justify-center items-center py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Autentikasi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAuthModal;
