import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Loader2, Building2 } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            const success = login(email, password);
            if (success) {
                toast.success('Login berhasil!');
                navigate(from, { replace: true });
            } else {
                toast.error('User Name atau Kata Sandi salah.');
                setIsLoading(false);
            }
        }, 500);
    };
    
    const ModernIllustration = () => (
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg drop-shadow-2xl text-primary">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: 'rgba(255,255,255,0.2)', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor: 'rgba(255,255,255,0)', stopOpacity:1}} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="400" r="150" fill="url(#grad1)" />
        <path d="M 512 0 L 350 0 L 450 512 L 512 512 Z" fill="rgba(255,255,255,0.05)" />
        <rect x="50" y="100" width="412" height="280" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <rect x="75" y="125" width="150" height="30" rx="8" fill="rgba(255,255,255,0.3)" />
        <rect x="75" y="175" width="362" height="15" rx="7.5" fill="rgba(255,255,255,0.2)" />
        <rect x="75" y="205" width="362" height="15" rx="7.5" fill="rgba(255,255,255,0.2)" />
        <path d="M 90 340 L 140 280 L 190 310 L 240 250 L 290 290 L 340 240" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <circle cx="240" cy="250" r="5" fill="currentColor" filter="url(#glow)" />
        <circle cx="340" cy="240" r="5" fill="currentColor" filter="url(#glow)" />
        <g transform="rotate(10 350 280)">
          <rect x="320" y="250" width="120" height="80" rx="10" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <rect x="335" y="295" width="90" height="10" rx="5" fill="currentColor" />
          <circle cx="350" cy="270" r="8" fill="rgba(255,255,255,0.5)" />
          <rect x="365" y="265" width="60" height="10" rx="5" fill="rgba(255,255,255,0.4)" />
        </g>
        <path d="M256 384 a 48 48 0 1 0 0-96 a 48 48 0 1 0 0 96z M256 352 a 16 16 0 1 1 0-32 a 16 16 0 1 1 0 32z" fill="#FFFFFF" opacity="0.15" />
        <g transform="translate(256 336) scale(1.2)">
          <path d="m 2.5 16 a 1 1 0 0 0 -2 0 h -3 a 1 1 0 0 0 0 2 h 3 a 1 1 0 0 0 2 0 v -2 z m 12.3 -11.3 a 1 1 0 0 0 -1.4 -1.4 l -2.1 2.1 a 1 1 0 1 0 1.4 1.4 z m -13.3 1.4 a 1 1 0 0 0 -1.4 1.4 l 2.1 2.1 a 1 1 0 1 0 1.4 -1.4 z m 1.4 13.3 a 1 1 0 0 0 1.4 1.4 l 2.1 -2.1 a 1 1 0 1 0 -1.4 -1.4 z m 13.3 -1.4 a 1 1 0 0 0 1.4 -1.4 l -2.1 -2.1 a 1 1 0 1 0 -1.4 1.4 z m -6.4 8.7 a 1 1 0 0 0 0 -2 h -3 a 1 1 0 0 0 0 2 z m 0 -18 a 1 1 0 0 0 0 -2 h -3 a 1 1 0 0 0 0 2 z m 3 18 a 1 1 0 0 0 2 0 v -3 a 1 1 0 0 0 -2 0 z m -2 -19 a 1 1 0 0 0 0 -2 v -3 a 1 1 0 0 0 -2 0 v 3 a 1 1 0 0 0 2 2 z" fill="#FFFFFF" opacity="0.15" />
        </g>
      </svg>
    );

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-background text-foreground font-sans grid grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col items-center justify-center p-8 lg:p-12 animate-fade-in-up">
                    <div className="w-full max-w-sm">
                        <header className="flex items-center gap-4 mb-12">
                             <Building2 className="h-10 w-10 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold text-primary">GAS Pro!</h1>
                                <p className="text-muted-foreground">Manajemen Proyek Terintegrasi</p>
                            </div>
                        </header>

                        <main>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-foreground">Selamat Datang Kembali</h2>
                                <p className="text-muted-foreground mt-1">Silakan masuk ke akun Anda.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground sr-only">Email</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                                        <input
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="User Name atau Email"
                                            required
                                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground sr-only">Password</label>
                                    <div className="relative">
                                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Kata Sandi"
                                            required
                                            className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
                                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-sm text-muted-foreground">
                                        <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-ring"/>
                                        <span className="ml-2">Ingat saya</span>
                                    </label>
                                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                        Lupa kata sandi?
                                    </Link>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Masuk'}
                                </button>
                            </form>
                        </main>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted relative overflow-hidden">
                    <div className="z-10 text-center space-y-8">
                         <ModernIllustration/>
                        <div className="max-w-md">
                            <h2 className="text-2xl font-bold leading-tight text-foreground">
                                Platform Terpadu untuk Proyek Anda
                            </h2>
                            <p className="mt-4 text-muted-foreground">
                                Perencanaan, estimasi, dan monitoring proyek konstruksi menjadi lebih efisien.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
