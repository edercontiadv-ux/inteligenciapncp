'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistenteVirtual() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do **Inteligência PNCP**. Posso ajudar com dúvidas sobre como usar a ferramenta, base legal, interpretação de resultados e muito mais. Como posso ajudar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getContext = useCallback(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const hasResults = document.querySelector('[data-testid="resultados"]') !== null;
    return {
      currentPage: window.location.pathname,
      hasResults,
      termoBusca: params.get('q') || '',
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingContent('');

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: getContext(),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('Erro na requisição');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Sem reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
                setStreamingContent('');
              } else if (data.token) {
                fullContent += data.token;
                setStreamingContent(fullContent);
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
      }]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 sm:bg-transparent sm:pointer-events-none" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed z-50 transition-all duration-300 ease-out ${isOpen ? 'bottom-20 right-4 sm:bottom-6 sm:right-6' : 'bottom-6 right-6'}`}>
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-sand/40 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] flex flex-col animate-scale-in origin-bottom-right mb-2">
            <div className="flex items-center justify-between p-4 border-b border-brand-sand/30 bg-brand-navy rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-gold/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-gold" />
                </div>
                <div>
                  <span className="font-body text-sm font-medium text-white">Assistente PNCP</span>
                  <span className="font-body text-[10px] text-white/50 block leading-tight">Online</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Fechar assistente"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 font-body text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-navy text-white rounded-br-md'
                        : 'bg-brand-mist/50 text-brand-ink rounded-bl-md'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-strong:text-inherit">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 font-body text-sm leading-relaxed bg-brand-mist/50 text-brand-ink rounded-bl-md">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown><span className="animate-pulse">▌</span>
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3.5 py-2.5 bg-brand-mist/50 rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-navy/50" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-brand-sand/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="input-field text-sm flex-1"
                  placeholder="Digite sua dúvida..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="btn-primary !px-3 !py-2.5 shrink-0"
                  aria-label="Enviar mensagem"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-brand-navy rotate-90'
              : 'bg-brand-navy hover:bg-brand-navy/90'
          }`}
          aria-label={isOpen ? 'Fechar assistente' : 'Abrir assistente'}
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
}
