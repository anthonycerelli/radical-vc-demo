import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopilotChat from './CopilotChat';
import { Company } from '@/types/company';
import * as api from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  sendChatMessage: vi.fn(),
}));

const mockCompany: Company = {
  id: '1',
  name: 'Test Company',
  slug: 'test-company',
  description: 'Test description',
  categories: ['AI'],
  primaryCategory: 'AI',
  year: '2023',
  stage: 'Series A',
  teamSize: 50,
  location: 'San Francisco',
  website: 'https://test.com',
};

describe('CopilotChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mocks before each test
    vi.mocked(api.sendChatMessage).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render initial assistant message', () => {
    render(<CopilotChat company={null} />);

    expect(screen.getAllByText(/Portfolio Copilot/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Hello! I'm your Portfolio Copilot/i)).toBeInTheDocument();
  });

  it('should render input field', () => {
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText('Ask about portfolio companies...');
    expect(input).toBeInTheDocument();
  });

  it('should send message when button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    const sendButton = screen.getByRole('button');

    await user.type(input, 'test message');
    await user.click(sendButton);

    expect(screen.getByText('test message')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('should send message when Enter is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'test message{Enter}');

    expect(screen.getByText('test message')).toBeInTheDocument();
  });

  it('should not send empty message', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, '   ');

    // Button should still be disabled for whitespace-only input
    expect(sendButton).toBeDisabled();
  });

  it('should add context message when company is selected', async () => {
    vi.useRealTimers();
    const { rerender } = render(<CopilotChat company={null} />);

    rerender(<CopilotChat company={mockCompany} />);

    // Wait for context message to appear
    await waitFor(
      () => {
        const contextMessage = screen.queryByText(/I see you've selected/i);
        expect(contextMessage).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  });

  it('should generate response after sending message', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer: 'I can help you explore the portfolio and answer questions about our investments.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'test message');
    await user.keyboard('{Enter}');

    // Wait for user message to appear
    await waitFor(
      () => {
        expect(screen.getByText('test message')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Wait for assistant response
    await waitFor(
      () => {
        const assistantMessages = screen.getAllByText(/I can help you explore/i);
        expect(assistantMessages.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);

  it('should handle portfolio-related queries', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer:
        'The Radical portfolio spans multiple sectors including AI, healthcare, and enterprise software.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'tell me about portfolio');
    await user.keyboard('{Enter}');

    // Wait for user message
    await waitFor(
      () => {
        expect(screen.getByText('tell me about portfolio')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Wait for assistant response with portfolio-specific content
    await waitFor(
      () => {
        const portfolioResponse = screen.getByText(/The Radical portfolio spans/i);
        expect(portfolioResponse).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);

  it('should handle competitor queries with company selected', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer:
        'Test Company operates in a competitive landscape with several players in the AI space.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={mockCompany} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'who are the competitors');
    await user.keyboard('{Enter}');

    await waitFor(
      () => {
        expect(screen.getByText('who are the competitors')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        const response = screen.getByText(/operates in a competitive landscape/i);
        expect(response).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);

  it('should handle metric/performance queries with company selected', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer:
        'Test Company has shown a strong growth trajectory with increasing revenue and user adoption.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={mockCompany} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'what are the metrics');
    await user.keyboard('{Enter}');

    await waitFor(
      () => {
        expect(screen.getByText('what are the metrics')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        const response = screen.getByText(/strong growth trajectory/i);
        expect(response).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);

  it('should handle team/founder queries with company selected', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer:
        'Test Company has a team of 50 people based in San Francisco, led by experienced founders in the AI space.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={mockCompany} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'tell me about the team');
    await user.keyboard('{Enter}');

    await waitFor(
      () => {
        expect(screen.getByText('tell me about the team')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        const response = screen.getByText(/team of 50 people/i);
        expect(response).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);

  it('should handle trend/insight queries', async () => {
    vi.useRealTimers();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      answer:
        'Key trends across the portfolio include AI infrastructure, healthcare innovation, and enterprise automation.',
      sources: [],
    });

    const user = userEvent.setup({ delay: null });
    render(<CopilotChat company={null} />);

    const input = screen.getByPlaceholderText(
      'Ask about portfolio companies...'
    ) as HTMLTextAreaElement;
    await user.type(input, 'what are the trends');
    await user.keyboard('{Enter}');

    await waitFor(
      () => {
        expect(screen.getByText('what are the trends')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        const response = screen.getByText(/Key trends across the portfolio/i);
        expect(response).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    vi.useFakeTimers();
  }, 10000);
});
