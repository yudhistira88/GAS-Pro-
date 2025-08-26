import React, { useState, useContext } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
// BQ Imports
import BqLayout from './pages/bq/BqLayout';
import BqDashboard from './pages/bq/BqDashboard';
import BqList from './pages/bq/BqList';
import BqDetail from './pages/bq/BqDetail';
// RAB Imports
import RabLayout from './pages/rab/RabLayout';
import RabDashboard from './pages/rab/RabDashboard';
import RabList from './pages/rab/RabList';
import RabDetail from './pages/rab/RabDetail';
import PriceDatabase from './pages/rab/PriceDatabase';
// Project Imports
import ProjectLayout from './pages/project/ProjectLayout';
import ProjectDashboard from './pages/project/ProjectDashboard';
import ProjectList from './pages/project/ProjectList';
import ProjectDetail from './pages/project/ProjectDetail';
// Admin Imports
import AdminLayout from './pages/admin/AdminLayout';
import AdminPage from './pages/admin/AdminPage';
import UserManagement from './pages/admin/UserManagement';
import SystemLog from './pages/admin/SystemLog';
// Other page imports
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage'; // New import
// Util imports
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './contexts/AuthContext';
import { type RabDocument, type Project, type PriceDatabaseItem, type WorkItem } from './types';


const initialRabData: RabDocument[] = [
  { id: '1', eMPR: 'RAB001', projectName: 'Pembangunan Kantor Cabang Utama di Jakarta Selatan', pic: 'Andi', surveyDate: '2023-05-10', receivedDate: '2023-05-15', finishDate: '2024-01-10', status: 'Selesai', tenderValue: 1200000000, keterangan: 'Selesai lebih cepat dari jadwal.', sla: 0, pdfReady: true,
    detailItems: [
      { id: 'cat-1', type: 'category', uraianPekerjaan: 'PEKERJAAN PERSIAPAN', volume: 0, satuan: '', hargaSatuan: 0, keterangan: '', isEditing: false, isSaved: true },
      { id: 'item-1', type: 'item', uraianPekerjaan: 'Pembersihan Lokasi dan Pematokan', volume: 1, satuan: 'Ls', hargaSatuan: 5000000, keterangan: '', isEditing: false, isSaved: true, ahs: [{id: 'ahs-1', componentName: 'Mandor', quantity: 1, unit: 'HOK', unitPrice: 200000, category: 'Jasa Pekerja', source: 'db'}] },
      { id: 'cat-2', type: 'category', uraianPekerjaan: 'PEKERJAAN STRUKTUR', volume: 0, satuan: '', hargaSatuan: 0, keterangan: '', isEditing: false, isSaved: true },
      { id: 'item-2', type: 'item', uraianPekerjaan: 'Pekerjaan Pondasi Tiang Pancang', volume: 100, satuan: 'm3', hargaSatuan: 1200000, keterangan: 'Beton K-225', isEditing: false, isSaved: true, ahs: [] },
      { id: 'item-3', type: 'item', uraianPekerjaan: 'Pekerjaan Struktur Beton Bertulang', volume: 150, satuan: 'm3', hargaSatuan: 4500000, keterangan: 'Beton K-300', isEditing: false, isSaved: true, ahs: [] },
  ] },
  { id: '2', eMPR: 'RAB002', projectName: 'Pengembangan Website E-commerce untuk Klien A', pic: 'Budi', surveyDate: '2023-06-21', receivedDate: '2023-06-25', finishDate: '2023-09-21', status: 'Selesai', tenderValue: 72500000, keterangan: 'Ada tambahan fitur minor.', sla: 0, pdfReady: true, detailItems: [] },
  { id: '3', eMPR: 'RAB003', projectName: 'Aplikasi Mobile Internal untuk Manajemen SDM', pic: 'Citra', surveyDate: '2023-07-02', receivedDate: null, finishDate: null, status: 'Survey', tenderValue: null, keterangan: 'Menunggu approval direksi.', sla: 0, pdfReady: false, detailItems: [] },
  { id: '4', eMPR: 'RAB004', projectName: 'Proyek Renovasi dan Perbaikan Gedung Utama', pic: 'Andi', surveyDate: '2023-07-15', receivedDate: null, finishDate: null, status: 'Ditolak', tenderValue: null, keterangan: 'Anggaran melebihi budget kuartal ini.', sla: 0, pdfReady: false, detailItems: [] },
  { id: '5', eMPR: 'RAB005', projectName: 'Implementasi Sistem ERP Gudang Terpusat', pic: 'Doni', surveyDate: '2023-08-01', receivedDate: '2023-08-10', finishDate: null, status: 'Diterima', tenderValue: 345000000, keterangan: 'Fase 1 sedang berjalan.', sla: 0, pdfReady: false, detailItems: [] },
];

