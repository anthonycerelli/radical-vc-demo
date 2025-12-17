import { Settings, HelpCircle } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <span className="text-navy font-semibold text-lg tracking-tight">
          Radical Portfolio Copilot
        </span>
      </div>

      <nav className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-navy hover:text-navy-hover transition-colors duration-150 text-sm font-medium">
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
        <button className="flex items-center gap-1.5 text-navy hover:text-navy-hover transition-colors duration-150 text-sm font-medium">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
