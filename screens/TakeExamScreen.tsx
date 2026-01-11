
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, ExamResult, Question, BookmarksActionType, NotesActionType, HighlightsActionType } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';
import { useBookmarks } from '../hooks/useBookmarks';
import { useToasts } from '../context/ToastContext';
import { useNotes } from '../hooks/useNotes';
import { useHighlights } from '../hooks/useHighlights';

// Icons
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { MenuIcon } from '../components/icons/MenuIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { XIcon } from '../components/icons/XIcon';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { ThumbUpIcon } from '../components/icons/ThumbUpIcon';
import { ThumbDownIcon } from '../components/icons/ThumbDownIcon';
import { DotsVerticalIcon } from '../components/icons/DotsVerticalIcon';
import { FlaskIcon } from '../components/icons/FlaskIcon';
import { ExpandIcon } from '../components/icons/ExpandIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { PencilAltIcon } from '../components/icons/PencilAltIcon';
import { HighlightIcon } from '../components/icons/HighlightIcon';
import { EraserIcon } from '../components/icons/EraserIcon';
import { BotIcon } from '../components/icons/BotIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';

const FONT_SIZES = [ 'text-base', 'text-lg', 'text-xl', 'text-2xl' ];

function TakeExamScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { exams, dispatch } = useExam();
    const { bookmarks, dispatch: bookmarkDispatch } = useBookmarks();
    const { notes, dispatch: notesDispatch } = useNotes();
    const { questionHighlights, dispatch: highlightDispatch } = useHighlights();
    const { addToast } = useToasts();
    
    const exam = exams.find(e => e.id === id);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [sessionAnswers, setSessionAnswers] = useState<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([]);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);
    const [timeLeft, setTimeLeft] = useState(exam ? exam.questions.length * 60 : 0);
    const [fontScaleIndex, setFontScaleIndex] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
    const [optionPercentages, setOptionPercentages] = useState<number[]>([]);
    const [showNotes, setShowNotes] = useState(false);
    const [isHighlighterOpen, setIsHighlighterOpen] = useState(false);

    const submittedRef = useRef(false);
    const optionsMenuRef = useRef<HTMLDivElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const questionTextRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) { setIsMoreOptionsOpen(false); }
            if (highlighterRef.current && !highlighterRef.current.contains(event.target as Node)) { setIsHighlighterOpen(false); }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);
    
    useEffect(() => {
        if (!exam || submittedRef.current) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!submittedRef.current) handleFinishExam('auto'); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam]);

    const handleQuit = () => {
        if (sessionAnswers.length > 0) {
            if (window.confirm('Are you sure? Current progress will be lost.')) navigate('/');
        } else { navigate('/'); }
    };

    if (!exam) return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Exam Not Found</h2><Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button></div>;

    const currentQuestion: Question = exam.questions[currentQuestionIndex];
    const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);
    const currentQuestionAnswer = sessionAnswers.find(a => a.questionId === currentQuestion.id);
    const questionStatus = currentQuestionAnswer ? 'answered' : 'unanswered';
    const currentNote = notes.find(n => n.questionId === currentQuestion.id)?.text || '';
    const currentHighlight = questionHighlights.find(h => h.questionId === currentQuestion.id);
    const questionHtml = currentHighlight ? currentHighlight.highlightedHtml : currentQuestion.questionText;

    const handleNoteChange = (text: string) => {
        notesDispatch({ type: NotesActionType.SET_NOTE, payload: { examId: exam.id, questionId: currentQuestion.id, text } });
    };

    const filteredQuestions = useMemo(() => {
        if (!searchTerm) return exam.questions.map((q, i) => ({ ...q, originalIndex: i }));
        return exam.questions.map((q, i) => ({ ...q, originalIndex: i })).filter(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [exam.questions, searchTerm]);

    const handleCheckAnswer = async () => {
        if (!selectedOption) return;
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        setSessionAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: selectedOption, isCorrect }]);
    };

    const handleAskAIExplanation = async () => {
        if (!selectedOption) return;
        setIsFetchingExplanation(true);
        setExplanation(null);
        try {
            const result = await getExplanationForAnswer(currentQuestion.questionText, selectedOption, currentQuestion.correctAnswer);
            setExplanation(result);
        } catch (error) { setExplanation("Sorry, an error occurred while fetching the explanation. Please try again."); } finally { setIsFetchingExplanation(false); }
    };
    
    const goToNext = () => {
        if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setExplanation(null);
        setShowNotes(false);
    };

    const handleFinishExam = (source: 'manual' | 'auto' = 'manual') => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        const totalQuestions = exam.questions.length;
        const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
        const result: ExamResult = { examId: exam.id, score: totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0, answers: sessionAnswers.map(({ questionId, answer }) => ({ questionId, answer })), submittedAt: new Date().toISOString() };
        dispatch({ type: ExamActionType.ADD_RESULT, payload: result });
        navigate(`/results/${exam.id}`, { replace: true });
    };

    const handleToggleBookmark = () => {
        if (!exam) return;
        if (isBookmarked) {
            bookmarkDispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId: currentQuestion.id } });
        } else {
            bookmarkDispatch({ type: BookmarksActionType.ADD_BOOKMARK, payload: { examId: exam.id, questionId: currentQuestion.id } });
        }
    };

    const Sidebar = () => (
        <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-full flex-shrink-0 shadow-lg`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="font-black text-lg truncate pr-2 text-slate-900 dark:text-white">{exam.title}</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-500 hover:text-red-500"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary-500 h-full transition-all duration-300" style={{ width: `${(sessionAnswers.length / exam.questions.length) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-black">{sessionAnswers.length}/{exam.questions.length}</span>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                <ul className="space-y-1">
                    {filteredQuestions.map(q => {
                        const answer = sessionAnswers.find(a => a.questionId === q.id);
                        const isSelected = q.originalIndex === currentQuestionIndex;
                        return (
                            <li key={q.id}>
                                <button onClick={() => setCurrentQuestionIndex(q.originalIndex)} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${isSelected ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <span className="text-xs font-black">{q.originalIndex + 1}</span>
                                    <span className="flex-grow text-xs font-bold truncate">{q.questionText}</span>
                                    {answer && (answer.isCorrect ? <CheckIcon className="w-4 h-4 text-green-500" /> : <XIcon className="w-4 h-4 text-red-500" />)}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    );

    const letters = ['A', 'B', 'C', 'D', 'E'];

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-slate-900" dir="ltr">
            <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30 relative h-16">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><MenuIcon className="w-6 h-6"/></button>
                        <h1 className="font-black text-sm md:text-lg text-slate-900 dark:text-white uppercase tracking-tight">Question {currentQuestionIndex + 1} of {exam.questions.length}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 font-black tabular-nums ${timeLeft <= 60 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                            <ClockIcon className="w-5 h-5"/><span className="text-sm">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                        </div>
                        <Button onClick={() => handleFinishExam('manual')} size="sm" className="!bg-emerald-600 hover:!bg-emerald-500 text-xs font-black rounded-lg h-9">Finish Exam</Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden relative">
                <Sidebar />
                <main className="flex-grow flex flex-col overflow-hidden bg-slate-50 dark:bg-black">
                    <div className="flex-grow p-4 md:p-10 overflow-y-auto">
                        <div className="max-w-3xl mx-auto pb-20">
                            <Card className="border-none shadow-2xl p-6 md:p-12 rounded-[2.5rem] bg-white dark:bg-slate-900">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                                    <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Question Analysis</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-xl transition-all ${showNotes ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-slate-50'}`}><PencilAltIcon className="w-5 h-5"/></button>
                                        <button onClick={handleToggleBookmark} className={`p-2 rounded-xl transition-all ${isBookmarked ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}><BookmarkIcon solid={isBookmarked} className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                
                                <div ref={questionTextRef} className={`mb-10 text-slate-900 dark:text-white font-black leading-relaxed ${FONT_SIZES[fontScaleIndex]}`} dangerouslySetInnerHTML={{__html: questionHtml}} />

                                <div className="space-y-4">
                                    {currentQuestion.options.map((option, index) => {
                                        const isAnswered = !!currentQuestionAnswer;
                                        const isCorrect = option === currentQuestion.correctAnswer;
                                        const isUserSelection = option === currentQuestionAnswer?.answer;
                                        const isSelected = selectedOption === option;

                                        let style = "bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300";
                                        if (isAnswered) {
                                            if (isCorrect) style = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md scale-[1.02]";
                                            else if (isUserSelection) style = "bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-900 dark:text-rose-100 opacity-100";
                                            else style = "opacity-40 grayscale-[50%]";
                                        } else if (isSelected) {
                                            style = "bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20";
                                        }

                                        return (
                                            <button key={index} onClick={() => !isAnswered && setSelectedOption(option)} disabled={isAnswered} className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center justify-between group ${style}`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border transition-all ${isSelected || (isAnswered && isUserSelection) ? 'bg-primary-600 border-primary-700 text-white' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'}`}>
                                                        {letters[index]}
                                                    </span>
                                                    <span className="font-bold text-lg">{option}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isAnswered && isCorrect && <CheckIcon className="w-6 h-6 text-emerald-500" />}
                                                    {isAnswered && isUserSelection && !isCorrect && <XIcon className="w-6 h-6 text-rose-500" />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                {!!currentQuestionAnswer && (
                                    <div className="mt-10 animate-fade-in space-y-6">
                                        {!currentQuestionAnswer.isCorrect && (
                                            <>
                                                {isFetchingExplanation ? (
                                                    <div className="p-8 flex justify-center"><Loader text="Dr. Zayn is reviewing your answer..." /></div>
                                                ) : explanation ? (
                                                    <div className="relative p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl"></div>
                                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl z-10 group-hover:scale-110 transition-transform">
                                                            <BotIcon className="w-7 h-7 text-white" />
                                                        </div>
                                                        <h4 className="font-black mb-4 text-primary-400 flex items-center gap-2 relative z-10">
                                                            <SparklesIcon className="w-5 h-5" />
                                                            Dr. Zayn's Explanation
                                                        </h4>
                                                        <div className="text-sm leading-relaxed font-bold text-slate-300 relative z-10 prose prose-invert max-w-none">
                                                            {explanation}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <Button onClick={handleAskAIExplanation} variant="secondary" className="rounded-2xl border-slate-200 h-14 px-8 shadow-lg hover:shadow-xl transition-all">
                                                            <FlaskIcon className="w-6 h-6 mr-3 text-primary-500" />
                                                            <span className="font-black uppercase tracking-widest text-xs">Ask for AI Explanation</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        
                                        {currentQuestionAnswer.isCorrect && !explanation && (
                                            <div className="flex justify-center">
                                                <button onClick={handleAskAIExplanation} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary-500 transition-colors">
                                                    Want to know why this is correct? Ask Dr. Zayn
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                    <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-xl z-20">
                         <div className="max-w-3xl mx-auto flex justify-between items-center">
                            <Button variant="secondary" onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="rounded-xl px-6">Previous</Button>
                            {questionStatus === 'unanswered' ? (
                                <Button onClick={handleCheckAnswer} disabled={!selectedOption} size="lg" className="px-10 rounded-xl shadow-lg shadow-primary-500/30">Check Answer</Button>
                            ) : (
                                currentQuestionIndex < exam.questions.length - 1 ? (
                                    <Button onClick={goToNext} size="lg" className="px-10 rounded-xl">Next Question</Button>
                                ) : (
                                    <Button onClick={() => handleFinishExam('manual')} size="lg" className="bg-emerald-600 hover:bg-emerald-500 px-10 rounded-xl shadow-lg shadow-emerald-500/30">Finish & Submit</Button>
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
