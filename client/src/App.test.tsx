import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('App', () => {
  it('should render app with router', () => {
    render(<App />);

    // App should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('should render main route', async () => {
    render(<App />);

    // Wait for lazy-loaded component
    await screen.findByText(/Portfolio Insights/i, {}, { timeout: 3000 });
    expect(screen.getByText(/Portfolio Insights/i)).toBeInTheDocument();
  });
});

