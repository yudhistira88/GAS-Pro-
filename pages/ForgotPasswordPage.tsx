import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

// Using the same illustration from LoginPage for consistency
const ModernIllustration = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg drop-shadow-2xl">
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
    <circle cx="240" cy="250" r="5" fill="#E4002B" filter="url(#glow)" />
    <circle cx="340" cy="240" r="5" fill="#E4002B" filter="url(#glow)" />
    <g transform="rotate(10 350 280)">
      <rect x="320" y="250" width="120" height="80" rx="10" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <rect x="335" y="295" width="90" height="10" rx="5" fill="#E4002B" />
      <circle cx="350" cy="270" r="8" fill="rgba(255,255,255,0.5)" />
      <rect x="365" y="265" width="60" height="10" rx="5" fill="rgba(255,255,255,0.4)" />
    </g>
    <path d="M256 384 a 48 48 0 1 0 0-96 a 48 48 0 1 0 0 96z M256 352 a 16 16 0 1 1 0-32 a 16 16 0 1 1 0 32z" fill="#FFFFFF" opacity="0.15" />
    <g transform="translate(256 336) scale(1.2)">
      <path d="m 2.5 16 a 1 1 0 0 0 -2 0 h -3 a 1 1 0 0 0 0 2 h 3 a 1 1 0 0 0 2 0 v -2 z m 12.3 -11.3 a 1 1 0 0 0 -1.4 -1.4 l -2.1 2.1 a 1 1 0 1 0 1.4 1.4 z m -13.3 1.4 a 1 1 0 0 0 -1.4 1.4 l 2.1 2.1 a 1 1 0 1 0 1.4 -1.4 z m 1.4 13.3 a 1 1 0 0 0 1.4 1.4 l 2.1 -2.1 a 1 1 0 1 0 -1.4 -1.4 z m 13.3 -1.4 a 1 1 0 0 0 1.4 -1.4 l -2.1 -2.1 a 1 1 0 1 0 -1.4 1.4 z m -6.4 8.7 a 1 1 0 0 0 0 -2 h -3 a 1 1 0 0 0 0 2 z m 0 -18 a 1 1 0 0 0 0 -2 h -3 a 1 1 0 0 0 0 2 z m 3 18 a 1 1 0 0 0 2 0 v -3 a 1 1 0 0 0 -2 0 z m -2 -19 a 1 1 0 0 0 0 -2 v -3 a 1 1 0 0 0 -2 0 v 3 a 1 1 0 0 0 2 2 z" fill="#FFFFFF" opacity="0.15" />
    </g>
  </svg>
);

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Silakan masukkan alamat email Anda.');
            return;
        }
        // Simulate API call
        console.log('Password reset requested for:', email);
        setIsSubmitted(true);
    };

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-gray-50 font-sans grid grid-cols-1 lg:grid-cols-2">
                {/* Left Panel */}
                <div className="flex flex-col items-center justify-center p-8 lg:p-12 animate-fade-in-up">
                    <div className="w-full max-w-md">
                        <header className="text-center lg:text-left mb-12">
                            <h1 className="text-4xl font-bold text-honda-red">GAS Pro!</h1>
                            <p className="text-gray-500 mt-2">Manajemen BQ, RAB dan Proyek Terintegrasi</p>
                        </header>

                        <main>
                            {!isSubmitted ? (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-gray-800">Lupa Kata Sandi?</h2>
                                        <p className="text-gray-500 mt-1">Jangan khawatir. Masukkan email Anda di bawah ini untuk mengatur ulang kata sandi.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email terdaftar"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-honda-red/50 focus:border-honda-red transition-shadow"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-honda-red text-white font-bold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-honda-red transition-all duration-300 shadow-lg hover:shadow-honda-red/40"
                                        >
                                            <Send size={18} /> KIRIM TAUTAN RESET
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                                    <CheckCircle size={48} className="mx-auto text-green-500" />
                                    <h2 className="text-2xl font-bold text-gray-800 mt-4">Periksa Email Anda</h2>
                                    <p className="text-gray-600 mt-2">
                                        Jika akun untuk <strong>{email}</strong> ada di sistem kami, kami telah mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 text-center">
                                <Link to="/login" className="text-sm font-semibold text-honda-red hover:underline flex items-center justify-center gap-2">
                                    <ArrowLeft size={16} /> Kembali ke Halaman Login
                                </Link>
                            </div>
                        </main>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="hidden lg:flex flex-col items-center justify-center p-12 text-white bg-honda-red relative overflow-hidden">
                     <div className="absolute -top-20 -left-40 w-96 h-96 bg-white/10 rounded-full animate-pulse-slow"></div>
                     <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-white/10 rounded-full"></div>
                     
                    <div className="z-10 text-center space-y-8">
                         <ModernIllustration />
                        <div className="max-w-md">
                            <h2 className="text-3xl font-bold leading-tight drop-shadow-lg">
                                Pulihkan Akses Anda dengan Mudah.
                            </h2>
                            <p className="mt-4 text-white/80 drop-shadow">
                                Keamanan akun Anda adalah prioritas kami. Ikuti langkah-langkah untuk mendapatkan kembali akses ke proyek Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;