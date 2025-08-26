



import React, { useState, useEffect, useRef } from 'react';
import { type User, type PermissionId } from '../types';
import { X, User as UserIcon, Mail, KeyRound, Shield, Check, Pen } from 'lucide-react';

type FormData = Omit<User, 'id' | 'lastLogin'>;

const permissionStructure = [
    {
        groupName: 'Manajemen BQ',
        permissions: [
            { id: 'bq:view', label: 'Lihat Daftar & Detail' },
            { id: 'bq:create', label: 'Buat BQ Baru' },
            { id: 'bq:edit', label: 'Edit & Ubah BQ' },
            { id: 'bq:delete', label: 'Hapus BQ' },
            { id: 'bq:approve', label: 'Setujui/Tolak BQ' },
        ]
    },
    {
        groupName: 'Manajemen RAB',
        permissions: [
            { id: 'rab:view', label: 'Lihat Daftar & Detail' },
            { id: 'rab:create', label: 'Buat RAB Baru' },
            { id: 'rab:edit', label: 'Edit & Ubah RAB' },
            { id: 'rab:delete', label: 'Hapus RAB' },
            { id: 'rab:approve', label: 'Setujui/Tolak RAB' },
        ]
    },
    {
        groupName: 'Manajemen Proyek',
        permissions: [
            { id: 'proyek:view', label: 'Lihat Daftar & Detail' },
            { id: 'proyek:create', label: 'Buat Proyek Baru' },
            { id: 'proyek:edit', label: 'Edit & Ubah Proyek' },
            { id: 'proyek:delete', label: 'Hapus Proyek' },
        ]
    },
    {
        groupName: 'Database',
        permissions: [
            { id: 'database:view', label: 'Lihat Database Harga & Pekerjaan' },
            { id: 'database:edit', label: 'Edit Database Harga & Pekerjaan' },
        ]
    },
    {
        groupName: 'Panel Admin',
        permissions: [
            { id: 'admin:access', label: 'Akses Panel Admin' },
            { id: 'admin:users', label: 'Kelola Pengguna' },
            { id: 'admin:data', label: 'Kelola Data Aplikasi' },
            { id: 'admin:logs', label: 'Lihat Log Sistem' },
        ]
    }
];

const allPermissionIds: PermissionId[] = permissionStructure.flatMap(group => group.permissions.map(p => p.id as PermissionId));

const rolePermissions: Record<Exclude<User['role'], 'Custom'>, PermissionId[]> = {
    'Admin': allPermissionIds,
    'Manager GAS': ['bq:view', 'bq:approve', 'rab:view', 'rab:approve', 'proyek:view'],
    'GAS Project': ['bq:view', 'bq:create', 'bq:edit', 'rab:view', 'rab:create', 'rab:edit', 'proyek:view', 'proyek:edit', 'database:view'],
    'OBM': ['proyek:view'],
    'Purchasing': ['database:view'],
};

const availablePlants = [
    "Sunter", "Pegangsaan", "Pulogadung", "Cikarang P3", "Cikarang P3A", 
    "Cikarang DMD", "Deltamas SRTC", "Deltamas PQE", "Deltamas P6", 
    "Karawang P4", "Karawang P5", "Karawang PC"
];

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData & { id?: string }) => void;
    initialData: User | null;
}

const emptyFormState: FormData = {
    username: '',
    name: '',
    email: '',
    role: 'Purchasing',
    status: 'Active',
    password: '',
    permissions: rolePermissions['Purchasing'],
    photoUrl: '',
    plant: [],
};