// I'll create a separate initial data for BQ, just changing the eMPR for now.
const initialBqData: RabDocument[] = JSON.parse(JSON.stringify(initialRabData)).map((item: RabDocument) => ({...item, eMPR: item.eMPR.replace('RAB', 'BQ')}));

const initialProjects: Project[] = [
    { 
        id: 'PROJ001', name: 'Website E-commerce Klien A', team: ['Andi', 'Budi', 'Citra'], status: 'In Progress', dueDate: '2024-09-30', progress: 75,
        group: 'Pengembangan IT',
        description: 'Proyek ini bertujuan untuk mengembangkan platform e-commerce B2C yang modern dan responsif untuk Klien A. Fitur utama termasuk manajemen produk, keranjang belanja, integrasi pembayaran, dan dasbor admin.',
        phases: [
            { id: 'phase-1', name: 'Feasibility', plan: { start: '2024-01-20', end: '2024-03-20' }, actual: { start: '2024-01-22', end: '2024-03-25' }, color: '#3b82f6' },
            { id: 'phase-2', name: 'Planning & Design', plan: { start: '2024-03-20', end: '2024-10-15' }, actual: { start: '2024-03-25', end: '2024-10-20' }, color: '#14b8a6' },
            { id: 'phase-3', name: 'Construction', plan: { start: '2024-10-15', end: '2025-12-20' }, actual: { start: '2024-10-20', end: null }, color: '#f97316' },
            { id: 'phase-4', name: 'Close Out', plan: { start: '2025-12-20', end: '2026-03-01' }, actual: { start: null, end: null }, color: '#ef4444' }
        ]
    },
    { id: 'PROJ002', name: 'Aplikasi Mobile Internal', team: ['Doni', 'Eka'], status: 'In Progress', dueDate: '2024-10-15', progress: 40, group: 'Pengembangan IT', phases: [] },
    { id: 'PROJ003', name: 'Migrasi Sistem Gudang', team: ['Fira', 'Gani', 'Hari'], status: 'Completed', dueDate: '2024-07-20', progress: 100, group: 'Infrastruktur', phases: [], finishDate: '2024-07-18' },
    { id: 'PROJ004', name: 'Pembangunan Kantor Cabang', team: ['Indra', 'Joko'], status: 'Not Started', dueDate: '2025-01-20', progress: 0, group: 'Konstruksi', phases: [] },
    { id: 'PROJ005', name: 'Desain Ulang UI/UX', team: ['Kiki', 'Lina'], status: 'In Progress', dueDate: '2024-08-25', progress: 90, group: 'Pengembangan IT', phases: [] },
    { id: 'PROJ006', name: 'Riset Pasar Produk Baru', team: ['Mega'], status: 'Completed', dueDate: '2024-06-10', progress: 100, group: 'Riset', phases: [], finishDate: '2024-06-12' },
];

