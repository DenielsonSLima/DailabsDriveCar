import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, Database } from 'lucide-react';
import { ragService } from '../services/rag.service';
import { useAuthStore } from '../store/auth.store';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o **Nexus AI**. Como posso ajudar você com os dados do seu ERP hoje?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const newUserMsg: Message = { role: 'user', content: userQuery, timestamp: new Date() };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const organizationId = profile?.organization_id;
      if (!organizationId) {
        throw new Error('Organização não identificada.');
      }

      const response = await ragService.chatResponse(userQuery, organizationId);
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Erro Assistente:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Verifique sua conexão ou tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95
          ${isOpen 
            ? 'bg-slate-800 text-white rotate-90' 
            : 'bg-gradient-to-br from-[#004691] to-blue-600 text-white animate-pulse'
          }
        `}
      >
        {isOpen ? <X size={28} /> : <div className="relative"><Bot size={32} /><div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div></div>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] h-[600px] max-h-[85vh] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#004691] to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Sparkles size={20} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-none">Nexus AI</h3>
                <span className="text-[10px] text-blue-200 font-medium uppercase tracking-widest">Inteligência RAG Ativa</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
                <div className="flex items-center text-[10px] bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                    <Database size={10} className="mr-1" />
                    SYNC
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X size={20} />
                </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-[#004691] text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none prose prose-sm'
                    }
                  `}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  <div className={`text-[9px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-[#004691]" />
                  <span className="text-xs text-slate-500 font-medium italic">Nexus está consultando o ERP...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer / Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte sobre vendas, estoque ou clientes..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#004691] outline-none transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-[#004691] text-white rounded-xl hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Os dados são privados e protegidos pela criptografia do NEXUS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
