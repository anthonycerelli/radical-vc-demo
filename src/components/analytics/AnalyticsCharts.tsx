import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const categoryData = [
  { name: "LLMs", value: 14 },
  { name: "Climate", value: 10 },
  { name: "Healthcare", value: 8 },
  { name: "Enterprise", value: 7 },
  { name: "Robotics", value: 5 },
  { name: "Biotech", value: 4 },
];

const yearData = [
  { year: "2020", count: 5 },
  { year: "2021", count: 8 },
  { year: "2022", count: 12 },
  { year: "2023", count: 15 },
  { year: "2024", count: 8 },
];

const COLORS = {
  navy: "#003E7E",
  magenta: "#FF2C8B",
  teal: "#00A9C4",
  gray: "#9AA3B5",
};

const AnalyticsCharts = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* Companies by Category */}
      <div className="radical-card p-4">
        <h3 className="section-label mb-4">Companies by Category</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#7A8497", fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#003E7E", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E1E4EB",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#003E7E", fontWeight: 600 }}
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
            <BarChart data={yearData}>
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#7A8497", fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#7A8497", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E1E4EB",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#003E7E", fontWeight: 600 }}
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
