
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Project, type ProjectPhase } from '../../types';
import { ArrowLeft, Users, FileText, LayoutDashboard, TrendingUp, BookOpen, Folder, Menu, X, UploadCloud, File, Trash2, Download } from 'lucide-react';
import SingleProjectDashboard from './SingleProjectDashboard';
import ProjectDetailSidebar from '../../components/ProjectDetailSidebar';
import ProjectDetailHeader from '../../components/ProjectDetailHeader';
import KurvaS from './KurvaS';
import ProjectReport from './ProjectReport';
import toast from 'react-hot-toast';

interface ProjectDetailProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const DetailView = ({ project }: { project: Project }) => (
    <div className="animate-fade-in-up space-y-6">
        <div className="bg-card p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-bold text-card-foreground mb-6">Informasi Proyek</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                    <p className="text-muted-foreground font-semibold">Nama Proyek</p>
                    <p className="text-card-foreground font-medium text-base">{project.name}</p>
                </div>
                <div>
                    <p className="text-muted-foreground font-semibold">Grup</p>
                    <p className="text-card-foreground">{project.group || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground font-semibold">Status</p>
                    <p className="text-card-foreground">{project.status}</p>
                </div>
                <div>
                    <p className="text-muted-foreground font-semibold">Tenggat Waktu</p>
                    <p className="text-card-foreground">{new Date(project.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="lg:col-span-2">
                    <p className="text-muted-foreground font-semibold">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="font-semibold text-card-foreground">{project.progress}%</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-md border">
                <h3 className="text-xl font-bold text-card-foreground mb-4">Deskripsi Proyek</h3>
                <p className="text-muted-foreground leading-relaxed">
                    {project.description || (
                        <>
                            Proyek "{project.name}" adalah inisiatif strategis yang bertujuan untuk [tujuan proyek - placeholder]. 
                            Ruang lingkup proyek ini mencakup [ruang lingkup - placeholder]. 
                            Fokus utama kami adalah untuk memberikan hasil berkualitas tinggi tepat waktu dan sesuai anggaran.
                        </>
                    )}
                </p>
            </div>
            <div className="lg:col-span-1 bg-card p-6 rounded-xl shadow-md border">
                <h3 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2"><Users size={20}/> Anggota Tim</h3>
                <ul className="space-y-3">
                    {project.team.map((member, index) => (
                        <li key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                                {member.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-card-foreground">{member}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const DokumenView = () => {
    const mockFiles = [
        { id: 'file-1', name: 'Rencana_Anggaran_Biaya_v2.xlsx', size: '2.3 MB', date: '2024-07-15', category: 'Keuangan' },
        { id: 'file-2', name: 'Gambar_Teknis_Lantai_1.pdf', size: '5.1 MB', date: '2024-07-12', category: 'Gambar Kerja' },
        { id: 'file-3', name: 'Kontrak_Kerja_Utama.docx', size: '850 KB', date: '2024-07-10', category: 'Kontrak' },
        { id: 'file-4', name: 'Foto_Survey_Lokasi.zip', size: '15.8 MB', date: '2024-07-05', category: 'Dokumentasi Foto' },
        { id: 'file-5', name: 'Laporan_Mingguan_W1.pdf', size: '1.2 MB', date: '2024-07-22', category: 'Laporan Mingguan' },
    ];

    const [files, setFiles] = useState(mockFiles);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [newFileData, setNewFileData] = useState<{ file: File | null, category: string }>({ file: null, category: 'Lain-lain' });

    const categories = useMemo(() => ['all', ...Array.from(new Set(files.map(f => f.category)))], [files]);
    const availableCategories = useMemo(() => categories.filter(c => c !== 'all'), [categories]);

    const filteredFiles = useMemo(() => {
        if (categoryFilter === 'all') {
            return files;
        }
        return files.filter(file => file.category === categoryFilter);
    }, [files, categoryFilter]);
    
    const CategoryBadge = ({ category }: { category: string }) => {
        const colorHash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = colorHash % 360;
        return (
            <span 
                className="px-2 py-1 text-xs font-semibold rounded-full"
                style={{ backgroundColor: `hsla(${hue}, 60%, 90%, 1)`, color: `hsla(${hue}, 80%, 30%, 1)` }}
            >
                {category}
            </span>
        );
    };

    const handleDelete = (id: string) => {
        setFiles(files.filter(file => file.id !== id));
        toast.success("Dokumen dihapus.");
    };
    
    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileData.file) {
            toast.error("Silakan pilih file untuk diunggah.");
            return;
        }

        const newFile = {
            id: `file-${Date.now()}`,
            name: newFileData.file.name,
            size: `${(newFileData.file.size / 1024 / 1024).toFixed(2)} MB`,
            date: new Date().toISOString().split('T')[0],
            category: newFileData.category
        };
        setFiles(prev => [newFile, ...prev]);
        setShowUploadForm(false);
        setNewFileData({ file: null, category: 'Lain-lain' });
        toast.success("Dokumen berhasil diunggah.");
    };

    return (
        <div className="animate-fade-in-up space-y-6">
            <div className="bg-card p-6 rounded-xl shadow-md border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-card-foreground">Dokumen Proyek</h3>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex-grow">
                            <select 
                                value={categoryFilter} 
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'Semua Kategori' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setShowUploadForm(p => !p)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition shadow"
                        >
                            <UploadCloud size={16} /> Unggah
                        </button>
                    </div>
                </div>

                {showUploadForm && (
                     <form onSubmit={handleUpload} className="p-4 mb-6 bg-muted/50 rounded-lg animate-fade-in-up-fast space-y-4">
                        <h4 className="text-md font-semibold">Unggah Dokumen Baru</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">File</label>
                                <input 
                                    type="file" 
                                    onChange={(e) => setNewFileData(p => ({...p, file: e.target.files?.[0] || null}))}
                                    className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Kategori</label>
                                 <select 
                                    value={newFileData.category} 
                                    onChange={(e) => setNewFileData(p => ({...p, category: e.target.value}))}
                                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary"
                                >
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                             <button type="button" onClick={() => setShowUploadForm(false)} className="px-4 py-2 text-sm bg-background border rounded-md">Batal</button>
                             <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">Simpan Dokumen</button>
                        </div>
                    </form>
                )}
                
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="text-left text-muted-foreground font-semibold">
                                <th className="p-3">Nama File</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3 hidden md:table-cell">Ukuran</th>
                                <th className="p-3 hidden sm:table-cell">Tanggal Unggah</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file) => (
                                <tr key={file.id} className="border-t">
                                    <td className="p-3 font-medium text-card-foreground flex items-center gap-3">
                                        <File size={18} className="text-primary"/>
                                        {file.name}
                                    </td>
                                    <td className="p-3"><CategoryBadge category={file.category} /></td>
                                    <td className="p-3 text-muted-foreground hidden md:table-cell">{file.size}</td>
                                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{file.date}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button className="p-1.5 text-muted-foreground hover:text-primary rounded-full hover:bg-muted" title="Unduh"><Download size={16} /></button>
                                            <button onClick={() => handleDelete(file.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted" title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredFiles.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            <p>Tidak ada dokumen dalam kategori ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProjectDetail = ({ projects, setProjects }: ProjectDetailProps) => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const project = projects.find(p => p.id === projectId);
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'detail' | 'kurva-s' | 'laporan' | 'dokumen'>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
                <h2 className="text-2xl font-bold text-foreground">Proyek Tidak Ditemukan</h2>
                <p className="text-muted-foreground mt-2">Proyek yang Anda cari tidak ada atau telah dihapus.</p>
                <button onClick={() => navigate('/project/daftar')} className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition shadow">
                    <ArrowLeft size={16} />
                    Kembali ke Daftar Proyek
                </button>
            </div>
        );
    }
    
    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <SingleProjectDashboard project={project} />;
            case 'detail':
                return <DetailView project={project} />;
            case 'kurva-s':
                return <KurvaS />;
            case 'laporan':
                 return <ProjectReport project={project} setProjects={setProjects} />;
            case 'dokumen':
                return <DokumenView />;
            default:
                return null;
        }
    }

    return (
        <div className="bg-background min-h-screen font-sans">
            <ProjectDetailSidebar 
                project={project} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <div className="lg:ml-64 flex flex-col h-screen">
                <ProjectDetailHeader project={project} onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/30">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default ProjectDetail;