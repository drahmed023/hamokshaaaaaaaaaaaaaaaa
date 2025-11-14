
import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { explainDiagram } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { BotIcon } from '../components/icons/BotIcon';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAvatar } from '../hooks/useAvatar';
import { Avatar } from '../components/Avatar';
import { ImagePlusIcon } from '../components/icons/ImagePlusIcon';
import { blobToBase64 } from '../utils/fileParser';
import { useToasts } from '../context/ToastContext';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ImageData {
    base64: string;
    mimeType: string;
    preview: string;
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


function DiagramExplainerScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<ImageData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { avatarId } = useAvatar();
    const { addToast } = useToasts();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast('Copied to clipboard!', 'success', 'Success');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            addToast('Failed to copy text.', 'error', 'Error');
        });
    };

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setError(null);
            setMessages([]); // Reset conversation
            try {
                const base64 = await blobToBase64(file);
                setImage({
                    base64,
                    mimeType: file.type,
                    preview: URL.createObjectURL(file)
                });
            } catch (err) {
                setError("Failed to process the image. Please try another one.");
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
        maxFiles: 1,
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !image) return;

        const userMessage: Message = { role: 'user', content: userInput };
        setMessages(prev => [...prev, userMessage]);

        const prompt = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const explanation = await explainDiagram(prompt, image.base64, image.mimeType);
            const modelMessage: Message = { role: 'model', content: explanation };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err: any) {
            const errorMessage: Message = { role: 'model', content: "I'm sorry, I encountered an error. Please check the image or try rephrasing your question." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="text-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold">Diagram Explainer</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Upload an image and ask the AI to explain it.</p>
            </div>

            <div className="flex-grow flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                {image ? (
                    <div className="flex-grow flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <img src={image.preview} alt="Diagram preview" className="max-h-48 w-auto mx-auto rounded-md" />
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

                                    {msg.role === 'model' ? (
                                        <div className="relative group max-w-[85%]">
                                            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none">
                                                <MarkdownRenderer content={msg.content} />
                                            </div>
                                            <button
                                                onClick={() => handleCopy(msg.content)}
                                                className="absolute top-1 right-1 p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Copy text"
                                            >
                                                <ClipboardIcon className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="max-w-[85%] p-3 rounded-2xl bg-primary-600 text-white rounded-br-none">
                                            {msg.content}
                                        </div>
                                    )}

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
                                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask about the diagram..." className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" disabled={isLoading} />
                                <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-primary-600 text-white rounded-lg disabled:bg-primary-300 dark:disabled:bg-primary-800/50 hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800" aria-label="Send message"><SendIcon className="w-6 h-6" /></button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div {...getRootProps()} className={`flex-grow flex items-center justify-center border-4 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                        <input {...getInputProps()} />
                        <div className="text-center text-slate-500 dark:text-slate-400 p-8">
                            <ImagePlusIcon className="w-16 h-16 mx-auto text-slate-400" />
                            <h2 className="mt-4 text-xl font-semibold">Drop a diagram here</h2>
                            <p>or click to select an image file</p>
                            {error && <p className="mt-4 text-red-500">{error}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagramExplainerScreen;
