import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestedQuestions?: string[];
};

const EXAMPLE_QUESTIONS = [
  "What was Jerry's impact as a Design Manager at Google?",
  "How does Jerry approach UX strategy and team leadership?",
  "Can you summarize Jerry's work at Atlassian?"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Jerry's AI assistant. I can answer questions about his design portfolio, experience, and projects. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const userText = typeof textToSend === 'string' ? textToSend : input.trim();
    if (!userText || isLoading) return;

    if (typeof textToSend !== 'string') {
      setInput('');
    }
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      let answerText = data.text;
      let suggestedQuestions: string[] = [];
      
      try {
        const parsed = JSON.parse(data.text);
        answerText = parsed.answer;
        suggestedQuestions = parsed.suggestedQuestions || [];
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
      
      const newModelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: answerText,
        suggestedQuestions,
      };
      
      setMessages((prev) => [...prev, newModelMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error while trying to respond. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
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
    <div className="flex flex-col h-full bg-transparent font-sans text-gray-900">
      {/* Chat Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-3 bg-gray-50/50"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-blue-600'
                }`}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex flex-col gap-1.5">
                <div
                  className={`px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-800 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm markdown-body'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <Markdown>{msg.text}</Markdown>
                  )}
                </div>
                
                {/* Example Questions - Show only after the first welcome message */}
                {index === 0 && messages.length === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 mt-2"
                  >
                    {EXAMPLE_QUESTIONS.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(question)}
                        className="text-left px-3 py-2 bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-blue-700 text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2"
                      >
                        <MessageSquare size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{question}</span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Suggested Follow-up Questions - Show only for the latest model message */}
                {msg.role === 'model' && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && index === messages.length - 1 && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 mt-2"
                  >
                    {msg.suggestedQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(question)}
                        className="text-left px-3 py-2 bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-blue-700 text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2"
                      >
                        <MessageSquare size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{question}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 text-blue-600 flex items-center justify-center shadow-sm">
              <Bot size={16} />
            </div>
            <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="relative flex items-end gap-2 w-full max-w-[85%] ml-11">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="w-full max-h-32 min-h-[44px] bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 bottom-1.5 p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Send size={16} className={input.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
