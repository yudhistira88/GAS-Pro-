



import React, { createContext, useState, useEffect } from 'react';
import { type User, type PermissionId } from '../types';

const allPermissions: PermissionId[] = [
    'bq:view', 'bq:create', 'bq:edit', 'bq:delete', 'bq:approve',
    'rab:view', 'rab:create', 'rab:edit', 'rab:delete', 'rab:approve',
    'proyek:view', 'proyek:create', 'proyek:edit', 'proyek:delete',
    'database:view', 'database:edit',
    'admin:access', 'admin:users', 'admin:data', 'admin:logs'
];

export const initialUsers: User[] = [
  { id: 'usr-1', username: 'admin.utama', name: 'Admin Utama', email: 'admin@proyekku.com', role: 'Admin', lastLogin: '2024-07-20T10:00:00Z', status: 'Active', password: '12345', photoUrl: 'https://i.pravatar.cc/150?u=admin@proyekku.com', permissions: allPermissions, plant: ['ALL'] },
  { id: 'usr-2', username: 'bambang.obm', name: 'Bambang OBM', email: 'obm@proyekku.com', role: 'OBM', lastLogin: '2024-07-19T14:30:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=obm@proyekku.com', permissions: ['proyek:view'], plant: ['Sunter'] },
  { id: 'usr-3', username: 'gatot.proyek', name: 'Gatot Proyek', email: 'gas.project@proyekku.com', role: 'GAS Project', lastLogin: '2024-07-18T09:00:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=gas.project@proyekku.com', permissions: ['bq:view', 'bq:create', 'bq:edit', 'rab:view', 'rab:create', 'rab:edit', 'proyek:view', 'proyek:edit', 'database:view'], plant: ['Cikarang P3', 'Karawang P4'] },
  { id: 'usr-4', username: 'manajer.santoso', name: 'Manajer Santoso', email: 'manager.gas@proyekku.com', role: 'Manager GAS', lastLogin: '2024-07-20T11:00:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=manager.gas@proyekku.com', permissions: ['bq:view', 'bq:approve', 'rab:view', 'rab:approve', 'proyek:view'], plant: ['Head Office'] },
  { id: 'usr-5', username: 'dina.purchasing', name: 'Dina Purchasing', email: 'purchasing@proyekku.com', role: 'Purchasing', lastLogin: '2024-07-17T10:00:00Z', status: 'Inactive', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=purchasing@proyekku.com', permissions: ['database:view'], plant: ['ALL'] },
];

interface UserContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const UserContext = createContext<UserContextType>({
  users: [],
  setUsers: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
     try {
      const storedUsers = localStorage.getItem('app_users');
      return storedUsers ? JSON.parse(storedUsers) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);


  return (
    <UserContext.Provider value={{ users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
};