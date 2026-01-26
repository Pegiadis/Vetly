import React, { useState, useRef, useEffect } from 'react';
import { MessageCircleIcon } from './Icons';
import { generateAIResponse } from '../services/geminiService';

const AIChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string, isUser: boolean }[]>([
        { text: 'Γεια σας! Είμαι ο Vetly AI Assistant. Πώς μπορώ να βοηθήσω με το κατοικίδιό σας;', isUser: false }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMsg = inputText;
        setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
        setInputText('');
        setIsLoading(true);

        try {
            const aiMsg = await generateAIResponse(userMsg);
            setMessages(prev => [...prev, { text: aiMsg, isUser: false }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: 'Υπήρξε ένα πρόβλημα. Δοκιμάστε ξανά.', isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div className={`pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 mb-4 transition-all duration-300 origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 flex justify-between items-center">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                        Vetly AI Assistant
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
                </div>
                
                <div className="h-80 overflow-y-auto p-4 bg-slate-50 space-y-3">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isUser ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="Ρωτήστε κάτι..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M22 2L11 13" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center group"
            >
                <MessageCircleIcon className="w-8 h-8" />
                <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   Chat AI
                </span>
            </button>
        </div>
    );
};

export default AIChat;
