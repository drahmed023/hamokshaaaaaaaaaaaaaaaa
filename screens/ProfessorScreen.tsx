
import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { parseFileToText } from '../utils/fileParser';
import { encode, decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';
import { MicIcon } from '../components/icons/MicIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { FilePlusIcon } from '../components/icons/FilePlusIcon';
import { StopIcon } from '../components/icons/StopIcon';
import { VolumeUpIcon } from '../components/icons/VolumeUpIcon';
import Button from '../components/Button';

type SessionStatus = 'idle' | 'connecting' | 'live';

function ProfessorScreen() {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastTranscription, setLastTranscription] = useState('');

    // Audio & Session Refs
    const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
    const nextStartTimeRef = useRef(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const initializeAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = {
                input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }),
                output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })
            };
        }
    };

    const stopAllAudio = () => {
        activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        activeSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsSpeaking(false);
    };

    const startLiveSession = async (content: string) => {
        setLoading(true);
        initializeAudio();
        
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('live');
                        setLoading(false);
                        
                        const source = audioContextRef.current!.input.createMediaStreamSource(streamRef.current!);
                        const processor = audioContextRef.current!.input.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(audioContextRef.current!.input.destination);

                        // CRITICAL: Explicitly tells the AI to ONLY use the provided file and explain in parts.
                        sessionPromise.then(session => {
                            session.send({
                                text: `يا دكتور زين، ده الملف اللي هنشرحه حصرياً للطلبة، ممنوع تخرج عنه أو تشرح أي حاجة من برا غير لو في سياق التوضيح البسيط: "${content.substring(0, 35000)}". 
                                
                                خطة العمل الآن:
                                1. قسّم المحتوى ده لأجزاء تعليمية (Modules).
                                2. ابدأ بشرح الجزء الأول "بالكامل" وبشكل إنساني ممتع.
                                3. بعد ما تخلص شرح الجزء الأول، "لازم" تسكت وتنتظر مني رد، أو تسألني سؤال ذكاء في اللي شرحته عشان تتأكد إني فاهم.
                                4. مكملش للجزء التاني إلا لما أقولك "تمام" أو "كمل يا دكتور".`
                            });
                        });
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.interrupted) {
                            stopAllAudio();
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setIsSpeaking(true);
                            const outCtx = audioContextRef.current!.output;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                            
                            const buffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outCtx.destination);
                            
                            source.onended = () => {
                                activeSourcesRef.current.delete(source);
                                if (activeSourcesRef.current.size === 0) setIsSpeaking(false);
                            };
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            activeSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.modelTurn?.parts[0]?.text) {
                            setLastTranscription(message.serverContent.modelTurn.parts[0].text);
                        }
                    },
                    onclose: () => endSession(),
                    onerror: (e) => {
                        console.error("Live API Error", e);
                        setLoading(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: `
                    أنت "الأستاذ الدكتور زين". شخصية مصرية عبقرية، محاضر مخضرم، ومحب لطلابه.
                    
                    قوانينك الصارمة كدكتور:
                    - التزم "فقط" بمحتوى الملف المرفق. لا تشرح معلومات خارجية عشوائية.
                    - نظامك هو (شرح جزء كامل -> وقفة للسؤال -> انتظار الطالب).
                    - في نهاية كل جزء، اسأل سؤالاً مثل: "ها يا دكتور، الحتة دي هضمتها؟" أو "تحب أسألك فيها سؤال امتحان أشوفك لقطتها ولا لأ؟".
                    - صوتك بشري؛ استخدم التنهيدات، الضحكات الخفيفة، والتشجيع: "الله ينور"، "وحش يا بطل".
                    - اللغة: عامية مصرية أكاديمية راقية.
                    - المصطلحات العلمية الإنجليزية تظل كما هي بنطق صحيح.
                    - إذا قاطعك الطالب، توقف واسمع له بجدية ورد عليه من سياق الملف.
                    `
                }
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (e) {
            console.error(e);
            alert("يرجى تفعيل الميكروفون للدخول إلى قاعة المحاضرة.");
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setLoading(true);
            try {
                const text = await parseFileToText(file);
                if (!text || text.trim().length < 10) {
                   throw new Error("الملف فارغ أو لا يمكن قراءته.");
                }
                startLiveSession(text);
            } catch (err) {
                alert("تعذر قراءة هذا الملف. تأكد أنه ملف نصي أو PDF سليم.");
                setLoading(false);
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 
            'application/pdf': ['.pdf'], 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: false,
        disabled: loading
    });

    const endSession = () => {
        stopAllAudio();
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        sessionPromiseRef.current?.then(session => session.close());
        setStatus('idle');
        setLastTranscription('');
    };

    if (status === 'live' || status === 'connecting') {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-[#020617] flex flex-col font-sans overflow-hidden animate-fade-in" dir="ltr">
                {/* Header Navigation */}
                <div className="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-black/20 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5">
                    <button onClick={endSession} className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                        <StopIcon className="w-4 h-4" /> إنهاء المحاضرة
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                             <GraduationCapIcon className="w-5 h-5 text-primary-600" />
                             <h2 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-[0.2em]">Lecture Arena</h2>
                        </div>
                    </div>

                    <div className={`flex items-center gap-3 px-6 py-2 rounded-full border-2 transition-all duration-500 ${isSpeaking ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse'}`}>
                         <div className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-primary-500 animate-bounce' : 'bg-emerald-500'}`}></div>
                         <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking ? 'Dr. Zein Speaking' : 'Listening...'}</span>
                    </div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center p-6 relative">
                    <div className="relative flex flex-col items-center max-w-2xl w-full">
                        {/* Audio Reactive Glow */}
                        <div className={`absolute w-80 h-80 md:w-[35rem] md:h-[35rem] rounded-full blur-[140px] transition-all duration-1000 ${isSpeaking ? 'bg-primary-400/25 scale-125' : 'bg-emerald-400/5 scale-100'}`}></div>
                        
                        <div className={`relative transition-all duration-700 ${isSpeaking ? 'scale-110' : 'scale-100 opacity-90'}`}>
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                                alt="Professor Zein" 
                                className="w-64 h-64 md:w-[28rem] md:h-[28rem] object-contain drop-shadow-[0_45px_70px_rgba(0,0,0,0.1)]" 
                            />
                            
                            {/* Waveform Visualizer */}
                            {isSpeaking && (
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-2 h-20">
                                    {[...Array(15)].map((_, i) => (
                                        <div key={i} className="w-1.5 bg-primary-500 rounded-full animate-wave" style={{ animationDelay: `${i * 0.05}s`, height: `${15 + Math.random() * 50}px` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-20 text-center">
                            <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">DR. ZEIN</h1>
                            <p className="text-xs font-black uppercase tracking-[0.6em] text-primary-600 mt-4">Active Learning Mode</p>
                        </div>
                    </div>

                    {/* Captions Overlay */}
                    <div className="absolute bottom-10 w-full max-w-4xl px-8">
                        <div className="p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl transition-all duration-500">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className="p-1.5 bg-primary-600 rounded-lg shadow-lg"><VolumeUpIcon className="w-3.5 h-3.5 text-white" /></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Professor Transcription</span>
                             </div>
                             <p className="text-slate-800 dark:text-slate-100 text-xl md:text-2xl font-bold leading-relaxed text-right" dir="rtl">
                                {isSpeaking ? (lastTranscription || "يتم الشرح الآن...") : "تحدث الآن.. دكتور زين يسمعك وسيجيب فوراً."}
                             </p>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-fade-in">
                        <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-2xl"></div>
                        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-primary-800 dark:text-primary-400 animate-pulse">Professor is analyzing the materials...</p>
                    </div>
                )}

                <style>{`
                    @keyframes wave { 0%, 100% { height: 12px; opacity: 0.3; } 50% { height: 60px; opacity: 1; } }
                    .animate-wave { animation: wave 0.4s ease-in-out infinite; }
                    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-slate-50/30" dir="ltr">
            <div className="max-w-2xl w-full space-y-12">
                <div className="relative inline-block group">
                    <div className="absolute inset-0 bg-primary-500/15 blur-[120px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                    <img 
                        src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" 
                        alt="Professor Zein" 
                        className="w-64 h-64 mx-auto relative z-10 drop-shadow-2xl grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-2xl shadow-2xl border border-slate-100 font-black text-xs uppercase tracking-widest text-primary-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Direct Arena Access
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-tight">THE ARENA</h1>
                    <p className="text-2xl text-slate-500 font-medium px-12 leading-relaxed">
                        محاضرة مخصصة مع <span className="text-primary-600 font-black italic underline decoration-primary-200">دكتور زين</span>. <br/>
                        ارفع المادة، وسيشرحها لك جزء بجزء مع نقاش تفاعلي كامل.
                    </p>
                </div>

                <div {...getRootProps()} className={`relative mt-16 group p-16 md:p-28 border-4 border-dashed rounded-[5rem] transition-all duration-500 cursor-pointer shadow-sm ${isDragActive ? 'border-primary-500 bg-primary-50 scale-105' : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-2xl'}`}>
                    <input {...getInputProps()} />
                    <div className="w-24 h-24 bg-slate-50 text-primary-600 rounded-[2.5rem] shadow-inner flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:bg-primary-50 transition-all duration-500">
                        <FilePlusIcon className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">ارفع ملف المحاضرة هنا</h3>
                    <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-[0.4em]">PDF • DOCX • TEXT • IMAGE</p>
                </div>

                <div className="flex items-center justify-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <MicIcon className="w-4 h-4" />
                    <span>Real-time Interactive Training Powered by Gemini Live</span>
                </div>
            </div>
        </div>
    );
}

export default ProfessorScreen;
