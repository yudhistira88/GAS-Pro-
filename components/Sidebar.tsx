import React, { useContext } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Shield, X, Building2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const NavLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const location = ReactRouterDOM.useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <ReactRouterDOM.NavLink
      to={to}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span className="ml-3">{children}</span>
    </ReactRouterDOM.NavLink>
  );
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SidebarContent = () => {
    const { currentUser } = useContext(AuthContext);

    return (
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="ml-3 text-lg font-bold text-foreground">GAS Pro!</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
                <NavLink to="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
                Dashboard
                </NavLink>
                {currentUser && !['OBM', 'Purchasing'].includes(currentUser.role) && (
                <NavLink to="/bq" icon={<FileText className="h-5 w-5" />}>
                    BQ
                </NavLink>
                )}
                {currentUser && !['OBM', 'Purchasing'].includes(currentUser.role) && (
                <NavLink to="/rab" icon={<FileText className="h-5 w-5" />}>
                    RAB
                </NavLink>
                )}
                <NavLink to="/project" icon={<Briefcase className="h-5 w-5" />}>
                Project
                </NavLink>
            </nav>
            <div className="mt-auto p-4 border-t border-border text-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} GAS Pro! Inc.</p>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-card text-card-foreground z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-card text-card-foreground border-r border-border">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;