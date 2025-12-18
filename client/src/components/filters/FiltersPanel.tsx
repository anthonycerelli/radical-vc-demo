import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const years = ['2024', '2023', '2022', '2021', '2020', '2019', 'All Years'];

interface FiltersPanelProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  availableCategories: string[];
}

const FiltersPanel = ({
  selectedCategories,
  onCategoryToggle,
  selectedYear,
  onYearChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
  filteredCount,
  totalCount,
  availableCategories,
}: FiltersPanelProps) => {
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedYear !== 'All Years' || searchQuery.length > 0;
  return (
    <aside className="w-64 bg-background border-r border-border p-5 flex flex-col gap-6">
      <div>
        <h2 className="section-label mb-4">Filters</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background border-border focus:border-accent focus:ring-accent transition-colors duration-150"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="section-label mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {availableCategories.length > 0 ? (
            availableCategories.map((category) => {
              const isActive = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => onCategoryToggle(category)}
                  className={isActive ? 'filter-chip-active' : 'filter-chip-default'}
                >
                  {category}
                </button>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground">No categories available</p>
          )}
        </div>
      </div>

      {/* Year Filter */}
      <div>
        <h3 className="section-label mb-3">Investment Year</h3>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-full bg-background border-border text-navy focus:border-accent focus:ring-accent transition-colors duration-150">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {years.map((year) => (
              <SelectItem key={year} value={year} className="text-navy hover:bg-secondary">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div>
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="w-full border-border text-navy hover:bg-subtle hover:text-navy transition-colors duration-150"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-navy">{filteredCount}</span> of{' '}
          <span className="font-semibold text-navy">{totalCount}</span> companies
        </p>
      </div>
    </aside>
  );
};

export default FiltersPanel;
