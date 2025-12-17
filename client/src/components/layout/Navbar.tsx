import { useState } from 'react';
import { Settings, HelpCircle, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Navbar = () => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultYear, setDefaultYear] = useState('All Years');

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
        {/* Help Popover */}
        <Popover open={helpOpen} onOpenChange={setHelpOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 text-navy hover:text-navy-hover transition-colors duration-150 text-sm font-medium">
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 bg-background border-border"
            align="end"
            onEscapeKeyDown={() => setHelpOpen(false)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-navy font-semibold text-base">Help</h3>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="text-muted-foreground hover:text-navy transition-colors"
                  aria-label="Close help"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <h4 className="text-navy font-medium mb-1">About This Tool</h4>
                  <p>
                    Radical Portfolio Copilot is an AI-native internal tool for portfolio analysis
                    and insights. Use it to explore companies, analyze trends, and get AI-powered
                    answers about Radical Ventures' investments.
                  </p>
                </div>
                <div>
                  <h4 className="text-navy font-medium mb-1">Filters</h4>
                  <p>
                    Use the category buttons and year dropdown to filter companies. Click chart bars
                    to filter by category or year. Multiple filters combine together.
                  </p>
                </div>
                <div>
                  <h4 className="text-navy font-medium mb-1">Charts</h4>
                  <p>
                    The charts show portfolio distribution by category and investment year. Click
                    any bar to filter the portfolio list. Charts update based on your active
                    filters.
                  </p>
                </div>
                <div>
                  <h4 className="text-navy font-medium mb-1">Portfolio Copilot</h4>
                  <p>
                    Ask questions about portfolio companies using natural language. The AI uses
                    semantic search to find relevant companies and provides answers based only on
                    the Radical Ventures portfolio.
                  </p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Settings Popover */}
        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 text-navy hover:text-navy-hover transition-colors duration-150 text-sm font-medium">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 bg-background border-border"
            align="end"
            onEscapeKeyDown={() => setSettingsOpen(false)}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-navy font-semibold text-base">Settings</h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-muted-foreground hover:text-navy transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-navy font-medium mb-2 block">Default Investment Year</label>
                  <Select value={defaultYear} onValueChange={setDefaultYear}>
                    <SelectTrigger className="w-full bg-background border-border text-navy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Years">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs mt-1">
                    This setting is for demonstration purposes only.
                  </p>
                </div>
                <div>
                  <label className="text-navy font-medium mb-2 block">Appearance</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dark-mode"
                      className="w-4 h-4 rounded border-border text-navy focus:ring-navy"
                      disabled
                    />
                    <label htmlFor="dark-mode" className="text-muted-foreground cursor-not-allowed">
                      Dark mode (coming soon)
                    </label>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    This is a demo settings panel. Settings are not persisted.
                  </p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </header>
  );
};

export default Navbar;
