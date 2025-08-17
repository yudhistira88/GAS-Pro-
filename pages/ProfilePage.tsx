import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import toast, { Toaster } from 'react-hot-toast';
import { Save, UserCircle, KeyRound } from 'lucide-react';

const ProfilePage = () => {
    const { currentUser, updateCurrentUser } = useContext(AuthContext);
    const { users, setUsers } = useContext(UserContext);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    if (!currentUser) {
        return <div className="text-center p-8">Silakan login untuk melihat profil Anda.</div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (currentUser.password !== oldPassword) {
            setError('Password lama tidak cocok.');
            toast.error('Password lama tidak cocok.');
            return;
        }

        if (newPassword.length < 5) {
            setError('Password baru minimal harus 5 karakter.');
            toast.error('Password baru minimal harus 5 karakter.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok.');
            toast.error('Password baru dan konfirmasi tidak cocok.');
            return;
        }

        // Update password in global users list
        const updatedUsers = users.map(u => 
            u.id === currentUser.id ? { ...u, password: newPassword } : u
        );
        setUsers(updatedUsers);

        // Update current user in auth context
        const updatedCurrentUser = { ...currentUser, password: newPassword };
        updateCurrentUser(updatedCurrentUser);

        toast.success('Password berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const inputClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'dark:bg-gray-700 dark:text-white' }}/>
            <div className="max-w-2xl mx-auto animate-fade-in-up">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md dark:border dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-6 border-b dark:border-gray-700 pb-6">
                        <UserCircle size={64} className="text-honda-red" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currentUser.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                            <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">{currentUser.role}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <KeyRound size={20}/> Ubah Password
                    </h2>

                    {error && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="oldPassword" className={labelClasses}>Password Lama</label>
                            <input type="password" id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className={labelClasses}>Password Baru</label>
                            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>Konfirmasi Password Baru</label>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} required />
                        </div>

                        <div className="flex justify-end pt-4">
                             <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
                                <Save size={16} /> Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
