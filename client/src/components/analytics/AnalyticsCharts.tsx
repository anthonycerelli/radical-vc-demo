import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Company } from '@/types/company';

const COLORS = {
  navy: '#003E7E',
  magenta: '#FF2C8B',
  teal: '#00A9C4',
  gray: '#9AA3B5',
  border: '#E1E4EB',
  mutedText: '#7A8497',
  selected: '#001F4D', // Darker navy for selected
};

interface AnalyticsChartsProps {
  filteredCompanies: Company[];
  allCompanies: Company[]; // Unfiltered companies for "show all categories" mode
  selectedCategories: string[];
  selectedYear: string;
  onCategoryClick: (category: string) => void;
  onYearClick: (year: string) => void;
}

/**
 * Calculate dynamic tick values for x-axis
 * Returns whole numbers that evenly divide the range
 */
/**
 * Calculate dynamic tick values for x-axis
 * Returns whole numbers that evenly divide the range
 */
function calculateTicks(maxValue: number): number[] {
  if (maxValue === 0) return [0];

  // Find a nice step size
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;

  let step: number;
  if (normalized <= 1) step = 0.5 * magnitude;
  else if (normalized <= 2) step = magnitude;
  else if (normalized <= 5) step = 2.5 * magnitude;
  else step = 5 * magnitude;

  // Round step to whole number
  step = Math.ceil(step);

  const ticks: number[] = [0];
  let current = step;
  while (current <= maxValue) {
    ticks.push(current);
    current += step;
  }

  // Ensure max value is included if not already
  if (ticks[ticks.length - 1] < maxValue) {
    ticks.push(Math.ceil(maxValue));
  }

  return ticks;
}

const AnalyticsCharts = ({
  filteredCompanies,
  allCompanies,
  selectedCategories,
  selectedYear,
  onCategoryClick,
  onYearClick,
}: AnalyticsChartsProps) => {
  // Compute category data based on filter state
  const categoryChartData = useMemo(() => {
    // If no categories are selected, show all categories from all companies
    if (selectedCategories.length === 0) {
      const categoryMap = new Map<string, number>();

      allCompanies.forEach((company) => {
        // Count all categories for each company
        company.categories?.forEach((category) => {
          if (category) {
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          }
        });
      });

      return Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }

    // If categories are selected, only show those selected categories
    // Count how many filtered companies have each selected category
    const categoryMap = new Map<string, number>();

    selectedCategories.forEach((category) => {
      const count = filteredCompanies.filter((company) =>
        company.categories?.includes(category)
      ).length;
      categoryMap.set(category, count);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCompanies, allCompanies, selectedCategories]);

  // Compute year data from filtered companies
  const yearChartData = useMemo(() => {
    const yearMap = new Map<string, number>();

    filteredCompanies.forEach((company) => {
      if (company.year) {
        const yearStr = typeof company.year === 'number' ? company.year.toString() : company.year;
        yearMap.set(yearStr, (yearMap.get(yearStr) || 0) + 1);
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [filteredCompanies]);

  // Calculate dynamic ticks for category chart
  const maxCategoryValue =
    categoryChartData.length > 0 ? Math.max(...categoryChartData.map((d) => d.value)) : 0;
  const categoryTicks = calculateTicks(maxCategoryValue);

  // Calculate dynamic ticks for year chart
  const maxYearValue =
    yearChartData.length > 0 ? Math.max(...yearChartData.map((d) => d.count)) : 0;
  const yearTicks = calculateTicks(maxYearValue);

  return (
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* Companies by Category */}
      <div className="radical-card p-4">
        <h3 className="section-label mb-4">Companies by Category</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryChartData}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 5 }}
            >
              <XAxis
                type="number"
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                tick={{ fill: COLORS.mutedText, fontSize: 11 }}
                ticks={categoryTicks}
                domain={[0, 'dataMax']}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.navy, fontSize: 11, fontWeight: 500 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: COLORS.navy, fontWeight: 600 }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(entry: { name?: string }) => {
                  if (entry?.name) {
                    onCategoryClick(entry.name);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {categoryChartData.map((entry, index) => {
                  const isSelected = selectedCategories.includes(entry.name);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isSelected ? COLORS.selected : COLORS.navy}
                      stroke={isSelected ? COLORS.magenta : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Companies by Year */}
      <div className="radical-card p-4">
        <h3 className="section-label mb-4">Investments by Year</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="year"
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                tick={{ fill: COLORS.mutedText, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.mutedText, fontSize: 11 }}
                ticks={yearTicks}
                domain={[0, 'dataMax']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: COLORS.navy, fontWeight: 600 }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                onClick={(data: unknown) => {
                  const entry = data as { year?: string };
                  if (entry?.year) {
                    onYearClick(entry.year);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {yearChartData.map((entry, index) => {
                  const isSelected = selectedYear === entry.year;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isSelected ? COLORS.selected : COLORS.navy}
                      stroke={isSelected ? COLORS.magenta : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
