import React, { useState, useContext, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { type Project, type RabDocument, type PriceDatabaseItem, type WorkItem } from '../../types';
import { Download, Upload, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { UserContext, initialUsers } from '../../contexts/UserContext';
import { LogContext, initialLogs } from '../../contexts/LogContext';

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
  const { projects, rabData, bqData, priceDatabase, workItems, setProjects, setRabData, setBqData, setPriceDatabase, setWorkItems, initialData } = ReactRouterDOM.useOutletContext<any>();
  const { users, setUsers } = useContext(UserContext);
  const { logs, setLogs } = useContext(LogContext);
  
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isFormatConfirmOpen, setIsFormatConfirmOpen] = useState(false);
  
  const [selectedData, setSelectedData] = useState<Record<string, boolean>>({
    proyek: false, rab: false, bq: false, dbHarga: false, dbPekerjaan: false, pengguna: false, log: false,
  });
  const [confirmAction, setConfirmAction] = useState<{type: 'format' | 'reset' | null}>({ type: null });

  const dataMap = useMemo(() => ({
    proyek: { name: 'Proyek', setter: setProjects, initial: initialData.initialProjects, formatValue: [] },
    rab: { name: 'RAB', setter: setRabData, initial: initialData.initialRabData, formatValue: [] },
    bq: { name: 'BQ', setter: setBqData, initial: initialData.initialBqData, formatValue: [] },
    dbHarga: { name: 'Database Harga', setter: setPriceDatabase, initial: initialData.initialPriceDatabase, formatValue: [] },
    dbPekerjaan: { name: 'Database Pekerjaan', setter: setWorkItems, initial: initialData.initialWorkItems, formatValue: [] },
    pengguna: { name: 'Pengguna', setter: setUsers, initial: initialUsers, formatValue: initialUsers.filter(u => u.role === 'Admin') },
    log: { name: 'Log Sistem', setter: setLogs, initial: initialLogs, formatValue: [] },
  }), [setProjects, setRabData, setBqData, setPriceDatabase, setWorkItems, setUsers, setLogs, initialData]);

  const handleSelectionChange = (key: string) => {
    setSelectedData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSelectedDataNames = () => Object.keys(selectedData).filter(key => selectedData[key]).map(key => dataMap[key as keyof typeof dataMap].name);
  const isAnyDataSelected = Object.values(selectedData).some(v => v);

  const openConfirmation = (type: 'format' | 'reset') => {
    if (!isAnyDataSelected) {
        toast.error('Pilih setidaknya satu jenis data.');
        return;
    }
    setConfirmAction({ type });
  };

  const handleFormatSelected = () => {
    const selectedNames = getSelectedDataNames();
    Object.entries(selectedData).forEach(([key, isSelected]) => {
        if (isSelected) {
            const dataInfo = dataMap[key as keyof typeof dataMap];
            dataInfo.setter(dataInfo.formatValue);
        }
    });
    toast.success(`Data ${selectedNames.join(', ')} telah diformat.`);
    setConfirmAction({ type: null });
    setSelectedData(prev => Object.keys(prev).reduce((acc, key) => ({...acc, [key]: false}), {}));
  };

  const handleResetSelected = () => {
    const selectedNames = getSelectedDataNames();
    Object.entries(selectedData).forEach(([key, isSelected]) => {
        if (isSelected) {
            const dataInfo = dataMap[key as keyof typeof dataMap];
            dataInfo.setter(dataInfo.initial);
        }
    });
    toast.success(`Data ${selectedNames.join(', ')} telah direset.`);
    setConfirmAction({ type: null });
    setSelectedData(prev => Object.keys(prev).reduce((acc, key) => ({...acc, [key]: false}), {}));
  };
  
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
    setBqData(initialData.initialBqData);
    setPriceDatabase(initialData.initialPriceDatabase);
    setWorkItems(initialData.initialWorkItems);
    setUsers(initialUsers);
    setLogs(initialLogs);
    setIsResetConfirmOpen(false);
    toast.success('Semua data aplikasi berhasil direset ke pengaturan awal!');
  };

  const handleFormatData = () => {
    setProjects([]);
    setRabData([]);
    setBqData([]);
    setPriceDatabase([]);
    setWorkItems([]);
    setUsers(users => users.filter(u => u.role === 'Admin')); // Keep admin users
    setLogs([]);
    setIsFormatConfirmOpen(false);
    toast.success('Seluruh data aplikasi (proyek, RAB, BQ, database, log) telah dihapus! Pengguna non-admin dihapus.');
  };
  
  const handleExportDb = () => {
      const combinedData = { priceItems: priceDatabase, workItems: workItems };
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
        } catch (error) { toast.error('Gagal mem-parsing file JSON.');
        } finally { if (event.target) event.target.value = ''; }
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
        message="Apakah Anda yakin? Semua data akan dikembalikan ke data awal. Tindakan ini tidak dapat dibatalkan."
      />
       <ConfirmationModal 
        isOpen={isFormatConfirmOpen}
        onClose={() => setIsFormatConfirmOpen(false)}
        onConfirm={handleFormatData}
        title="Format Seluruh Data Aplikasi"
        message="PERHATIAN! Tindakan ini akan MENGHAPUS SEMUA data (kecuali admin) secara permanen. Apakah Anda benar-benar yakin?"
      />
       <ConfirmationModal 
        isOpen={confirmAction.type !== null}
        onClose={() => setConfirmAction({ type: null })}
        onConfirm={confirmAction.type === 'format' ? handleFormatSelected : handleResetSelected}
        title={`${confirmAction.type === 'format' ? 'Format' : 'Reset'} Data Terpilih`}
        message={`Anda yakin ingin ${confirmAction.type === 'format' ? 'menghapus' : 'mereset'} data berikut: ${getSelectedDataNames().join(', ')}? Tindakan ini tidak dapat dibatalkan.`}
      />

      <DataManagementCard 
        title="Data Proyek"
        onExportJson={() => handleExport(projects, 'projects_data', 'json')}
        onExportXlsx={() => handleExport(projects, 'projects_data', 'xlsx')}
        onImportJson={(e) => handleImport(e, setProjects, 'Proyek')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataManagementCard 
          title="Data RAB"
          onExportJson={() => handleExport(rabData, 'rab_data', 'json')}
          onExportXlsx={() => handleExport(rabData.map(r => ({...r, detailItems: JSON.stringify(r.detailItems)})), 'rab_data', 'xlsx')}
          onImportJson={(e) => handleImport(e, setRabData, 'RAB')}
        />
        <DataManagementCard 
          title="Data BQ"
          onExportJson={() => handleExport(bqData, 'bq_data', 'json')}
          onExportXlsx={() => handleExport(bqData.map(r => ({...r, detailItems: JSON.stringify(r.detailItems)})), 'bq_data', 'xlsx')}
          onImportJson={(e) => handleImport(e, setBqData, 'BQ')}
        />
      </div>
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
          Tindakan di bawah bersifat permanen dan dapat menyebabkan kehilangan data. Lanjutkan dengan hati-hati.
        </p>

        {/* Granular Actions */}
        <div className="space-y-4">
            <fieldset className="border border-red-300 dark:border-red-700 p-4 rounded-lg">
                <legend className="px-2 font-semibold text-red-700 dark:text-red-200">Aksi Granular (Terpilih)</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 mt-2">
                    {Object.entries(dataMap).map(([key, { name }]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer text-sm text-red-900 dark:text-red-200">
                            <input type="checkbox" checked={selectedData[key] || false} onChange={() => handleSelectionChange(key)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"/>
                            <span>{name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-red-200 dark:border-red-700">
                    <button onClick={() => openConfirmation('format')} disabled={!isAnyDataSelected} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed">
                        <Trash2 size={16} /> Format Data Terpilih
                    </button>
                    <button onClick={() => openConfirmation('reset')} disabled={!isAnyDataSelected} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-400 border border-yellow-500 rounded-lg hover:bg-yellow-500 transition disabled:bg-yellow-300 disabled:cursor-not-allowed">
                        <RefreshCw size={16} /> Reset Data Terpilih
                    </button>
                </div>
            </fieldset>
        </div>

        <div className="my-6 border-t-2 border-dashed border-red-300 dark:border-red-600"></div>

        {/* Global Actions */}
        <div>
            <h4 className="text-md font-semibold text-red-700 dark:text-red-200">Aksi Global (Mempengaruhi SEMUA Data)</h4>
            <div className="flex flex-wrap gap-3 mt-3">
                <button onClick={() => setIsFormatConfirmOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded-lg hover:bg-orange-600 transition">
                    <Trash2 size={16} /> Format Semua Data
                </button>
                <button onClick={() => setIsResetConfirmOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 transition">
                    <RefreshCw size={16} /> Reset Semua Data Aplikasi
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;