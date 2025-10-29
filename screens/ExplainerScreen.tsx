import React, { useState, useRef, useEffect } from 'react';
import { getStepByStepExplanation } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { BotIcon } from '../components/icons/BotIcon';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAvatar } from '../hooks/useAvatar';
import { Avatar } from '../components/Avatar';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const TypingIndicator = () => (
    <div className="flex items-start gap-3 justify-start">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <BotIcon className="w-6 h-6 text-slate-500" />
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-none">
            <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
        </div>
    </div>
);


function ExplainerScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            content: "Hello! I'm your AI Explainer. What complex topic can I break down for you today?"
        }
    ]);
    const [currentTopic, setCurrentTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { avatarId } = useAvatar();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTopic.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: currentTopic };
        setMessages(prev => [...prev, userMessage]);
        
        const topicToExplain = currentTopic;
        setCurrentTopic('');
        setIsLoading(true);

        try {
            const explanation = await getStepByStepExplanation(topicToExplain);
            const modelMessage: Message = { role: 'model', content: explanation };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err: any) {
            const errorMessage: Message = { role: 'model', content: "I'm sorry, I encountered an error while generating the explanation. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-shrink-0">
                 <SparklesIcon className="w-6 h-6 text-primary-500" />
                <h1 className="text-xl font-bold">AI Explainer</h1>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && (
                           <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <BotIcon className="w-6 h-6 text-slate-500" />
                           </div>
                       )}
                       <div className={`max-w-[85%] p-3 rounded-2xl ${
                           msg.role === 'user'
                           ? 'bg-primary-600 text-white rounded-br-none'
                           : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                       }`}>
                           {msg.role === 'model' ? <MarkdownRenderer content={msg.content} /> : msg.content}
                       </div>
                       {msg.role === 'user' && (
                           <div className="w-10 h-10 flex-shrink-0">
                               <Avatar avatarId={avatarId} />
                           </div>
                       )}
                    </div>
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={currentTopic}
                        onChange={(e) => setCurrentTopic(e.target.value)}
                        placeholder="Ask about a concept..."
                        className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !currentTopic.trim()}
                        className="p-3 bg-primary-600 text-white rounded-lg disabled:bg-primary-300 dark:disabled:bg-primary-800/50 hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExplainerScreen;
