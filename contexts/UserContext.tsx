
import React, { createContext, useState, useEffect } from 'react';
import { type User } from '../types';

const initialUsers: User[] = [
  { id: 'usr-1', name: 'Admin Utama', email: 'admin@proyekku.com', role: 'Admin', lastLogin: '2024-07-20T10:00:00Z', status: 'Active', password: '12345', photoUrl: 'https://i.pravatar.cc/150?u=admin@proyekku.com' },
  { id: 'usr-2', name: 'Bambang OBM', email: 'obm@proyekku.com', role: 'OBM', lastLogin: '2024-07-19T14:30:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=obm@proyekku.com' },
  { id: 'usr-3', name: 'Gatot Proyek', email: 'gas.project@proyekku.com', role: 'GAS Project', lastLogin: '2024-07-18T09:00:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=gas.project@proyekku.com' },
  { id: 'usr-4', name: 'Manajer Santoso', email: 'manager.gas@proyekku.com', role: 'Manager GAS', lastLogin: '2024-07-20T11:00:00Z', status: 'Active', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=manager.gas@proyekku.com' },
  { id: 'usr-5', name: 'Dina Purchasing', email: 'purchasing@proyekku.com', role: 'Purchasing', lastLogin: '2024-07-17T10:00:00Z', status: 'Inactive', password: 'password', photoUrl: 'https://i.pravatar.cc/150?u=purchasing@proyekku.com' },
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
