import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Send, Loader2, Sparkles, MessageSquare, BookOpen } from 'lucide-react';

export default function ChatInterface({ paperId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "What is the core methodology used?",
    "What are the main results and contributions?",
    "Explain the dataset and evaluation setup.",
    "Are there any limitations discussed?"
  ];

  useEffect(() => {
    fetchHistory();
  }, [paperId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await api.getChatHistory(paperId);
      
      // Map database format to local message bubbles format
      const formatted = [];
      history.forEach(item => {
        formatted.push({ sender: 'user', text: item.query });
        formatted.push({ sender: 'assistant', text: item.response });
      });
      setMessages(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput('');
    setSending(true);
    
    // Optimistic UI updates
    setMessages(prev => [...prev, { sender: 'user', text: query }]);

    try {
      const chatRes = await api.askQuestion(paperId, query);
      setMessages(prev => [...prev, { sender: 'assistant', text: chatRes.response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { sender: 'assistant', text: 'Error: Failed to obtain answer. Please check backend connection.' }
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[550px] lg:h-full max-h-[800px] bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 max-w-sm mx-auto space-y-4">
            <div className="p-3 bg-primary-500/10 rounded-full w-max mx-auto text-primary-600 dark:text-primary-400">
              <MessageSquare className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask your paper anything</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize results, explain complex equations, or query experimental set-ups. The AI answers using text matching from this PDF.
            </p>
          </div>
        )}

        {/* Conversation Logs Bubbles */}
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-slate-200 rounded-bl-none font-academic shadow-sm'
            }`}>
              {msg.sender === 'assistant' && (
                <span className="text-[10px] font-bold tracking-wider text-primary-600 dark:text-primary-400 uppercase block mb-1.5 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-primary-500" />
                  ScholarAI assistant
                </span>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {/* Sending Loader Bubble */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-4 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                <span className="animate-pulse">Retrieving semantic sections and synthesising...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && !sending && (
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-900/60 bg-white dark:bg-slate-900 flex flex-wrap gap-2">
          {suggestions.map(sug => (
            <button
              key={sug}
              onClick={() => handleSendMessage(sug)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-primary-50 dark:bg-slate-950 dark:hover:bg-primary-950/40 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl border border-slate-200/50 dark:border-slate-800/40 hover:border-primary-500/20 transition text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Type your question about the paper..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="absolute right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-30 disabled:hover:bg-primary-600 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
