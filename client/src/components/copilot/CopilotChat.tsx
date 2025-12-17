import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Company } from '@/types/company';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (company) {
      const contextMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I see you've selected **${company.name}**. This is a ${company.stage} company in the ${company.categories.join(', ')} space. They're based in ${company.location} with a team of ${company.teamSize} people. What would you like to know about them?`,
      };
      setMessages((prev) => [...prev, contextMessage]);
    }
  }, [company]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(input, company),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
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
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
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
            disabled={!input.trim()}
            className="bg-accent hover:bg-[hsl(335,79%,49%)] text-white px-4 shrink-0 transition-colors duration-150 rounded-md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

function getSimulatedResponse(input: string, company: Company | null): string {
  const lowerInput = input.toLowerCase();

  if (company) {
    if (lowerInput.includes('competitor') || lowerInput.includes('competition')) {
      return `${company.name} operates in a competitive landscape within the ${company.categories.join(' and ')} sectors. Key factors that differentiate them include their technology approach, team expertise, and go-to-market strategy. Would you like me to dive deeper into any specific aspect?`;
    }
    if (
      lowerInput.includes('metric') ||
      lowerInput.includes('performance') ||
      lowerInput.includes('growth')
    ) {
      return `Based on the latest data, ${company.name} has shown strong growth trajectory. As a ${company.stage} company, they're focused on scaling their operations. I can provide more specific metrics if you'd like to explore particular KPIs.`;
    }
    if (lowerInput.includes('team') || lowerInput.includes('founder')) {
      return `${company.name} has a team of ${company.teamSize} people based in ${company.location}. The founding team brings expertise in ${company.categories.join(' and ')}. Would you like more details about the leadership team?`;
    }
  }

  if (lowerInput.includes('portfolio') || lowerInput.includes('companies')) {
    return "The Radical portfolio spans multiple sectors including AI/ML, Climate, Healthcare, and Enterprise software. We've invested in companies at various stages from seed to growth. Would you like me to filter by any specific criteria?";
  }

  if (lowerInput.includes('trend') || lowerInput.includes('insight')) {
    return 'Key trends across the portfolio include the rise of foundation models in enterprise applications, climate tech gaining significant traction, and increased focus on AI infrastructure. What area interests you most?';
  }

  return 'I can help you explore portfolio companies, analyze trends, compare investments, or dive deep into specific company details. What would you like to focus on?';
}

export default CopilotChat;
