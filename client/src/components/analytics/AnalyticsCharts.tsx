import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchInsights } from '@/lib/api';

const categoryData = [
  { name: 'LLMs', value: 14 },
  { name: 'Climate', value: 10 },
  { name: 'Healthcare', value: 8 },
  { name: 'Enterprise', value: 7 },
  { name: 'Robotics', value: 5 },
  { name: 'Biotech', value: 4 },
];

const yearData = [
  { year: '2020', count: 5 },
  { year: '2021', count: 8 },
  { year: '2022', count: 12 },
  { year: '2023', count: 15 },
  { year: '2024', count: 8 },
];

const COLORS = {
  navy: '#003E7E',
  magenta: '#FF2C8B',
  teal: '#00A9C4',
  gray: '#9AA3B5',
  border: '#E1E4EB',
  mutedText: '#7A8497',
};

const AnalyticsCharts = () => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    refetchOnWindowFocus: false,
  });

  // Transform API data for charts
  const categoryChartData = insights?.byCategory.map((item) => ({
    name: item.category,
    value: item.count,
  })) || categoryData;

  const yearChartData = insights?.byYear.map((item) => ({
    year: item.year.toString(),
    count: item.count,
  })) || yearData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="radical-card p-4">
          <div className="h-48 animate-pulse bg-muted rounded" />
        </div>
        <div className="radical-card p-4">
          <div className="h-48 animate-pulse bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* Companies by Category */}
      <div className="radical-card p-4">
        <h3 className="section-label mb-4">Companies by Category</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical">
              <XAxis
                type="number"
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                tick={{ fill: COLORS.mutedText, fontSize: 11 }}
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
                fill={COLORS.navy}
                radius={[0, 4, 4, 0]}
                activeBar={{ fill: COLORS.magenta }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Companies by Year */}
      <div className="radical-card p-4">
        <h3 className="section-label mb-4">Investments by Year</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData}>
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
                fill={COLORS.navy}
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: COLORS.magenta }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
