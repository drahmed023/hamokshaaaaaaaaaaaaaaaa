
import React, { useState, useRef, useEffect } from 'react';
import Loader from '../components/Loader';
import { useDropzone } from 'react-dropzone';
import { parseFileToText } from '../utils/fileParser';
import { getProfessorInteraction, generateSpeech } from '../services/geminiService';
import { FilePlusIcon } from '../components/icons/FilePlusIcon';
import { MicIcon } from '../components/icons/MicIcon';
import { decodeAudioData, decode } from '../utils/audioUtils';

type SessionStatus = 'idle' | 'live';

function ProfessorScreen() {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [fileContent, setFileContent] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
    const recognitionRef = useRef<any>(null);
    const isSessionActive = useRef(false);
    const historyRef = useRef<any[]>([]);

    // Sync historyRef with history state for accurate callbacks
    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    // Initialize Recognition and Audio once
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'ar-EG';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                setIsListening(false);
                // Re-start immediately if professor is NOT talking
                if (isSessionActive.current && !isSpeaking && !loading) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            recognition.onresult = (event: any) => {
                if (event.results && event.results.length > 0) {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    if (transcript && transcript.trim()) {
                        handleInteraction(transcript);
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            isSessionActive.current = false;
            stopAudio();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    // Monitor isSpeaking and Loading to stop/start mic
    useEffect(() => {
        if (isSessionActive.current) {
            if (isSpeaking || loading) {
                if (recognitionRef.current && isListening) recognitionRef.current.stop();
            } else {
                if (recognitionRef.current && !isListening) {
                   try { recognitionRef.current.start(); } catch(e) {}
                }
            }
        }
    }, [isSpeaking, loading]);

    const stopAudio = () => {
        if (currentAudioSource.current) {
            try { currentAudioSource.current.stop(); } catch(e) {}
            currentAudioSource.current = null;
        }
        setIsSpeaking(false);
    };

    const playAudio = async (text: string) => {
        if (!text || !audioContextRef.current) return;
        
        stopAudio();

        try {
            setIsSpeaking(true);
            const base64 = await generateSpeech(text, 'Kore');
            if (!base64) throw new Error("No audio data");
            
            const audioData = decode(base64);
            const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            
            source.onended = () => {
                setIsSpeaking(false);
            };

            currentAudioSource.current = source;
            source.start(0);
        } catch (e) {
            console.error("Dr. Zayn Audio Error", e);
            setIsSpeaking(false);
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setLoading(true);
            try {
                const text = await parseFileToText(file);
                setFileContent(text);
                setStatus('live');
                isSessionActive.current = true;
                
                const response = await getProfessorInteraction(text, []);
                const initialHistory = [{ role: 'model', parts: [{ text: response }] }];
                setHistory(initialHistory);
                playAudio(response);
            } catch (err) {
                alert("تعذر قراءة الملف، يرجى المحاولة مرة أخرى.");
            } finally {
                setLoading(false);
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
        disabled: loading
    });

    const handleInteraction = async (voiceMsg: string) => {
        if (loading || isSpeaking) return;
        
        setLoading(true);

        try {
            const currentHistory = historyRef.current || [];
            const response = await getProfessorInteraction(fileContent, currentHistory, voiceMsg);
            
            const newHistory = [
                ...currentHistory, 
                { role: 'user', parts: [{ text: voiceMsg }] }, 
                { role: 'model', parts: [{ text: response }] }
            ];
            
            setHistory(newHistory);
            playAudio(response);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const endSession = () => {
        isSessionActive.current = false;
        stopAudio();
        if (recognitionRef.current) recognitionRef.current.stop();
        setStatus('idle');
        setHistory([]);
    };

    if (status === 'live') {
        return (
            <div className="fixed inset-0 z-50 bg-[#000] text-white flex flex-col font-sans overflow-hidden animate-fade-in">
                {/* Minimal Header */}
                <div className="p-6 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5">
                    <button onClick={endSession} className="text-xs font-black text-slate-500 hover:text-red-400 tracking-widest uppercase transition-all">
                        Exit Hall
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-primary-400 font-black tracking-[0.3em] text-sm">ZAYN ACADEMIA • LIVE</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {isListening ? 'Microphone Active' : isSpeaking ? 'Professor Speaking' : 'System Busy'}
                             </span>
                        </div>
                    </div>

                    <div className="w-16"></div>
                </div>

                {/* Professor Aura Area */}
                <div className="flex-grow flex flex-col items-center justify-center relative px-6">
                    <div className={`absolute w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] transition-all duration-1000 ${isSpeaking ? 'bg-primary-500/10 opacity-100 scale-110' : isListening ? 'bg-green-500/5 opacity-80 scale-100' : 'bg-white/5 opacity-20'}`}></div>

                    <div className={`relative w-[280px] md:w-[420px] transition-all duration-700 ${isSpeaking ? 'scale-105 filter brightness-110' : 'scale-100 filter grayscale-[10%]'}`}>
                         <img 
                            src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                            alt="Dr. Zayn" 
                            className="w-full h-auto drop-shadow-[0_0_60px_rgba(99,102,241,0.2)]" 
                        />
                        
                        {isSpeaking && (
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-10">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="w-1.5 bg-primary-500 rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                        )}

                        {isListening && (
                             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <div className="flex gap-1">
                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping [animation-delay:0.2s]"></div>
                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping [animation-delay:0.4s]"></div>
                                </div>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">سامعك.. اتفضل يا دكتور</span>
                             </div>
                        )}
                    </div>

                    <h1 className="mt-14 text-6xl md:text-8xl font-black italic tracking-tighter text-white opacity-90 select-none">
                        DR. ZAYN
                    </h1>
                </div>

                {/* Footer Status Message */}
                <div className="p-12 flex flex-col items-center justify-center bg-gradient-to-t from-black to-transparent">
                     <p className="text-sm font-medium text-slate-400 tracking-wide text-center">
                        {isSpeaking ? 'استمع جيداً لشرح البروفيسور...' : isListening ? 'الميكروفون مفتوح، البروفيسور يسمعك الآن...' : 'جاري التفكير في شرح مبسط...'}
                     </p>
                </div>
                
                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md z-50">
                        <Loader text="دكتور زين يحضر الرد..." />
                    </div>
                )}

                <style>{`
                    @keyframes wave {
                        0%, 100% { height: 12px; }
                        50% { height: 40px; }
                    }
                    .animate-wave { animation: wave 0.6s ease-in-out infinite; }
                    .animate-fade-in { animation: fadeIn 1.5s ease-out forwards; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-xl w-full space-y-8">
                <div className="relative w-56 h-56 mx-auto">
                    <img 
                        src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                        alt="Professor Zayn" 
                        className="w-full h-full object-contain drop-shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-full -z-10"></div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">قاعة دكتور زين</h1>
                    <p className="text-lg text-slate-500 font-medium px-4">
                        ارفع محاضرتك وابدأ جلسة تفاعلية حية بالصوت فقط. <br/>
                        <span className="text-primary-600 font-bold">الميكروفون سيعمل تلقائياً طوال الجلسة.</span>
                    </p>
                </div>

                <div {...getRootProps()} className={`relative mt-12 group p-12 border-2 border-dashed rounded-[40px] transition-all cursor-pointer ${isDragActive ? 'border-primary-500 bg-primary-50 scale-105 shadow-2xl' : 'border-blue-200 bg-white hover:border-primary-300 hover:shadow-xl'}`}>
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-blue-50 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FilePlusIcon className="w-8 h-8" />
                    </div>
                    <span className="text-xl font-black text-slate-800">ارفع ملف المحاضرة وابدأ</span>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">PDF ONLY • HANDS-FREE MODE</p>
                    
                    {loading && (
                        <div className="absolute inset-0 bg-white/95 rounded-[40px] flex items-center justify-center z-10 backdrop-blur-sm">
                            <Loader text="دكتور زين يراجع المحاضرة..." />
                        </div>
                    )}
                </div>

                <footer className="pt-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                    Advanced Medical AI Hall • Hands-Free Experience • 2025
                </footer>
            </div>
        </div>
    );
}

export default ProfessorScreen;
