import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar', () => {
  it('should render navbar with logo and title', () => {
    render(<Navbar />);

    expect(screen.getByText('Radical Portfolio Copilot')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('should render help button', () => {
    render(<Navbar />);

    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('should render settings button', () => {
    render(<Navbar />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
