import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Company } from '@/types/company';
import { sendChatMessage } from '@/lib/api';

/**
 * Format chat message content for better display
 * Converts markdown-like formatting to cleaner HTML
 */
function formatChatMessage(content: string): React.ReactNode {
  // Split by lines and process
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip empty lines but add spacing
    if (!trimmed) {
      if (index > 0 && index < lines.length - 1) {
        elements.push(<div key={`spacer-${index}`} className="h-2" />);
      }
      return;
    }

    // Handle bullet points (convert * to •)
    if (trimmed.startsWith('*')) {
      const text = trimmed.replace(/^\*\s*/, '').trim();
      // Check if it's a nested bullet (starts with spaces or tabs)
      const isNested = line.match(/^\s+/);
      const indent = isNested ? 'ml-6' : 'ml-0';

      // Check for bold text (**text**)
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      const formattedText = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={`bold-${index}-${partIndex}`} className="font-semibold text-navy">
              {boldText}
            </strong>
          );
        }
        return part;
      });

      elements.push(
        <div key={`line-${index}`} className={`flex items-start gap-2 ${indent} my-1.5`}>
          <span className="text-navy mt-0.5 shrink-0">•</span>
          <span className="flex-1 leading-relaxed">{formattedText}</span>
        </div>
      );
    } else {
      // Regular paragraph
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      const formattedText = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={`bold-${index}-${partIndex}`} className="font-semibold text-navy">
              {boldText}
            </strong>
          );
        }
        return part;
      });

      elements.push(
        <p key={`line-${index}`} className="my-1.5 leading-relaxed">
          {formattedText}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface CopilotChatProps {
  company: Company | null;
}

const CopilotChat = ({ company }: CopilotChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your Portfolio Copilot. I can help you analyze portfolio companies, find insights, and answer questions about Radical's investments. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (company) {
      const contextMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I see you've selected **${company.name}**. ${
          company.primaryCategory
            ? `This is a company in the ${company.primaryCategory} space.`
            : 'This is one of our portfolio companies.'
        } ${company.description ? `They focus on: ${company.description.substring(0, 100)}...` : ''} What would you like to know about them?`,
      };
      setMessages((prev) => [...prev, contextMessage]);
    }
  }, [company]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: currentInput,
        selectedCompanySlug: company?.slug || null,
        topK: 5,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Failed to get response'}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="radical-card flex flex-col h-[400px]">
      <div className="p-4 border-b border-border">
        <h3 className="section-label">Portfolio Copilot</h3>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'assistant' ? 'bg-subtle text-navy' : 'bg-navy text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] ${
                message.role === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                {formatChatMessage(message.content)}
              </div>
            </div>
          </div>
        ))}
        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-subtle text-navy">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[80%] chat-bubble-assistant">
              <div className="flex items-center gap-1 py-1">
                <span className="text-sm text-muted-foreground">Thinking</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about portfolio companies..."
            className="min-h-[44px] max-h-32 resize-none bg-background border-border focus:border-accent focus:ring-accent transition-colors duration-150"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-accent hover:bg-[hsl(335,79%,49%)] text-white px-4 shrink-0 transition-colors duration-150 rounded-md"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CopilotChat;
