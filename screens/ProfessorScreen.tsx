
import React, { useState, useRef, useEffect } from 'react';
import Loader from '../components/Loader';
import { useDropzone } from 'react-dropzone';
import { parseFileToText } from '../utils/fileParser';
import { getProfessorInteraction, generateSpeech } from '../services/geminiService';
import { FilePlusIcon } from '../components/icons/FilePlusIcon';
import { MicIcon } from '../components/icons/MicIcon';
import { decodeAudioData, decode } from '../utils/audioUtils';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';

type SessionStatus = 'idle' | 'live';

function ProfessorScreen() {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [fileContent, setFileContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState(''); // Current segment text
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
    const recognitionRef = useRef<any>(null);
    const isSessionActive = useRef(false);
    const historyRef = useRef<any[]>([]);

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                setIsListening(false);
                if (isSessionActive.current && !isSpeaking && !loading) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            recognition.onresult = (event: any) => {
                if (event.results && event.results.length > 0) {
                    const voiceInput = event.results[event.results.length - 1][0].transcript;
                    if (voiceInput && voiceInput.trim()) {
                        handleInteraction(voiceInput);
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

    // Effect to auto-start listening when Dr. Zein finishes speaking
    useEffect(() => {
        if (isSessionActive.current && !isSpeaking && !loading) {
            if (recognitionRef.current && !isListening) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
        } else if (isListening && (isSpeaking || loading)) {
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    }, [isSpeaking, loading, isListening]);

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
        setIsSpeaking(true);

        try {
            // Zephyr is a warm female voice, Kore is a professional male voice. 
            // Dr. Zein usually sounds better with 'Kore' or 'Zephyr'
            const base64 = await generateSpeech(text, 'Zephyr');
            if (!base64) throw new Error("No audio data");
            
            const audioData = decode(base64);
            const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsSpeaking(false);
            currentAudioSource.current = source;
            source.start(0);
        } catch (e) {
            console.error("Audio Playback Error", e);
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
                historyRef.current = [{ role: 'model', parts: [{ text: response }] }];
                setTranscript(response);
                // CRITICAL: Play audio immediately
                playAudio(response);
            } catch (err) {
                alert("Failed to read file.");
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
        stopAudio();

        try {
            const response = await getProfessorInteraction(fileContent, historyRef.current, voiceMsg);
            historyRef.current = [
                ...historyRef.current, 
                { role: 'user', parts: [{ text: voiceMsg }] }, 
                { role: 'model', parts: [{ text: response }] }
            ];
            setTranscript(response);
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
        setTranscript('');
    };

    if (status === 'live') {
        return (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#020617] flex flex-col font-sans overflow-hidden animate-fade-in" dir="ltr">
                {/* Minimal Header */}
                <div className="p-4 md:p-6 flex justify-between items-center bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm">
                    <button onClick={endSession} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all uppercase tracking-widest">
                        Exit Arena
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                             <GraduationCapIcon className="w-4 h-4 text-primary-600" />
                             <h2 className="text-slate-900 dark:text-primary-400 font-black tracking-[0.2em] text-xs uppercase">Dr. Zein's Classroom</h2>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isListening ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                         <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                         <span className="text-[9px] font-black uppercase tracking-widest">{isListening ? 'Dr. Zein is Listening' : 'Waiting...'}</span>
                    </div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center relative p-6">
                    {/* The Professor Persona (Central Focus) */}
                    <div className="relative w-full max-w-lg flex flex-col items-center">
                        <div className={`absolute w-[120%] h-[120%] rounded-full blur-[120px] transition-all duration-1000 ${isSpeaking ? 'bg-primary-500/10' : isListening ? 'bg-green-500/5' : 'bg-slate-200/20'} dark:opacity-40`}></div>

                        <div className={`relative w-48 md:w-80 transition-all duration-700 ${isSpeaking ? 'scale-105 filter brightness-105' : 'scale-100 opacity-90'}`}>
                             <img 
                                src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                                alt="Dr. Zein" 
                                className="w-full h-auto drop-shadow-2xl" 
                            />
                            
                            {/* Humanized Voice Visualizer */}
                            {isSpeaking && (
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-16">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="w-1.5 bg-primary-500 rounded-full animate-wave" style={{ animationDelay: `${i * 0.08}s`, height: `${10 + Math.random() * 40}px` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-16 text-center">
                             <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white opacity-90 tracking-tighter">DR. ZEIN</h1>
                             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-500/60 mt-1">Private Medical Tutor</p>
                        </div>
                    </div>

                    {/* Humanized Text Feedback (Brief and floating) */}
                    <div className="mt-12 w-full max-w-2xl">
                        <div className="p-8 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl">
                             <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                       <GraduationCapIcon className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-grow">
                                       <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                                            <MarkdownRenderer content={transcript || "أهلاً بيك يا دكتور، أنا جاهز نبدأ أول ما ترفع ملف المحاضرة."} />
                                       </div>
                                  </div>
                             </div>
                        </div>
                        {isListening && (
                            <div className="mt-6 flex justify-center animate-bounce">
                                <div className="flex items-center gap-3 px-6 py-2 bg-green-500 text-white rounded-full text-xs font-black shadow-xl">
                                     <MicIcon className="w-4 h-4" />
                                     Speak now, I'm with you...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {loading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50 transition-all">
                        <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-primary-700 dark:text-primary-400 animate-pulse">Professor is thinking...</p>
                    </div>
                )}

                <style>{`
                    @keyframes wave {
                        0%, 100% { height: 10px; }
                        50% { height: 50px; }
                    }
                    .animate-wave { animation: wave 0.5s ease-in-out infinite; }
                    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 text-center animate-fade-in" dir="ltr">
            <div className="max-w-2xl w-full space-y-10">
                <div className="relative w-56 h-56 mx-auto group">
                    <div className="absolute inset-0 bg-primary-500/20 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                    <img 
                        src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                        alt="Professor Zein" 
                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">The Arena</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium px-8 leading-relaxed">
                        Step into a human-like medical lecture. <br/>
                        <span className="text-primary-600 font-black">Real Voice • Real Discussion • No Robots.</span>
                    </p>
                </div>

                <div {...getRootProps()} className={`relative mt-16 group p-12 md:p-20 border-4 border-dashed rounded-[4rem] transition-all duration-500 cursor-pointer shadow-sm ${isDragActive ? 'border-primary-500 bg-white scale-105 shadow-2xl' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 hover:shadow-xl'}`}>
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                        <FilePlusIcon className="w-8 h-8" />
                    </div>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Drop Medical Lecture (PDF)</span>
                    <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-[0.3em] font-black opacity-60">Dr. Zein will take it from here</p>
                    
                    {loading && (
                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 rounded-[4rem] flex items-center justify-center z-10 backdrop-blur-md">
                            <Loader text="Preparing the hall..." />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfessorScreen;
