import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioList from './PortfolioList';
import { Company } from '@/types/company';

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Test Company 1',
    description: 'Test description 1',
    categories: ['AI', 'Enterprise'],
    year: '2023',
    stage: 'Series A',
    teamSize: 50,
    location: 'San Francisco, CA',
    website: 'https://test1.com',
  },
  {
    id: '2',
    name: 'Test Company 2',
    description: 'Test description 2',
    categories: ['Healthcare'],
    year: '2022',
    stage: 'Seed',
    teamSize: 20,
    location: 'New York, NY',
    website: 'https://test2.com',
  },
];

describe('PortfolioList', () => {
  it('should render company list', () => {
    const onSelectCompany = vi.fn();
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={null}
        onSelectCompany={onSelectCompany}
      />
    );

    expect(screen.getByText('Portfolio Companies')).toBeInTheDocument();
    expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    expect(screen.getByText('Test Company 2')).toBeInTheDocument();
  });

  it('should display company descriptions', () => {
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={null}
        onSelectCompany={vi.fn()}
      />
    );

    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('should display company categories', () => {
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={null}
        onSelectCompany={vi.fn()}
      />
    );

    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('should display company year', () => {
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={null}
        onSelectCompany={vi.fn()}
      />
    );

    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
  });

  it('should call onSelectCompany when company is clicked', async () => {
    const user = userEvent.setup();
    const onSelectCompany = vi.fn();
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={null}
        onSelectCompany={onSelectCompany}
      />
    );

    // Find the company name and click on its parent card
    const companyName = screen.getByText('Test Company 1');
    const companyCard = companyName.closest('div[class*="company-card"]');
    
    if (companyCard) {
      await user.click(companyCard);
      expect(onSelectCompany).toHaveBeenCalledWith(mockCompanies[0]);
    } else {
      // Fallback: click on the company name itself
      await user.click(companyName);
      expect(onSelectCompany).toHaveBeenCalled();
    }
  });

  it('should highlight selected company', () => {
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={mockCompanies[0]}
        onSelectCompany={vi.fn()}
      />
    );

    const selectedCard = screen.getByText('Test Company 1').closest('div[class*="company-card"]');
    expect(selectedCard).toHaveClass('border-accent');
  });

  it('should not highlight unselected company', () => {
    render(
      <PortfolioList
        companies={mockCompanies}
        selectedCompany={mockCompanies[0]}
        onSelectCompany={vi.fn()}
      />
    );

    const unselectedCard = screen.getByText('Test Company 2').closest('div[class*="company-card"]');
    // The unselected card should not have border-accent class
    expect(unselectedCard).toBeInTheDocument();
    if (unselectedCard) {
      const hasBorderAccent = unselectedCard.className.includes('border-accent');
      expect(hasBorderAccent).toBe(false);
    }
  });

  it('should handle empty company list', () => {
    render(
      <PortfolioList
        companies={[]}
        selectedCompany={null}
        onSelectCompany={vi.fn()}
      />
    );

    expect(screen.getByText('Portfolio Companies')).toBeInTheDocument();
    expect(screen.queryByText('Test Company 1')).not.toBeInTheDocument();
  });
});

