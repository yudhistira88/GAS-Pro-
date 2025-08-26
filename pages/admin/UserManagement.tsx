






import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { type User } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { AuthContext } from '../../contexts/AuthContext';
import { LogContext } from '../../contexts/LogContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import UserModal from '../../components/UserModal';
import toast from 'react-hot-toast';

interface RoleBadgeProps {
  role: User['role'];
}
const RoleBadge = ({ role }: RoleBadgeProps) => {
    const roleClasses: Record<User['role'], string> = {
        Admin: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'OBM': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'GAS Project': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Manager GAS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        Purchasing: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        Custom: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleClasses[role]}`}>{role}</span>;
}

const UserManagement = () => {
  const { users, setUsers } = useContext(UserContext);
  const { currentUser } = useContext(AuthContext);
  const { addLog } = useContext(LogContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);


  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (data: Omit<User, 'id' | 'lastLogin'> & { id?: string }) => {
    if (data.id) { // Update
      setUsers(prev => prev.map(u => (u.id === data.id ? { ...u, ...data } : u)));
      addLog({ level: 'INFO', user: currentUser!.name, action: 'USER_UPDATED', details: `User '${data.name}' (ID: ${data.id}) was updated.` });
      toast.success('Pengguna berhasil diperbarui.');
    } else { // Create
      const newUser: User = {
        ...data,
        id: `usr-${Date.now()}`,
        lastLogin: new Date().toISOString(),
      };
      setUsers(prev => [...prev, newUser]);
      addLog({ level: 'INFO', user: currentUser!.name, action: 'USER_CREATED', details: `New user '${data.name}' was created.` });
      toast.success('Pengguna baru berhasil ditambahkan.');
    }
    setIsModalOpen(false);
  };

  const handleDeleteRequest = (userId: string) => {
    setUserToDelete(userId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      const user = users.find(u => u.id === userToDelete);
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      if (user) {
          addLog({ level: 'WARNING', user: currentUser!.name, action: 'USER_DELETED', details: `User '${user.name}' (ID: ${userToDelete}) was deleted.` });
      }
      toast.success('Pengguna berhasil dihapus.');
    }
    setIsConfirmOpen(false);
    setUserToDelete(null);
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
      />
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingUser}
      />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:border dark:border-gray-700 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-honda-red focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
          </div>
          <button onClick={handleOpenCreateModal} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-honda-red rounded-lg hover:bg-red-700 transition shadow">
            <Plus size={16} /> Tambah Pengguna Baru
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Nama</th>
                <th scope="col" className="px-6 py-3">User Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Akses Plant</th>
                <th scope="col" className="px-6 py-3">Login Terakhir</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="w-8 h-8 rounded-full object-cover" src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random`} alt={`${user.name} profile`} />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{user.username}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                    {user.role === 'Custom' && user.permissions && (
                        <p className="text-xs text-muted-foreground mt-1">{user.permissions.length} custom permissions</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                        {user.plant.includes('ALL') ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                All Plants
                            </span>
                        ) : (
                            user.plant.map(p => (
                                <span key={p} className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                    {p}
                                </span>
                            ))
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{new Date(user.lastLogin).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEditModal(user)} className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" title="Edit Pengguna"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteRequest(user.id)} className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400" title="Hapus Pengguna"><Trash2 size={16}/></button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UserManagement;