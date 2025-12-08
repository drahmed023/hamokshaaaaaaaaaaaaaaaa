import React, { useState, useRef, useEffect } from 'react';
import { useAIInteraction } from '../hooks/useAIInteraction';
import { AIInteractionActionType } from '../types';
import { getAIResponse, generateSpeech } from '../services/geminiService';
import { useSmartSettings } from '../hooks/useSmartSettings';
import { SendIcon } from './icons/SendIcon';
import { BotIcon } from './icons/BotIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { MicIcon } from './icons/MicIcon';
import { MicOffIcon } from './icons/MicOffIcon';
import { VolumeUpIcon } from './icons/VolumeUpIcon';
import { StopIcon } from './icons/StopIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { Avatar } from './Avatar';
import { useAvatar } from '../hooks/useAvatar';
import { decodeAudioData, decode } from '../utils/audioUtils';

const TypingIndicator = () => (
    <div className="flex items-start gap-3 justify-start animate-fade-in">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <BotIcon className="w-5 h-5 text-slate-500" />
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-none">
            <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
        </div>
    </div>
);

function AICompanion() {
    const { messages, isOpen, isThinking, dispatch } = useAIInteraction();
    const { aiPersona, aiVoiceTutor, aiVoice } = useSmartSettings();
    const { avatarId } = useAvatar();
    
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Initialize Audio Context
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsRecording(true);
            
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSendMessage(transcript); // Auto-send on voice end
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => setIsRecording(false);
            
            recognitionRef.current = recognition;
        }
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isThinking]);

    const stopAudio = () => {
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            currentSourceRef.current = null;
        }
        setIsSpeaking(false);
    };

    const playAudioResponse = async (text: string) => {
        if (!aiVoiceTutor || !text) return;
        
        // Stop any currently playing audio
        stopAudio();

        try {
            setIsSpeaking(true);
            const base64Audio = await generateSpeech(text, aiVoice);
            
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const audioData = decode(base64Audio);
            const buffer = await decodeAudioData(audioData, audioContextRef.current!, 24000, 1);
            
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current!.destination);
            
            source.onended = () => setIsSpeaking(false);
            
            currentSourceRef.current = source;
            source.start(0);
        } catch (error) {
            console.error("Failed to play audio response", error);
            setIsSpeaking(false);
        }
    };

    const handleSendMessage = async (textToSend: string = inputValue) => {
        if (!textToSend.trim()) return;

        // Stop recording if active
        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        // Stop speaking if active
        stopAudio();

        const userMessage = { role: 'user' as const, parts: [{ text: textToSend }] };
        dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: userMessage });
        setInputValue('');
        dispatch({ type: AIInteractionActionType.SET_IS_THINKING, payload: true });

        try {
            // Filter history to simple format for API
            const historyForApi = messages.map(m => ({
                role: m.role,
                parts: m.parts
            }));

            const response = await getAIResponse(historyForApi, textToSend, aiPersona);
            
            // Handle Tool Calls (Navigation, Scheduling)
            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const call of response.functionCalls) {
                    if (call.name === 'navigateTo') {
                        dispatch({ 
                            type: AIInteractionActionType.SHOW_NAVIGATION_PROMPT, 
                            payload: { 
                                destination: call.args.page, 
                                message: `I can take you to the ${call.args.page} page. Would you like to go?` 
                            } 
                        });
                    } else if (call.name === 'scheduleTask') {
                        dispatch({
                            type: AIInteractionActionType.SHOW_SCHEDULING_MODAL,
                            payload: {
                                taskDescription: call.args.description,
                                dueDate: call.args.dueDate
                            }
                        });
                    }
                }
            }

            const modelMessage = { role: 'model' as const, parts: [{ text: response.text }] };
            dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: modelMessage });
            
            // Trigger TTS if enabled
            if (aiVoiceTutor && response.text) {
                playAudioResponse(response.text);
            }

        } catch (error) {
            console.error("AI Interaction Error:", error);
            const errorMessage = { role: 'model' as const, parts: [{ text: "I'm having trouble connecting right now. Please try again." }] };
            dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: errorMessage });
        } finally {
            dispatch({ type: AIInteractionActionType.SET_IS_THINKING, payload: false });
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            stopAudio(); // Stop AI speaking when user wants to talk
            recognitionRef.current.start();
        }
    };

    const toggleWindow = () => {
        dispatch({ type: AIInteractionActionType.TOGGLE_WINDOW });
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={toggleWindow}
                className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-primary-600'}`}
                aria-label="Open AI Companion"
            >
                {isSpeaking ? <VolumeUpIcon className="w-8 h-8 text-white" /> : <BotIcon className="w-8 h-8 text-white" />}
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-6 right-6 z-50 w-full max-w-[380px] h-[600px] max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}`}>
                {/* Header */}
                <div className="p-4 bg-primary-600 dark:bg-primary-700 flex items-center justify-between text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <BotIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Study Companion</h3>
                            <p className="text-xs text-primary-100 opacity-90 capitalize flex items-center gap-1">
                                {aiPersona} Mode
                                {aiVoiceTutor && isSpeaking && <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isSpeaking && (
                            <button onClick={stopAudio} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Stop Speaking">
                                <StopIcon className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <button onClick={toggleWindow} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-black/20">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <BotIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                            )}
                            
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-primary-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                            }`}>
                                {msg.role === 'user' ? (
                                    msg.parts[0].text
                                ) : (
                                    <MarkdownRenderer content={msg.parts[0].text} />
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 flex-shrink-0 mt-1">
                                    <Avatar avatarId={avatarId} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all"
                    >
                        <button
                            type="button"
                            onClick={toggleRecording}
                            className={`p-2 rounded-full transition-all duration-200 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            title={isRecording ? "Stop Recording" : "Start Voice Input"}
                        >
                            {isRecording ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isRecording ? "Listening..." : "Type a message..."}
                            className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 px-2"
                            disabled={isRecording}
                        />

                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isThinking}
                            className="p-2 bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-sm"
                        >
                            <SendIcon className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AICompanion;