const UserModal = ({ isOpen, onClose, onSave, initialData }: UserModalProps) => {
    const [formData, setFormData] = useState<FormData>(emptyFormState);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    username: initialData.username,
                    name: initialData.name,
                    email: initialData.email,
                    role: initialData.role,
                    status: initialData.status,
                    password: '', // Password is not pre-filled for editing
                    permissions: initialData.permissions || [],
                    photoUrl: initialData.photoUrl || '',
                    plant: initialData.plant || [],
                });
            } else {
                setFormData(emptyFormState);
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const inputClasses = "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring";
    const labelClasses = "block text-sm font-medium text-foreground mb-1.5";
    const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as User['role'];
        const newPermissions = newRole !== 'Custom' ? rolePermissions[newRole] : formData.permissions;
        setFormData(prev => ({...prev, role: newRole, permissions: newPermissions}));
    };

    const handlePermissionChange = (permissionId: PermissionId, isChecked: boolean) => {
        let newPermissions: PermissionId[];
        if (isChecked) {
            newPermissions = [...formData.permissions, permissionId];
        } else {
            newPermissions = formData.permissions.filter(id => id !== permissionId);
        }
        setFormData(prev => ({...prev, permissions: newPermissions, role: 'Custom'}));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePlantChange = (plantName: string, isChecked: boolean) => {
        let newPlants: string[];
        if (isChecked) {
            newPlants = [...formData.plant, plantName];
        } else {
            newPlants = formData.plant.filter(p => p !== plantName);
        }
        setFormData(prev => ({ ...prev, plant: newPlants }));
    };

    const handleAllPlantsChange = (isChecked: boolean) => {
        setFormData(prev => ({ ...prev, plant: isChecked ? ['ALL'] : [] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password, username } = formData;
        if (!name || !email || !username) {
            setError('Nama, User Name, dan Email harus diisi.');
            return;
        }
        if (formData.plant.length === 0) {
            setError('Pengguna harus memiliki akses ke setidaknya satu plant.');
            return;
        }
        if (!isEditMode && (!password || password.length < 5)) {
            setError('Password baru minimal harus 5 karakter.');
            return;
        }
        if (isEditMode && password && password.length < 5) {
            setError('Jika diubah, password minimal harus 5 karakter.');
            return;
        }

        setError('');
        
        const dataToSave: any = { ...formData };
        if (isEditMode) {
            dataToSave.id = initialData?.id;
            if (!dataToSave.password) {
                delete dataToSave.password;
            }
        }

        onSave(dataToSave);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-4xl transform transition-all animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start justify-between p-6 border-b border-border rounded-t-xl">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h2>
                            <p className="text-sm text-muted-foreground">Kelola informasi, role, dan hak akses pengguna.</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <img src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name.replace(/\s/g, '+')}&background=random&color=fff&size=96`} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-primary/20"/>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Pen size={24} />
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                             <div>
                                <label htmlFor="name" className={labelClasses}>Nama Lengkap</label>
                                <div className="relative"><UserIcon size={18} className={iconClasses} /><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClasses} required/></div>
                            </div>
                            <div>
                                <label htmlFor="username" className={labelClasses}>User Name</label>
                                <div className="relative"><UserIcon size={18} className={iconClasses} /><input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className={inputClasses} required/></div>
                            </div>
                            <div>
                                <label htmlFor="email" className={labelClasses}>Email</label>
                                <div className="relative"><Mail size={18} className={iconClasses} /><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClasses} required/></div>
                            </div>
                             <div>
                                <label htmlFor="password" className={labelClasses}>Password</label>
                                 <div className="relative"><KeyRound size={18} className={iconClasses} /><input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className={inputClasses} placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : ''} /></div>
                            </div>
                        </div>

                        {/* Right Column: Roles & Permissions */}
                        <div className="md:col-span-2">
                             {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="role" className={labelClasses}>Role</label>
                                    <select name="role" id="role" value={formData.role} onChange={handleRoleChange} className={`${inputClasses} pl-4`} required>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager GAS">Manager GAS</option>
                                        <option value="GAS Project">GAS Project</option>
                                        <option value="OBM">OBM</option>
                                        <option value="Purchasing">Purchasing</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="status" className={labelClasses}>Status</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleChange} className={`${inputClasses} pl-4`} required>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                             <div className="mt-6 border-t border-border pt-4">
                                <label className={labelClasses}>Akses Plant</label>
                                <p className="text-xs text-muted-foreground mb-4">Pilih plant mana yang dapat diakses oleh pengguna ini.</p>
                                <fieldset className="border border-input rounded-lg p-4">
                                    <div className="space-y-2">
                                        <label key="all-plants" className="flex items-center text-sm space-x-2 cursor-pointer text-foreground font-semibold">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.plant.includes('ALL')}
                                                onChange={(e) => handleAllPlantsChange(e.target.checked)}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring" 
                                            />
                                            <span>Akses Semua Plant</span>
                                        </label>
                                        <div className="border-t border-border my-2"></div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                            {availablePlants.map(plant => (
                                                <label key={plant} className="flex items-center text-sm space-x-2 cursor-pointer text-muted-foreground">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.plant.includes('ALL') || formData.plant.includes(plant)}
                                                        disabled={formData.plant.includes('ALL')}
                                                        onChange={(e) => handlePlantChange(plant, e.target.checked)}
                                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:opacity-50" 
                                                    />
                                                    <span>{plant}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </fieldset>
                            </div>

                            <div className="mt-6 border-t border-border pt-4">
                                <label className={labelClasses}>Hak Akses (Permissions)</label>
                                <p className="text-xs text-muted-foreground mb-4">Pilih role di atas untuk preset, atau pilih manual untuk role "Custom".</p>
                                <div className="space-y-4">
                                    {permissionStructure.map(group => (
                                        <fieldset key={group.groupName} className="border border-input rounded-lg p-4">
                                            <legend className="text-sm font-semibold text-foreground px-2">{group.groupName}</legend>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {group.permissions.map(perm => (
                                                    <label key={perm.id} className="flex items-center text-sm space-x-2 cursor-pointer text-muted-foreground">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={formData.permissions.includes(perm.id as PermissionId)}
                                                            onChange={(e) => handlePermissionChange(perm.id as PermissionId, e.target.checked)}
                                                            className="h-4 w-4 rounded border-input text-primary focus:ring-ring" 
                                                        />
                                                        <span>{perm.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end p-6 border-t border-border rounded-b-xl bg-muted/50">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted">Batal</button>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow">
                                Simpan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;