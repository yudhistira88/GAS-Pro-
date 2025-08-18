import React, { useState, useContext } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type Project, type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';
import { Download, Upload, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { UserContext } from '../../contexts/UserContext'; // Using global user context

interface DataManagementCardProps {
  title: string;
  onExportJson: () => void;
  onExportXlsx: () => void;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const DataManagementCard = ({ title, onExportJson, onExportXlsx, onImportJson }: DataManagementCardProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onExportJson} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">
          <Download size={16} /> Export JSON
        </button>
        <button onClick={onExportXlsx} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition">
          <Download size={16} /> Export Excel
        </button>
        <input
          type="file"
          accept=".json"
          onChange={onImportJson}
          className="hidden"
          ref={fileInputRef}
        />
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
          <Upload size={16} /> Import JSON
        </button>
      </div>
    </div>
  );
};


const AdminPage = () => {
  // Using context from the parent layout (`AdminLayout`) for data props
  const { projects, rabData, priceDatabase, workItems, setProjects, setRabData, setPriceDatabase, setWorkItems, initialData } = ReactRouterDOM.useOutletContext<any>();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isFormatConfirmOpen, setIsFormatConfirmOpen] = useState(false);
  const [isResetExceptDbConfirmOpen, setIsResetExceptDbConfirmOpen] = useState(false);
  
  const handleExport = (data: any, filename: string, type: 'json' | 'xlsx') => {
    if (type === 'json') {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `${filename}.json`;
      link.click();
      toast.success(`${filename}.json diekspor!`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, filename);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success(`${filename}.xlsx diekspor!`);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any[]>>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setter(data);
          toast.success(`Data ${dataType} berhasil diimpor!`);
        } else {
          toast.error('File JSON tidak valid. Harus berisi array.');
        }
      } catch (error) {
        toast.error(`Gagal mem-parsing file JSON untuk ${dataType}.`);
      } finally {
         if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    setProjects(initialData.initialProjects);
    setRabData(initialData.initialRabData);
    setPriceDatabase(initialData.initialPriceDatabase);
    setWorkItems(initialData.initialWorkItems);
    setIsResetConfirmOpen(false);
    toast.success('Semua data aplikasi berhasil direset ke pengaturan awal!');
  };

  const handleResetExceptDb = () => {
    setProjects(initialData.initialProjects);
    setRabData(initialData.initialRabData);
    setIsResetExceptDbConfirmOpen(false);
    toast.success('Data proyek dan RAB berhasil direset. Database tetap aman!');
  };

  const handleFormatData = () => {
    setProjects([]);
    setRabData([]);
    setPriceDatabase([]);
    setWorkItems([]);
    setIsFormatConfirmOpen(false);
    toast.success('Seluruh data aplikasi (proyek, RAB, database) telah dihapus!');
  };
  
  const handleExportDb = () => {
      const combinedData = {
          priceItems: priceDatabase,
          workItems: workItems,
      };
      handleExport(combinedData, 'database_data', 'json');
  }

  const handleExportDbXlsx = () => {
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(priceDatabase);
      XLSX.utils.book_append_sheet(wb, ws1, "Price Items");
      const ws2 = XLSX.utils.json_to_sheet(workItems);
      XLSX.utils.book_append_sheet(wb, ws2, "Work Items");
      XLSX.writeFile(wb, 'database_data.xlsx');
      toast.success('database_data.xlsx diekspor!');
  }

  const handleImportDb = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);
            if (data.priceItems && Array.isArray(data.priceItems) && data.workItems && Array.isArray(data.workItems)) {
                setPriceDatabase(data.priceItems);
                setWorkItems(data.workItems);
                toast.success('Data Database berhasil diimpor!');
            } else {
                toast.error('File JSON tidak valid. Harus berisi objek dengan kunci "priceItems" dan "workItems".');
            }
        } catch (error) {
            toast.error('Gagal mem-parsing file JSON.');
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <ConfirmationModal 
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Seluruh Data Aplikasi"
        message="Apakah Anda yakin? Semua data proyek, RAB, dan database akan dikembalikan ke data awal. Tindakan ini tidak dapat dibatalkan."
      />

       <ConfirmationModal 
        isOpen={isFormatConfirmOpen}
        onClose={() => setIsFormatConfirmOpen(false)}
        onConfirm={handleFormatData}
        title="Format Seluruh Data Aplikasi"
        message="PERHATIAN! Tindakan ini akan MENGHAPUS SEMUA data proyek, RAB, dan database secara permanen. Data akan menjadi kosong. Apakah Anda benar-benar yakin?"
      />

      <ConfirmationModal 
        isOpen={isResetExceptDbConfirmOpen}
        onClose={() => setIsResetExceptDbConfirmOpen(false)}
        onConfirm={handleResetExceptDb}
        title="Reset Data (Kecuali Database)"
        message="Anda yakin? Semua data Proyek dan RAB akan dikembalikan ke data awal. Data Database Harga dan Pekerjaan TIDAK akan terpengaruh. Tindakan ini tidak dapat dibatalkan."
      />

      <DataManagementCard 
        title="Data Proyek"
        onExportJson={() => handleExport(projects, 'projects_data', 'json')}
        onExportXlsx={() => handleExport(projects, 'projects_data', 'xlsx')}
        onImportJson={(e) => handleImport(e, setProjects, 'Proyek')}
      />
      <DataManagementCard 
        title="Data RAB"
        onExportJson={() => handleExport(rabData, 'rab_data', 'json')}
        onExportXlsx={() => handleExport(rabData.map(r => ({...r, detailItems: JSON.stringify(r.detailItems)})), 'rab_data', 'xlsx')}
        onImportJson={(e) => handleImport(e, setRabData, 'RAB')}
      />
      <DataManagementCard 
        title="Database Harga & Pekerjaan"
        onExportJson={handleExportDb}
        onExportXlsx={handleExportDbXlsx}
        onImportJson={handleImportDb}
      />

      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
        <h3 className="text-lg font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle size={20} /> Danger Zone
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-2 mb-4">
          Tindakan berikut bersifat permanen dan dapat menyebabkan kehilangan data. Lanjutkan dengan hati-hati.
        </p>
        <div className="flex flex-wrap gap-3">
             <button
                onClick={() => setIsFormatConfirmOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded-lg hover:bg-orange-600 transition"
                >
                <Trash2 size={16} /> Format Data
            </button>
            <button
                onClick={() => setIsResetExceptDbConfirmOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-yellow-600 rounded-lg hover:bg-yellow-600 transition"
            >
                <RefreshCw size={16} /> Reset Kecuali Database
            </button>
            <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 transition"
            >
            <RefreshCw size={16} /> Reset Semua Data Aplikasi
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
