import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsCharts from './AnalyticsCharts';

describe('AnalyticsCharts', () => {
  it('should render analytics charts', () => {
    render(<AnalyticsCharts />);

    expect(screen.getByText('Companies by Category')).toBeInTheDocument();
    expect(screen.getByText('Investments by Year')).toBeInTheDocument();
  });

  it('should render category chart', () => {
    render(<AnalyticsCharts />);

    const categoryChart = screen.getByText('Companies by Category').closest('.radical-card');
    expect(categoryChart).toBeInTheDocument();
  });

  it('should render year chart', () => {
    render(<AnalyticsCharts />);

    const yearChart = screen.getByText('Investments by Year').closest('.radical-card');
    expect(yearChart).toBeInTheDocument();
  });
});

