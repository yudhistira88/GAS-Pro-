import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('admin@proyekku.com');
    const [password, setPassword] = useState('12345');
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

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-white font-sans grid grid-cols-1 lg:grid-cols-2">
                {/* Left Panel - Form */}
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-sm">
                        <header className="w-full">
                            <h1 className="text-3xl font-bold text-honda-red">GAS Pro!</h1>
                        </header>

                        <main className="mt-20">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Masuk</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="User Name atau Email"
                                        required
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-honda-red"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Kata Sandi"
                                        required
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-honda-red"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'MEMPROSES...' : 'MASUK'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                Lupa kata sandi? <a href="#" className="font-semibold text-honda-red hover:underline">Klik disini</a>
                            </p>
                        </main>
                    </div>
                </div>

                {/* Right Panel - Image and Text */}
                <div className="hidden lg:flex flex-col items-center justify-center p-12 text-white bg-honda-red relative overflow-hidden">
                     {/* Abstract background circles */}
                     <div className="absolute -top-20 -left-40 w-96 h-96 bg-white/10 rounded-full animate-pulse-slow"></div>
                     <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-white/10 rounded-full"></div>
                     <div className="absolute top-1/2 -right-40 w-96 h-96 bg-white/5 rounded-full animate-pulse-slow delay-500"></div>

                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-10 text-center z-10 w-full max-w-lg shadow-2xl">
                        <h2 className="text-4xl font-bold leading-tight drop-shadow-lg">
                            Make it easier to make RAB and Project Monitoring
                        </h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
