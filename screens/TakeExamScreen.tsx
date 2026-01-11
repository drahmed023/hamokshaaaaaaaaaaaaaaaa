
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, ExamResult, Question, BookmarksActionType, HighlightsActionType } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';
import { useBookmarks } from '../hooks/useBookmarks';
import { useHighlights } from '../hooks/useHighlights';
import { useToasts } from '../context/ToastContext';

// Icons
import { MenuIcon } from '../components/icons/MenuIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { XIcon } from '../components/icons/XIcon';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { FlaskIcon } from '../components/icons/FlaskIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { PencilAltIcon } from '../components/icons/PencilAltIcon';
import { BotIcon } from '../components/icons/BotIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { HighlightIcon } from '../components/icons/HighlightIcon';
import { EraserIcon } from '../components/icons/EraserIcon';

const FONT_SIZES = [ 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl' ];

function TakeExamScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { exams, dispatch } = useExam();
    const { bookmarks, dispatch: bookmarkDispatch } = useBookmarks();
    const { questionHighlights, dispatch: highlightDispatch } = useHighlights();
    const { addToast } = useToasts();
    
    const exam = useMemo(() => exams.find(e => e.id === id), [exams, id]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [sessionAnswers, setSessionAnswers] = useState<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([]);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [fontSizeIdx, setFontSizeIdx] = useState(1); // Default to 'text-lg'

    const questionRef = useRef<HTMLDivElement>(null);
    const submittedRef = useRef(false);

    useEffect(() => {
        if (exam && timeLeft === 0) setTimeLeft(exam.questions.length * 60);
    }, [exam]);

    useEffect(() => {
        if (!exam || submittedRef.current || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [exam, timeLeft]);

    const handleFinishExam = (source: 'manual' | 'auto' = 'manual') => {
        if (submittedRef.current || !exam) return;
        submittedRef.current = true;
        const totalQuestions = exam.questions.length;
        const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
        const result: ExamResult = { 
            examId: exam.id, 
            score: totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0, 
            answers: sessionAnswers.map(({ questionId, answer }) => ({ questionId, answer })), 
            submittedAt: new Date().toISOString() 
        };
        dispatch({ type: ExamActionType.ADD_RESULT, payload: result });
        addToast("Exam finalized and saved.", "success", "Mission Accomplished");
        navigate(`/results/${exam.id}`, { replace: true });
    };

    const currentQuestion: Question | undefined = exam?.questions[currentQuestionIndex];

    const handleCheckAnswer = async () => {
        if (!selectedOption || !currentQuestion) return;
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        if (sessionAnswers.some(a => a.questionId === currentQuestion.id)) return;
        setSessionAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: selectedOption, isCorrect }]);
    };

    const handleAskAIExplanation = async () => {
        if (!selectedOption || !currentQuestion) return;
        setIsFetchingExplanation(true);
        setExplanation(null);
        try {
            const result = await getExplanationForAnswer(currentQuestion.questionText, selectedOption, currentQuestion.correctAnswer);
            setExplanation(result);
        } catch (error) { 
            setExplanation("Dr. Zayn encountered a processing delay. Please try again."); 
        } finally { 
            setIsFetchingExplanation(false); 
        }
    };
    
    const goToNext = () => {
        if (exam && currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setExplanation(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleToggleBookmark = () => {
        if (!currentQuestion || !exam) return;
        const isB = bookmarks.some(b => b.questionId === currentQuestion.id);
        if (isB) bookmarkDispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId: currentQuestion.id } });
        else bookmarkDispatch({ type: BookmarksActionType.ADD_BOOKMARK, payload: { examId: exam.id, questionId: currentQuestion.id } });
    };

    const handleManualHighlight = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return;
        const range = selection.getRangeAt(0);
        if (questionRef.current && questionRef.current.contains(range.commonAncestorContainer)) {
            try {
                const mark = document.createElement('mark');
                mark.className = 'highlight-yellow';
                range.surroundContents(mark);
                highlightDispatch({ 
                    type: HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION, 
                    payload: { questionId: currentQuestion!.id, highlightedHtml: questionRef.current.innerHTML } 
                });
            } catch (e) {
                addToast("Try selecting a simpler text range.", "info", "Overlap Detected");
            }
            selection.removeAllRanges();
        }
    };

    const clearHighlights = () => {
        if (currentQuestion) {
            highlightDispatch({ type: HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION, payload: { questionId: currentQuestion.id } });
        }
    };

    if (!exam || !currentQuestion) return <Loader text="Synchronizing Exam Data..." />;

    const currentQuestionAnswer = sessionAnswers.find(a => a.questionId === currentQuestion.id);
    const isAnswered = !!currentQuestionAnswer;
    const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);
    const storedHighlight = questionHighlights.find(h => h.questionId === currentQuestion.id);
    const letters = ['A', 'B', 'C', 'D', 'E'];

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-slate-900 overflow-hidden" dir="ltr">
            {/* Header */}
            <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30 h-16">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-xl transition-all ${isSidebarOpen ? 'bg-primary-100 text-primary-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                        <h1 className="font-black text-xs md:text-sm text-slate-900 dark:text-white uppercase tracking-[0.2em] hidden sm:block">Item {currentQuestionIndex + 1} of {exam.questions.length}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                            <button onClick={() => setFontSizeIdx(Math.max(0, fontSizeIdx - 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-black">A-</button>
                            <span className="w-8 text-center text-[10px] font-black uppercase text-slate-400">Size</span>
                            <button onClick={() => setFontSizeIdx(Math.min(FONT_SIZES.length - 1, fontSizeIdx + 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-black">A+</button>
                        </div>
                        <div className={`flex items-center gap-2 font-black tabular-nums ${timeLeft <= 60 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                            <ClockIcon className="w-5 h-5"/><span className="text-sm">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                        </div>
                        <Button onClick={() => handleFinishExam('manual')} size="sm" variant="danger" className="text-[10px] font-black rounded-lg h-9 px-4 uppercase tracking-widest">Submit</Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden relative">
                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 ${!isSidebarOpen ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'md:w-72 opacity-100'} flex-shrink-0 shadow-2xl`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{exam.title}</h2>
                        <div className="mt-6">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-2">
                                <span>Progress</span>
                                <span>{Math.round((sessionAnswers.length / exam.questions.length) * 100)}%</span>
                            </div>
                            <div className="flex-grow bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary-500 h-full transition-all duration-700" style={{ width: `${(sessionAnswers.length / exam.questions.length) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                        <div className="grid grid-cols-5 gap-2">
                            {exam.questions.map((q, idx) => {
                                const ans = sessionAnswers.find(a => a.questionId === q.id);
                                return <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${idx === currentQuestionIndex ? 'bg-primary-600 text-white ring-4 ring-primary-500/20 shadow-lg scale-110' : ans ? (ans.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}>{idx + 1}</button>;
                            })}
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow flex flex-col overflow-hidden bg-slate-50 dark:bg-[#020617] transition-all duration-500">
                    <div className="flex-grow p-4 md:p-12 overflow-y-auto">
                        <div className={`mx-auto transition-all duration-500 ${isSidebarOpen ? 'max-w-4xl' : 'max-w-5xl'}`}>
                            <Card className="border-none shadow-2xl p-8 md:p-16 rounded-[3.5rem] bg-white dark:bg-slate-900 relative">
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">Medical Inquiry</span>
                                        <button onClick={handleManualHighlight} className="p-2 hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 rounded-xl transition-all" title="Highlight Selection"><HighlightIcon className="w-5 h-5"/></button>
                                        <button onClick={clearHighlights} className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition-all" title="Clear Highlights"><EraserIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleToggleBookmark} className={`p-3 rounded-2xl transition-all shadow-sm ${isBookmarked ? 'bg-amber-100 text-amber-600 scale-110 rotate-3' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><BookmarkIcon solid={isBookmarked} className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                
                                <div 
                                    ref={questionRef}
                                    className={`mb-12 text-slate-900 dark:text-white font-black leading-relaxed tracking-tight ${FONT_SIZES[fontSizeIdx]}`}
                                    dangerouslySetInnerHTML={{ __html: storedHighlight ? storedHighlight.highlightedHtml : currentQuestion.questionText }}
                                />

                                <div className="space-y-4">
                                    {currentQuestion.options.map((option, index) => {
                                        const isSelected = selectedOption === option;
                                        const isCorrect = option === currentQuestion.correctAnswer;
                                        const isUserSelection = option === currentQuestionAnswer?.answer;
                                        let style = "bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300";
                                        if (isAnswered) {
                                            if (isCorrect) style = "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md scale-[1.02]";
                                            else if (isUserSelection) style = "bg-rose-50 dark:bg-rose-900/10 border-rose-500 text-rose-900 dark:text-rose-100";
                                            else style = "opacity-30 grayscale-[70%]";
                                        } else if (isSelected) style = "bg-primary-50 dark:bg-primary-900/10 border-primary-500 text-primary-900 dark:text-primary-100 ring-4 ring-primary-500/10";
                                        return (
                                            <button key={index} onClick={() => !isAnswered && setSelectedOption(option)} disabled={isAnswered} className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between group ${style}`}>
                                                <div className="flex items-center gap-5">
                                                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border transition-all ${isSelected || (isAnswered && isUserSelection) ? 'bg-primary-600 border-primary-700 text-white shadow-lg' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'}`}>{letters[index]}</span>
                                                    <span className={`font-bold leading-snug ${FONT_SIZES[Math.max(0, fontSizeIdx - 1)]}`}>{option}</span>
                                                </div>
                                                <div className="flex items-center gap-3">{isAnswered && isCorrect && <CheckIcon className="w-7 h-7 text-emerald-500" />}{isAnswered && isUserSelection && !isCorrect && <XIcon className="w-7 h-7 text-rose-500" />}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {isAnswered && (
                                    <div className="mt-14 animate-fade-in space-y-6">
                                        {!isFetchingExplanation && !explanation ? (
                                            <div className="flex justify-center pt-4">
                                                <button onClick={handleAskAIExplanation} className="group relative flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                                    <div className="relative">
                                                        <BotIcon className="w-6 h-6" />
                                                        <SparklesIcon className="absolute -top-2 -right-2 w-4 h-4 text-amber-400 animate-pulse" />
                                                    </div>
                                                    Request Professor's Insight
                                                </button>
                                            </div>
                                        ) : isFetchingExplanation ? (
                                            <div className="p-10 flex justify-center"><Loader text="Dr. Zayn is reviewing your logic..." /></div>
                                        ) : (
                                            <div className="relative p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px]"></div>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-primary-600 rounded-2xl shadow-xl"><BotIcon className="w-6 h-6 text-white" /></div>
                                                    <div>
                                                        <h4 className="font-black text-primary-400 uppercase text-[10px] tracking-[0.4em]">Zayn Academia Response</h4>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Concise Academic Logic</p>
                                                    </div>
                                                </div>
                                                <div className="text-base md:text-lg leading-relaxed font-bold text-slate-300 italic">
                                                    "{explanation}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    <div className="flex-shrink-0 p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-20">
                         <div className={`mx-auto flex justify-between items-center gap-8 ${isSidebarOpen ? 'max-w-4xl' : 'max-w-5xl'}`}>
                            <Button variant="secondary" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0} className="rounded-[1.5rem] px-10 h-16 font-black uppercase text-[10px] tracking-widest border-slate-200 shadow-sm">Back</Button>
                            {!isAnswered ? (
                                <Button onClick={handleCheckAnswer} disabled={!selectedOption} size="lg" className="px-16 h-16 rounded-[1.5rem] shadow-2xl shadow-primary-500/40 font-black uppercase text-xs tracking-[0.2em] transform hover:scale-105 active:scale-95">Check Logic</Button>
                            ) : (
                                currentQuestionIndex < exam.questions.length - 1 ? (
                                    <Button onClick={goToNext} size="lg" className="px-16 h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-500/30 font-black uppercase text-xs tracking-[0.2em] transform hover:scale-105 active:scale-95">Next Segment</Button>
                                ) : (
                                    <Button onClick={() => handleFinishExam('manual')} size="lg" className="bg-primary-600 hover:bg-primary-500 px-16 h-16 rounded-[1.5rem] shadow-2xl shadow-primary-500/40 font-black uppercase text-xs tracking-[0.2em] transform hover:scale-105 active:scale-95">Complete Exam</Button>
                                )
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default TakeExamScreen;
