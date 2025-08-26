import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeOption = ({ label, icon, isSelected, onClick }: { label: string, icon: React.ReactElement<React.SVGAttributes<SVGSVGElement> & { size?: string | number }>, isSelected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
            isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
        }`}
        aria-pressed={isSelected}
    >
        {React.cloneElement(icon, { size: 24, className: "text-foreground" })}
        <span className="font-medium text-foreground">{label}</span>
    </button>
);

const SettingsPage = () => {
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="bg-card p-8 rounded-xl shadow-md border">
                <h1 className="text-3xl font-bold text-foreground mb-6">Pengaturan</h1>
                
                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-2">Tampilan</h2>
                    <p className="text-muted-foreground mb-6">Pilih tema tampilan aplikasi.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ThemeOption
                            label="Terang"
                            icon={<Sun />}
                            isSelected={theme === 'light'}
                            onClick={() => setTheme('light')}
                        />
                        <ThemeOption
                            label="Gelap"
                            icon={<Moon />}
                            isSelected={theme === 'dark'}
                            onClick={() => setTheme('dark')}
                        />
                        <ThemeOption
                            label="Sistem"
                            icon={<Monitor />}
                            isSelected={theme === 'system'}
                            onClick={() => setTheme('system')}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;