const initialPriceDatabase: PriceDatabaseItem[] = [
  { id: 'mat-1', category: 'Material', itemName: 'Semen Portland (50kg)', unit: 'sak', unitPrice: 65000, priceSource: 'Toko Bangunan A', lastUpdated: '2024-07-01T10:00:00Z' },
  { id: 'mat-2', category: 'Material', itemName: 'Pasir Urug', unit: 'm3', unitPrice: 250000, priceSource: 'Supplier B', lastUpdated: '2024-07-05T11:00:00Z' },
  { id: 'mat-3', category: 'Material', itemName: 'Besi Beton Polos 10mm', unit: 'btg', unitPrice: 75000, priceSource: 'Pabrik C', lastUpdated: '2024-06-28T09:00:00Z' },
  { id: 'mat-4', category: 'Material', itemName: 'Cat Tembok Interior (5kg)', unit: 'pail', unitPrice: 125000, lastUpdated: '2024-07-10T09:00:00Z' },
  { id: 'jasa-1', category: 'Jasa Pekerja', itemName: 'Tukang Batu', unit: 'HOK', unitPrice: 150000, lastUpdated: '2024-07-01T10:00:00Z' },
  { id: 'jasa-2', category: 'Jasa Pekerja', itemName: 'Kernet / Helper', unit: 'HOK', unitPrice: 120000, lastUpdated: '2024-07-01T10:00:00Z' },
  { id: 'jasa-3', category: 'Jasa Pekerja', itemName: 'Mandor', unit: 'HOK', unitPrice: 200000, priceSource: 'Internal', lastUpdated: '2024-07-01T10:00:00Z' },
  { id: 'alat-1', category: 'Alat Bantu', itemName: 'Sewa Molen Beton', unit: 'hari', unitPrice: 300000, priceSource: 'Rental D', lastUpdated: '2024-06-15T14:00:00Z' },
];

const seenWorkItems = new Set<string>();
const initialWorkItems: WorkItem[] = [];
initialRabData.forEach(rab => {
    rab.detailItems.forEach(item => {
        if (item.type === 'item' && item.uraianPekerjaan && !seenWorkItems.has(item.uraianPekerjaan.toLowerCase())) {
            seenWorkItems.add(item.uraianPekerjaan.toLowerCase());
            initialWorkItems.push({
                id: `wi-${initialWorkItems.length + 1}`,
                name: item.uraianPekerjaan,
                category: 'Sipil', // Default category
                unit: item.satuan,
                defaultPrice: item.hargaSatuan,
                source: item.ahs && item.ahs.length > 0 ? 'AHS' : 'Manual',
                lastUpdated: new Date().toISOString(),
                defaultAhs: item.ahs || []
            });
        }
    });
});

