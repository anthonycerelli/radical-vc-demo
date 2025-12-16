import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import FiltersPanel from "@/components/filters/FiltersPanel";
import PortfolioList from "@/components/portfolio/PortfolioList";
import CompanySnapshot from "@/components/portfolio/CompanySnapshot";
import CopilotChat from "@/components/copilot/CopilotChat";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import { mockCompanies } from "@/data/mockCompanies";
import { Company } from "@/types/company";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          company.name.toLowerCase().includes(query) ||
          company.description.toLowerCase().includes(query) ||
          company.categories.some((cat) => cat.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const hasCategory = company.categories.some((cat) =>
          selectedCategories.includes(cat)
        );
        if (!hasCategory) return false;
      }

      // Year filter
      if (selectedYear !== "All Years" && company.year !== selectedYear) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategories, selectedYear]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Filters */}
        <FiltersPanel
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Center: Portfolio List with Analytics */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-border">
          <div className="p-5">
            {/* Page Header */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-navy mb-1">Portfolio Insights</h1>
              <p className="text-muted-foreground text-sm">
                AI-native internal tool for portfolio analysis and insights
              </p>
            </div>

            {/* Analytics Charts */}
            <AnalyticsCharts />
          </div>

          {/* Portfolio List */}
          <PortfolioList
            companies={filteredCompanies}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />
        </main>

        {/* Right: Snapshot + Copilot */}
        <aside className="w-full lg:w-96 p-5 space-y-4 bg-subtle">
          <CompanySnapshot company={selectedCompany} />
          <CopilotChat company={selectedCompany} />
        </aside>
      </div>
    </div>
  );
};

export default Index;
