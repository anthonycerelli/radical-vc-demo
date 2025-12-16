import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "Climate",
  "LLMs",
  "Robotics",
  "Healthcare",
  "Enterprise",
  "Biotech",
  "Infrastructure",
];

const years = ["2024", "2023", "2022", "2021", "2020", "2019", "All Years"];

interface FiltersPanelProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FiltersPanel = ({
  selectedCategories,
  onCategoryToggle,
  selectedYear,
  onYearChange,
  searchQuery,
  onSearchChange,
}: FiltersPanelProps) => {
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
            className="pl-9 bg-background border-border focus:border-magenta focus:ring-magenta"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="section-label mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => onCategoryToggle(category)}
                className={isActive ? "filter-chip-active" : "filter-chip-default"}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Year Filter */}
      <div>
        <h3 className="section-label mb-3">Investment Year</h3>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-full bg-background border-border text-navy">
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

      {/* Quick Stats */}
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-navy">12</span> of{" "}
          <span className="font-semibold text-navy">48</span> companies
        </p>
      </div>
    </aside>
  );
};

export default FiltersPanel;
