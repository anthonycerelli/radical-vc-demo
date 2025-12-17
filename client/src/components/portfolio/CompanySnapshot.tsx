import { Company } from "@/types/company";
import { ExternalLink, Globe, Users, TrendingUp } from "lucide-react";

interface CompanySnapshotProps {
  company: Company | null;
}

const CompanySnapshot = ({ company }: CompanySnapshotProps) => {
  if (!company) {
    return (
      <div className="radical-card p-5">
        <h3 className="section-label mb-4">Company Snapshot</h3>
        <div className="text-[#9AA3B5] text-sm text-center py-8">
          Select a company to view details
        </div>
      </div>
    );
  }

  return (
    <div className="radical-card p-5">
      <h3 className="section-label mb-4">Company Snapshot</h3>
      
      <div className="space-y-4">
        {/* Company Header */}
        <div>
          <h2 className="text-navy font-semibold text-xl mb-1">{company.name}</h2>
          <p className="text-muted-foreground text-sm">{company.description}</p>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-subtle rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-medium">Stage</span>
            </div>
            <p className="text-navy font-medium text-sm">{company.stage}</p>
          </div>
          
          <div className="bg-subtle rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-medium">Team</span>
            </div>
            <p className="text-navy font-medium text-sm">{company.teamSize} people</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Investment Year</span>
            <span className="text-sm text-navy font-medium">{company.year}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Categories</span>
            <div className="flex gap-1">
              {company.categories.map((cat) => (
                <span key={cat} className="category-pill">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Location</span>
            <span className="text-sm text-navy font-medium">{company.location}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border">
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-navy hover:text-navy-hover transition-colors duration-150"
          >
            <Globe className="w-4 h-4" />
            <span>Visit Website</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default CompanySnapshot;
