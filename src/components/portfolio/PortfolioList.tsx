import { Company } from "@/types/company";

interface PortfolioListProps {
  companies: Company[];
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
}

const PortfolioList = ({
  companies,
  selectedCompany,
  onSelectCompany,
}: PortfolioListProps) => {
  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="mb-4">
        <h2 className="section-label">Portfolio Companies</h2>
      </div>
      
      <div className="grid gap-3">
        {companies.map((company) => {
          const isSelected = selectedCompany?.id === company.id;
          return (
            <div
              key={company.id}
              onClick={() => onSelectCompany(company)}
              className={`company-card ${
                isSelected ? "border-navy bg-secondary/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-navy font-semibold text-base mb-1 truncate">
                    {company.name}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {company.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.categories.map((cat) => (
                      <span key={cat} className="category-pill">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {company.year}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioList;
