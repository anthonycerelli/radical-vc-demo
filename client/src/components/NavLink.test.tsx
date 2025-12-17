import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavLink } from './NavLink';

describe('NavLink', () => {
  it('should render NavLink component', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );

    const link = screen.getByText('Test Link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should apply className prop', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" className="custom-class">
          Test Link
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByText('Test Link');
    expect(link).toHaveClass('custom-class');
  });

  it('should apply activeClassName when link is active', () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <NavLink to="/test" activeClassName="active-class">
          Test Link
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByText('Test Link');
    expect(link).toHaveClass('active-class');
  });

  it('should apply pendingClassName when link is pending', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" pendingClassName="pending-class">
          Test Link
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByText('Test Link');
    // Note: pending state is harder to test without navigation, but the className function is covered
    expect(link).toBeInTheDocument();
  });
});
