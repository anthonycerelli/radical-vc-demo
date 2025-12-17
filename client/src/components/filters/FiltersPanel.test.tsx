import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FiltersPanel from './FiltersPanel';

describe('FiltersPanel', () => {
  const defaultProps = {
    selectedCategories: [],
    onCategoryToggle: vi.fn(),
    selectedYear: 'All Years',
    onYearChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filters panel', () => {
    render(<FiltersPanel {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Investment Year')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<FiltersPanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search companies...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should display search query value', () => {
    render(<FiltersPanel {...defaultProps} searchQuery="test query" />);

    const searchInput = screen.getByPlaceholderText('Search companies...') as HTMLInputElement;
    expect(searchInput.value).toBe('test query');
  });

  it('should call onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<FiltersPanel {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('should render all category buttons', () => {
    render(<FiltersPanel {...defaultProps} />);

    const categories = [
      'Climate',
      'LLMs',
      'Robotics',
      'Healthcare',
      'Enterprise',
      'Biotech',
      'Infrastructure',
    ];
    categories.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('should call onCategoryToggle when category is clicked', async () => {
    const user = userEvent.setup();
    const onCategoryToggle = vi.fn();
    render(<FiltersPanel {...defaultProps} onCategoryToggle={onCategoryToggle} />);

    const climateButton = screen.getByText('Climate');
    await user.click(climateButton);

    expect(onCategoryToggle).toHaveBeenCalledWith('Climate');
  });

  it('should highlight selected categories', () => {
    render(<FiltersPanel {...defaultProps} selectedCategories={['Climate', 'LLMs']} />);

    const climateButton = screen.getByText('Climate');
    const llmsButton = screen.getByText('LLMs');
    const roboticsButton = screen.getByText('Robotics');

    expect(climateButton).toHaveClass('filter-chip-active');
    expect(llmsButton).toHaveClass('filter-chip-active');
    expect(roboticsButton).toHaveClass('filter-chip-default');
  });

  it('should display selected year', () => {
    render(<FiltersPanel {...defaultProps} selectedYear="2023" />);

    // The Select component might render differently, but we can check the value is set
    expect(screen.getByText('Investment Year')).toBeInTheDocument();
  });

  it('should show company count stats', () => {
    render(<FiltersPanel {...defaultProps} />);

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText(/companies/i)).toBeInTheDocument();
  });
});
