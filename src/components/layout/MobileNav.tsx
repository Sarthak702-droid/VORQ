import React from 'react';
import { LayoutDashboard, HardHat, FolderKanban, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView, onOpenMenu }) => {
  const { offlineDraftsCount } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-vorq-border flex items-center justify-around h-16 px-2 shadow-lg">
      <button
        onClick={() => setActiveView('owner_dashboard')}
        className={`flex flex-col items-center justify-center w-16 h-full text-[11px] font-medium transition ${
          activeView === 'owner_dashboard' ? 'text-vorq-primary font-bold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setActiveView('site_today')}
        className={`relative flex flex-col items-center justify-center w-16 h-full text-[11px] font-medium transition ${
          activeView === 'site_today' ? 'text-vorq-primary font-bold' : 'text-slate-500'
        }`}
      >
        <HardHat className="w-5 h-5 mb-0.5" />
        <span>Today</span>
        {offlineDraftsCount > 0 && (
          <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-amber-500" />
        )}
      </button>

      <button
        onClick={() => setActiveView('projects')}
        className={`flex flex-col items-center justify-center w-16 h-full text-[11px] font-medium transition ${
          activeView === 'projects' ? 'text-vorq-primary font-bold' : 'text-slate-500'
        }`}
      >
        <FolderKanban className="w-5 h-5 mb-0.5" />
        <span>Projects</span>
      </button>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-16 h-full text-[11px] font-medium text-slate-500 hover:text-vorq-ink"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
};
