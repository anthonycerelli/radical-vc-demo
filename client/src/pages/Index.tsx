import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import FiltersPanel from '@/components/filters/FiltersPanel';
import PortfolioList from '@/components/portfolio/PortfolioList';
import CompanySnapshot from '@/components/portfolio/CompanySnapshot';
import CopilotChat from '@/components/copilot/CopilotChat';
import { fetchCompanies } from '@/lib/api';
import { transformApiCompany } from '@/lib/transformers';
import { Company } from '@/types/company';

// Lazy load AnalyticsCharts since it includes recharts (large dependency)
const AnalyticsCharts = lazy(() => import('@/components/analytics/AnalyticsCharts'));

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Fetch companies from API
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ['companies', searchQuery, selectedCategories, selectedYear],
    queryFn: () =>
      fetchCompanies({
        q: searchQuery || undefined,
        category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        year: selectedYear !== 'All Years' ? selectedYear : undefined,
        limit: 100, // Fetch all companies
      }),
    refetchOnWindowFocus: false,
  });

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Transform API companies to frontend format
  const companies = useMemo(() => {
    if (!companiesData?.companies) return [];
    return companiesData.companies.map(transformApiCompany);
  }, [companiesData]);

  // Client-side filtering (as backup, though API handles most of it)
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Search filter (additional client-side filtering)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          company.name.toLowerCase().includes(query) ||
          (company.description?.toLowerCase().includes(query) ?? false) ||
          company.categories.some((cat) => cat.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter (additional client-side filtering)
      if (selectedCategories.length > 0) {
        const hasCategory = company.categories.some((cat) => selectedCategories.includes(cat));
        if (!hasCategory) return false;
      }

      // Year filter
      if (selectedYear !== 'All Years') {
        const yearStr = typeof company.year === 'number' ? company.year.toString() : company.year;
        if (yearStr !== selectedYear) {
          return false;
        }
      }

      return true;
    });
  }, [companies, searchQuery, selectedCategories, selectedYear]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-navy mb-2">Error loading companies</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to fetch companies'}
          </p>
        </div>
      </div>
    );
  }

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
            <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
              <AnalyticsCharts />
            </Suspense>
          </div>

          {/* Portfolio List */}
          {isLoading ? (
            <div className="flex-1 p-5 flex items-center justify-center">
              <div className="text-muted-foreground">Loading companies...</div>
            </div>
          ) : (
            <PortfolioList
              companies={filteredCompanies}
              selectedCompany={selectedCompany}
              onSelectCompany={setSelectedCompany}
            />
          )}
        </main>

        {/* Right: Snapshot + Copilot - subtle background */}
        <aside className="w-full lg:w-96 p-5 space-y-4 bg-subtle">
          <CompanySnapshot company={selectedCompany} />
          <CopilotChat company={selectedCompany} />
        </aside>
      </div>
    </div>
  );
};

export default Index;
