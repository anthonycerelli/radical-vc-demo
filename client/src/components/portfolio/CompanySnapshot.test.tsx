import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompanySnapshot from './CompanySnapshot';
import { Company } from '@/types/company';

const mockCompany: Company = {
  id: '1',
  name: 'Test Company',
  description: 'Test company description',
  categories: ['AI', 'Enterprise'],
  year: '2023',
  stage: 'Series A',
  teamSize: 50,
  location: 'San Francisco, CA',
  website: 'https://test.com',
};

describe('CompanySnapshot', () => {
  it('should render placeholder when no company is selected', () => {
    render(<CompanySnapshot company={null} />);

    expect(screen.getByText('Company Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Select a company to view details')).toBeInTheDocument();
  });

  it('should render company details when company is selected', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('Company Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Test company description')).toBeInTheDocument();
  });

  it('should display company stage', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('Series A')).toBeInTheDocument();
  });

  it('should display team size', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('50 people')).toBeInTheDocument();
  });

  it('should display investment year', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('should display company categories', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should display company location', () => {
    render(<CompanySnapshot company={mockCompany} />);

    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('should have website link', () => {
    render(<CompanySnapshot company={mockCompany} />);

    const websiteLink = screen.getByText('Visit Website').closest('a');
    expect(websiteLink).toHaveAttribute('href', 'https://test.com');
    expect(websiteLink).toHaveAttribute('target', '_blank');
    expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

