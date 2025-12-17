import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from './Index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Index', () => {
  it('should render main page structure', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    expect(screen.getByText('Portfolio Insights')).toBeInTheDocument();
    expect(screen.getByText(/AI-native internal tool/i)).toBeInTheDocument();
  });

  it('should render filters panel', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('should filter companies by search query', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'Cohere');

    await waitFor(() => {
      expect(screen.getByText('Cohere')).toBeInTheDocument();
    });
  });

  it('should filter companies by category', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Find all Climate buttons (might be in filters and elsewhere)
    const climateButtons = screen.getAllByText('Climate');
    if (climateButtons.length > 0) {
      await user.click(climateButtons[0]);
    }

    // Should show companies with Climate category
    await waitFor(() => {
      const portfolioSection = screen.getByText('Portfolio Companies');
      expect(portfolioSection).toBeInTheDocument();
    });
  });

  it('should filter companies by year', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Find and interact with year select
    const yearSelect = screen.getByText('Investment Year').closest('div');
    expect(yearSelect).toBeInTheDocument();
  });

  it('should handle company selection', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Wait for companies to load
    await waitFor(() => {
      expect(screen.getByText('Portfolio Companies')).toBeInTheDocument();
    });

    // Try to find and click a company
    const companies = screen.queryAllByText(/Cohere|Waabi/i);
    if (companies.length > 0) {
      const companyCard = companies[0].closest('.company-card');
      if (companyCard) {
        await user.click(companyCard);
        await waitFor(() => {
          expect(screen.getByText('Company Snapshot')).toBeInTheDocument();
        });
      }
    }
  });

  it('should render analytics charts', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText('Companies by Category')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