// Add new preparation work items
const newPreparationItems: Omit<WorkItem, 'id'>[] = [
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, dokumentasi projek (2 rangkap), mobilisasi dan demobilisasi dari lokasi barang/alat ke site 0 - kurang dari 20 km (SUNTER & PEGANGSAAN) (1 s.d 14 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 3408600,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, dokumentasi projek (2 rangkap), mobilisasi dan demobilisasi dari lokasi barang/alat ke site 0 - kurang dari 20 km (SUNTER & PEGANGSAAN) (15 s.d 30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 5118600,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, dokumentasi projek (2 rangkap), mobilisasi dan demobilisasi dari lokasi barang/alat ke site 0 - kurang dari 20 km (SUNTER & PEGANGSAAN) (>30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 9108600,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, proteksi area kerja, dokumentasi projek 2 rangkap, mobilisasi dan demobilisasi dari lokasi barang/alat ke site 20 - kurang dari 40 km (CIKARANG & DELTAMAS) (1 s.d 14 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 3796200,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, proteksi area kerja, dokumentasi projek 2 rangkap, mobilisasi dan demobilisasi dari lokasi barang/alat ke site 20 - kurang dari 40 km (CIKARANG & DELTAMAS) (15 s.d 30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 5506200,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, proteksi area kerja, dokumentasi projek 2 rangkap, mobilisasi dan demobilisasi dari lokasi barang/alat ke site 20 - kurang dari 40 km (CIKARANG & DELTAMAS) (>30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 9496200,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, proteksi area kerja, dokumentasi projek 2 rangkap, mobilisasi dan demobilisasi dari lokasi barang/alat ke site 40 - kurang dari 80 km (KARAWANG) (1 s.d 14 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 7136400,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, proteksi area kerja, dokumentasi projek 2 rangkap, mobilisasi dan demobilisasi dari lokasi barang/alat ke site 40 - kurang dari 80 km (KARAWANG) (15 s.d 30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 8846400,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
    {
        name: 'Persiapan, pengukuran & persiapan alat kerja, penggunaan APD & seragam kerja, pembuangan puing keluar AHM, pembersihan area kerja setiap hari, dokumentasi projek (2 rangkap), mobilisasi dan demobilisasi dari lokasi barang/alat ke site 0 - kurang dari 20 km (KARAWANG) (>30 HK)',
        category: 'Persiapan',
        unit: 'set',
        defaultPrice: 12836400,
        source: 'Manual',
        lastUpdated: new Date().toISOString(),
        defaultAhs: []
    },
];

newPreparationItems.forEach(item => {
    if (!seenWorkItems.has(item.name.toLowerCase())) {
        seenWorkItems.add(item.name.toLowerCase());
        initialWorkItems.push({
            ...item,
            id: `wi-${initialWorkItems.length + 1}`,
        });
    }
});


const MainLayout = ({ notifications, setNotifications }: { notifications: any[], setNotifications: React.Dispatch<React.SetStateAction<any[]>> }) => {
  const { currentUser } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
     return <ReactRouterDOM.Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} notifications={notifications} setNotifications={setNotifications} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ReactRouterDOM.Outlet />
        </main>
      </div>
    </div>
  );
};


const App = () => {
  const [rabData, setRabData] = useState<RabDocument[]>(initialRabData);
  const [bqData, setBqData] = useState<RabDocument[]>(initialBqData); // New state for BQ
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [priceDatabase, setPriceDatabase] = useState<PriceDatabaseItem[]>(initialPriceDatabase);
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialWorkItems);
  const [priceCategories, setPriceCategories] = useState<string[]>(['Material', 'Alat Bantu', 'Jasa Pekerja']);
  const [workCategories, setWorkCategories] = useState<string[]>(['Persiapan', 'Sipil', 'Arsitektur', 'MEP', 'Interior', 'Lainnya']);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Status RAB #RAB005 diperbarui menjadi Diterima.', time: '5 menit lalu', read: false, icon: 'CheckCircle', link: '/rab/detail/5' },
    { id: 2, text: 'Proyek "Website E-commerce Klien A" mendekati tenggat waktu.', time: '2 jam lalu', read: false, icon: 'Clock', link: '/project/detail/PROJ001' },
    { id: 3, text: 'Komentar baru pada Laporan Proyek "Pembangunan Kantor Cabang".', time: '1 hari lalu', read: true, icon: 'MessageSquare', link: '/project/detail/PROJ004' },
    { id: 4, text: 'Pemeliharaan sistem dijadwalkan malam ini pukul 23:00.', time: '2 hari lalu', read: true, icon: 'Server', link: '#' },
    { id: 5, text: 'Database harga material berhasil diimpor.', time: '3 hari lalu', read: true, icon: 'CheckCircle', link: '/rab/database'},
    { id: 6, text: 'Tugas baru ditambahkan ke Proyek "Migrasi Sistem Gudang".', time: '3 hari lalu', read: true, icon: 'MessageSquare', link: '/project/detail/PROJ003'},
  ]);

  const initialDataForAdmin = { initialProjects, initialRabData, initialBqData, initialPriceDatabase, initialWorkItems };

  return (
    <ReactRouterDOM.Routes>
       <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
       <ReactRouterDOM.Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Routes with the main header and layout */}
      <ReactRouterDOM.Route element={<MainLayout notifications={notifications} setNotifications={setNotifications} />}>
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate replace to="/dashboard" />} />
        <ReactRouterDOM.Route path="/dashboard" element={<Dashboard projects={projects} rabData={rabData} bqData={bqData} />} />
        <ReactRouterDOM.Route path="/notifications" element={<NotificationsPage notifications={notifications} setNotifications={setNotifications} />} />
        <ReactRouterDOM.Route path="/profile" element={<ProfilePage />} />
        <ReactRouterDOM.Route path="/settings" element={<SettingsPage />} />
        
        {/* BQ Routes */}
        <ReactRouterDOM.Route path="/bq" element={
          <ProtectedRoute disallowedRoles={['OBM', 'Purchasing']}>
            <BqLayout bqData={bqData} setBqData={setBqData} priceDatabase={priceDatabase} setPriceDatabase={setPriceDatabase} workItems={workItems} setWorkItems={setWorkItems} priceCategories={priceCategories} setPriceCategories={setPriceCategories} workCategories={workCategories} setWorkCategories={setWorkCategories}/>
          </ProtectedRoute>
        }>
          <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate replace to="dashboard" />} />
          <ReactRouterDOM.Route path="dashboard" element={<BqDashboard />} />
          <ReactRouterDOM.Route path="daftar" element={<BqList />} />
          <ReactRouterDOM.Route path="database" element={<PriceDatabase />} />
        </ReactRouterDOM.Route>

        {/* RAB Routes */}
        <ReactRouterDOM.Route path="/rab" element={
          <ProtectedRoute disallowedRoles={['OBM', 'Purchasing']}>
            <RabLayout rabData={rabData} setRabData={setRabData} priceDatabase={priceDatabase} setPriceDatabase={setPriceDatabase} workItems={workItems} setWorkItems={setWorkItems} priceCategories={priceCategories} setPriceCategories={setPriceCategories} workCategories={workCategories} setWorkCategories={setWorkCategories}/>
          </ProtectedRoute>
        }>
          <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate replace to="dashboard" />} />
          <ReactRouterDOM.Route path="dashboard" element={<RabDashboard />} />
          <ReactRouterDOM.Route path="daftar" element={<RabList />} />
          <ReactRouterDOM.Route path="database" element={<PriceDatabase />} />
        </ReactRouterDOM.Route>

        <ReactRouterDOM.Route path="/project" element={<ProjectLayout projects={projects} setProjects={setProjects} />}>
          <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate replace to="dashboard" />} />
          <ReactRouterDOM.Route path="dashboard" element={<ProjectDashboard />} />
          <ReactRouterDOM.Route path="daftar" element={<ProjectList />} />
        </ReactRouterDOM.Route>

        <ReactRouterDOM.Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminLayout 
                projects={projects}
                rabData={rabData}
                bqData={bqData}
                priceDatabase={priceDatabase}
                workItems={workItems}
                setProjects={setProjects} 
                setRabData={setRabData} 
                setBqData={setBqData}
                setPriceDatabase={setPriceDatabase}
                setWorkItems={setWorkItems}
                initialData={initialDataForAdmin}
              />
            </ProtectedRoute>
          }
        >
          <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate replace to="data" />} />
          <ReactRouterDOM.Route path="data" element={<AdminPage />} />
          <ReactRouterDOM.Route path="users" element={<UserManagement />} />
          <ReactRouterDOM.Route path="logs" element={<SystemLog />} />
        </ReactRouterDOM.Route>

      </ReactRouterDOM.Route>

      {/* Full-screen route for BQ Detail, without the MainLayout */}
      <ReactRouterDOM.Route 
        path="/bq/detail/:bqId" 
        element={
          <ProtectedRoute disallowedRoles={['OBM', 'Purchasing']}>
            <BqDetail 
              bqData={bqData} 
              setBqData={setBqData} 
              priceDatabase={priceDatabase} 
              setPriceDatabase={setPriceDatabase}
              workItems={workItems}
              setWorkItems={setWorkItems}
            />
          </ProtectedRoute>
        } 
      />

      {/* Full-screen route for RAB Detail, without the MainLayout */}
      <ReactRouterDOM.Route 
        path="/rab/detail/:rabId" 
        element={
          <ProtectedRoute disallowedRoles={['OBM', 'Purchasing']}>
            <RabDetail 
              rabData={rabData} 
              setRabData={setRabData} 
              priceDatabase={priceDatabase} 
              setPriceDatabase={setPriceDatabase}
              workItems={workItems}
              setWorkItems={setWorkItems}
            />
          </ProtectedRoute>
        } 
      />

      {/* Full-screen route for Project Detail, without the MainLayout */}
      <ReactRouterDOM.Route 
        path="/project/detail/:projectId" 
        element={<ProjectDetail projects={projects} setProjects={setProjects} />} 
      />
    </ReactRouterDOM.Routes>
  );
};

export default App;