import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, ExamResult, Question, BookmarksActionType, NotesActionType, HighlightsActionType } from '../types';
import Button from '../components/Button';
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
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setIsMoreOptionsOpen(false);
            }
            if (highlighterRef.current && !highlighterRef.current.contains(event.target as Node)) {
                setIsHighlighterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [optionsMenuRef, highlighterRef]);
    
    useEffect(() => {
        if (!exam || submittedRef.current) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!submittedRef.current) {
                        handleFinishExam('auto'); 
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam]);

    const handleQuit = () => {
        if (sessionAnswers.length > 0) {
            if (window.confirm('Are you sure you want to quit? Your progress for this attempt will be lost.')) {
                navigate('/');
            }
        } else {
            navigate('/');
        }
    };

    if (!exam) {
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Exam Not Found</h2><Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button></div>;
    }

    const currentQuestion: Question = exam.questions[currentQuestionIndex];
    const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);
    const currentQuestionAnswer = sessionAnswers.find(a => a.questionId === currentQuestion.id);
    const questionStatus = currentQuestionAnswer ? 'answered' : 'unanswered';
    const currentNote = notes.find(n => n.questionId === currentQuestion.id)?.text || '';
    const currentHighlight = questionHighlights.find(h => h.questionId === currentQuestion.id);
    const questionHtml = currentHighlight ? currentHighlight.highlightedHtml : currentQuestion.questionText;

    const handleNoteChange = (text: string) => {
        notesDispatch({
            type: NotesActionType.SET_NOTE,
            payload: {
                examId: exam.id,
                questionId: currentQuestion.id,
                text: text
            }
        });
    };

    const filteredQuestions = useMemo(() => {
        if (!searchTerm) return exam.questions.map((q, i) => ({ ...q, originalIndex: i }));
        return exam.questions
            .map((q, i) => ({ ...q, originalIndex: i }))
            .filter(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [exam.questions, searchTerm]);

    const applyHighlight = (color: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            addToast("Please select text first to highlight.", "info", "Highlighter");
            return;
        }

        const range = selection.getRangeAt(0);
        const questionContainer = questionTextRef.current;
        if (!questionContainer || !questionContainer.contains(range.commonAncestorContainer)) {
            selection.removeAllRanges();
            return;
        }

        const mark = document.createElement('mark');
        mark.className = `highlight-${color}`;

        try {
            range.surroundContents(mark);
            
            const newHtml = questionContainer.innerHTML;
            highlightDispatch({
                type: HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION,
                payload: { questionId: currentQuestion.id, highlightedHtml: newHtml }
            });
        } catch (e) {
            console.error("Highlighting error:", e);
            addToast("Highlighting failed. Try selecting text within a single paragraph.", "error", "Error");
        } finally {
            selection.removeAllRanges();
            setIsHighlighterOpen(false);
        }
    };
    
    const clearHighlights = () => {
        highlightDispatch({
            type: HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION,
            payload: { questionId: currentQuestion.id }
        });
        addToast("Highlights cleared for this question.", "info", "Cleared");
        setIsHighlighterOpen(false);
    };


    const handleCheckAnswer = async () => {
        if (!selectedOption) return;
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        
        setSessionAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: selectedOption, isCorrect }]);

        // Generate dummy percentages for realism
        const correctIndex = currentQuestion.options.findIndex(opt => opt === currentQuestion.correctAnswer);
        let percentages = new Array(currentQuestion.options.length).fill(0);
        let remaining = 100;
        const correctPercent = 40 + Math.floor(Math.random() * 40); // 40-79%
        percentages[correctIndex] = correctPercent;
        remaining -= correctPercent;
        
        for (let i = 0; i < percentages.length; i++) {
            if (i === correctIndex) continue;
            const lastIncorrect = i === percentages.lastIndexOf(0);
            if(lastIncorrect) {
                 percentages[i] = remaining;
            } else {
                const randomPart = Math.floor(Math.random() * (remaining / 2));
                percentages[i] = randomPart;
                remaining -= randomPart;
            }
        }
        setOptionPercentages(percentages);

        if (!isCorrect) {
            // No longer auto-fetches explanation, waits for button click
        }
    };

    const handleAskAIExplanation = async () => {
        if (!selectedOption) return;
        setIsFetchingExplanation(true);
        setExplanation(null);
        try {
            const result = await getExplanationForAnswer(currentQuestion.questionText, selectedOption, currentQuestion.correctAnswer);
            setExplanation(result);
        } catch (error) {
            setExplanation("Could not fetch explanation.");
        } finally {
            setIsFetchingExplanation(false);
        }
    };
    
    const goToNext = () => {
        const nextUnansweredIndex = exam.questions.findIndex((q, index) => index > currentQuestionIndex && !sessionAnswers.some(a => a.questionId === q.id));
        
        if (nextUnansweredIndex !== -1) {
            setCurrentQuestionIndex(nextUnansweredIndex);
        } else if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            const firstUnanswered = exam.questions.findIndex(q => !sessionAnswers.some(a => a.questionId === q.id));
            if (firstUnanswered !== -1) {
                setCurrentQuestionIndex(firstUnanswered);
            } else if (currentQuestionIndex < exam.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
        }
        setSelectedOption(null);
        setExplanation(null);
        setOptionPercentages([]);
        setShowNotes(false);
    };

    const handleFinishExam = (source: 'manual' | 'auto' = 'manual') => {
        if (submittedRef.current) return;
        
        submittedRef.current = true;
        const totalQuestions = exam.questions.length;
        const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
        
        const result: ExamResult = {
            examId: exam.id,
            score: totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0,
            answers: sessionAnswers.map(({ questionId, answer }) => ({ questionId, answer })),
            submittedAt: new Date().toISOString(),
        };

        dispatch({ type: ExamActionType.ADD_RESULT, payload: result });
        
        navigate(`/results/${exam.id}`, { replace: true });
    };

    const getOptionState = (option: string) => {
        if (questionStatus === 'unanswered') {
            return { state: 'default' as const };
        }
        const isCorrectAnswer = option === currentQuestion.correctAnswer;
        const isSelectedAnswer = option === currentQuestionAnswer?.answer;

        if (isCorrectAnswer) return { state: 'correct' as const };
        if (isSelectedAnswer) return { state: 'incorrect' as const };
        return { state: 'disabled' as const };
    };
    
    const handleToggleBookmark = () => {
        if (isBookmarked) {
            bookmarkDispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId: currentQuestion.id } });
            addToast('Bookmark removed', 'info', 'Removed');
        } else {
            bookmarkDispatch({ type: BookmarksActionType.ADD_BOOKMARK, payload: { examId: exam.id, questionId: currentQuestion.id } });
            addToast('Question bookmarked!', 'success', 'Saved');
        }
    };
    
    const handleToggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => console.error(err));
        } else {
            document.exitFullscreen().then(() => setIsFullScreen(false));
        }
    };
    
    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            addToast('Exam link copied to clipboard!', 'success', 'Link Copied');
        });
    };

    const handleFeedback = (type: 'good' | 'bad') => {
        addToast(`Thanks for your feedback!`, 'success', 'Feedback Submitted');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const Sidebar = () => (
        <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl text-slate-800 dark:text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-full flex-shrink-0 shadow-xl`}>
            <div className="p-4 border-b border-white/20 dark:border-slate-700/50 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg truncate pr-2 text-slate-900 dark:text-white">{exam.title}</h2>
                    <button onClick={handleQuit} className="p-1 text-slate-500 dark:text-slate-300 hover:text-red-500 hover:bg-white/20 dark:hover:bg-white/10 rounded" title="Quit Exam"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tutor Mode</p>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(sessionAnswers.length / exam.questions.length) * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap text-slate-700 dark:text-slate-200">{sessionAnswers.length}/{exam.questions.length}</span>
                </div>
                <div className="relative mt-4">
                    <input type="text" placeholder="Search Questions" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/20 dark:bg-slate-700/50 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400" />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400"/>
                </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                    {filteredQuestions.map(q => {
                        const answer = sessionAnswers.find(a => a.questionId === q.id);
                        const isBookmarkedFlag = bookmarks.some(b => b.questionId === q.id);
                        const isSelected = q.originalIndex === currentQuestionIndex;
                        return (
                            <li key={q.id}>
                                <button onClick={() => setCurrentQuestionIndex(q.originalIndex)} className={`w-full text-left p-2 rounded-md flex items-start gap-3 transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/10'}`}>
                                    <div className="flex-shrink-0 flex items-center gap-1 min-w-[24px]">
                                        <span className={`font-semibold text-sm`}>{q.originalIndex + 1}</span>
                                        {isBookmarkedFlag && <BookmarkIcon solid className="w-3 h-3 text-yellow-400" />}
                                    </div>
                                    <span className="flex-grow text-sm truncate">{q.questionText}</span>
                                    {answer && (answer.isCorrect ? <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />)}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>
            
            <div className="p-4 border-t border-white/20 dark:border-slate-700/50 flex-shrink-0 bg-white/40 dark:bg-transparent">
                <Button variant="primary" className="w-full justify-center !bg-green-600 hover:!bg-green-700" onClick={() => handleFinishExam('manual')}>
                    Finish & Submit
                </Button>
            </div>
        </aside>
    );

    const letters = ['A', 'B', 'C', 'D', 'E'];

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col">
            <header className="flex-shrink-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border-b border-white/30 dark:border-slate-700/50 z-30 relative">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 rounded-full hover:bg-white/20 dark:hover:bg-white/10"><MenuIcon className="w-6 h-6"/></button>
                        <button onClick={handleShare} className="p-2 text-slate-500 rounded-full hover:bg-white/20 dark:hover:bg-white/10" title="Share Exam"><ShareIcon className="w-5 h-5"/></button>
                        <span className="hidden md:block text-slate-300 dark:text-slate-600 mx-2">|</span>
                        <h1 className="font-bold text-lg truncate text-slate-800 dark:text-slate-100">Question {currentQuestionIndex + 1} of {exam.questions.length}</h1>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-4 text-slate-500 flex-shrink-0 ml-2">
                        <div className={`flex items-center gap-1 font-semibold tabular-nums mr-2 ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            <ClockIcon className="w-5 h-5"/><span className="text-sm">{formatTime(timeLeft)}</span>
                        </div>
                        
                        <Button onClick={() => handleFinishExam('manual')} size="sm" className="!bg-green-600 hover:!bg-green-700 flex items-center">
                            Finish
                        </Button>

                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-700/50 rounded-md p-0.5">
                            <button onClick={() => setFontScaleIndex(p => Math.max(p-1, 0))} className="px-1.5 py-0.5 rounded hover:bg-white/20 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200" aria-label="Decrease font size">A-</button>
                            <button onClick={() => setFontScaleIndex(p => Math.min(p+1, FONT_SIZES.length-1))} className="px-1.5 py-0.5 rounded hover:bg-white/20 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200" aria-label="Increase font size">A+</button>
                        </div>
                        <button onClick={handleToggleFullScreen} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10" title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}><ExpandIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden relative">
                <Sidebar />
                
                {isSidebarOpen && (
                    <div className="absolute inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                )}

                <main className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow p-4 md:p-8 overflow-y-auto">
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 dark:border-slate-700/50 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Question {currentQuestionIndex + 1}</p>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div ref={highlighterRef} className="relative">
                                            <button onClick={() => setIsHighlighterOpen(p => !p)} className="p-1 rounded hover:bg-white/20 dark:hover:bg-white/10" title="Highlight text">
                                                <HighlightIcon className="w-5 h-5"/>
                                            </button>
                                            {isHighlighterOpen && (
                                                <div className="absolute top-full right-0 mt-2 p-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 rounded-lg shadow-xl z-50 flex items-center gap-2">
                                                    <button onClick={() => applyHighlight('yellow')} className="w-6 h-6 rounded-full bg-yellow-400/50 border border-slate-300 dark:border-slate-600" aria-label="Highlight yellow"></button>
                                                    <button onClick={() => applyHighlight('green')} className="w-6 h-6 rounded-full bg-green-400/50 border border-slate-300 dark:border-slate-600" aria-label="Highlight green"></button>
                                                    <button onClick={() => applyHighlight('pink')} className="w-6 h-6 rounded-full bg-pink-400/50 border border-slate-300 dark:border-slate-600" aria-label="Highlight pink"></button>
                                                    <button onClick={() => applyHighlight('blue')} className="w-6 h-6 rounded-full bg-blue-400/50 border border-slate-300 dark:border-slate-600" aria-label="Highlight blue"></button>
                                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                                    <button onClick={clearHighlights} className="p-1 text-slate-500" aria-label="Clear highlights"><EraserIcon className="w-5 h-5"/></button>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setShowNotes(prev => !prev)} className={`p-1 rounded transition-colors ${showNotes ? 'bg-primary-100/50 dark:bg-primary-900/50 text-primary-600' : 'hover:bg-white/20 dark:hover:bg-white/10'}`} title="Question Notes"><PencilAltIcon className="w-5 h-5" /></button>
                                        <button onClick={handleToggleBookmark} className="hover:text-yellow-500 transition-colors p-1 rounded hover:bg-white/20 dark:hover:bg-white/10" title="Bookmark Question"><BookmarkIcon solid={isBookmarked} className="w-5 h-5"/></button>
                                        <button onClick={() => handleFeedback('good')} className="hover:text-green-500 transition-colors p-1 rounded hover:bg-white/20 dark:hover:bg-white/10" title="Good question"><ThumbUpIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleFeedback('bad')} className="hover:text-red-500 transition-colors p-1 rounded hover:bg-white/20 dark:hover:bg-white/10" title="Bad question"><ThumbDownIcon className="w-5 h-5" /></button>
                                        <div ref={optionsMenuRef} className="relative">
                                            <button onClick={() => setIsMoreOptionsOpen(prev => !prev)} title="More options" className="p-1 rounded hover:bg-white/20 dark:hover:bg-white/10"><DotsVerticalIcon className="w-5 h-5" /></button>
                                            {isMoreOptionsOpen && (
                                                <div className="absolute top-full right-0 mt-2 w-48 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 rounded-lg shadow-xl py-1 z-50 overflow-hidden">
                                                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-white/10">Report an issue</a>
                                                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-white/10">Get Help</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div
                                    ref={questionTextRef}
                                    className={`mb-6 text-slate-800 dark:text-slate-100 font-medium leading-relaxed ${FONT_SIZES[fontScaleIndex]}`}
                                    dangerouslySetInnerHTML={{__html: questionHtml}}
                                />
                                
                                <p className="text-xs text-slate-400 mb-4 font-mono">QID: {currentQuestion.id.slice(0, 8)}</p>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => {
                                        const { state } = getOptionState(option);
                                        const isSelected = selectedOption === option;
                                        
                                        const baseClasses = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group";
                                        
                                        let stateClasses = "";
                                        if (state === 'default') {
                                            stateClasses = `bg-white/30 dark:bg-slate-800/30 border-white/40 dark:border-slate-600/50 hover:border-primary-500/50 hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 ${isSelected ? 'border-primary-600 ring-2 ring-primary-500/20 bg-primary-50/50 dark:bg-primary-900/30' : ''}`;
                                        } else if (state === 'correct') {
                                            stateClasses = "bg-green-500/20 border-green-500/50 text-green-800 dark:text-green-200 cursor-default";
                                        } else if (state === 'incorrect') {
                                            stateClasses = "bg-red-500/20 border-red-500/50 text-red-800 dark:text-red-200 cursor-default";
                                        } else if (state === 'disabled') {
                                            stateClasses = "bg-slate-500/10 dark:bg-slate-800/20 border-slate-500/20 text-slate-500 dark:text-slate-500 opacity-70 cursor-default";
                                        }

                                        return (
                                            <button key={index} onClick={() => questionStatus === 'unanswered' && setSelectedOption(option)} disabled={questionStatus === 'answered'} className={`${baseClasses} ${stateClasses}`}>
                                                <div className="flex items-center">
                                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 font-bold text-sm border ${state === 'correct' ? 'bg-green-200 border-green-300 text-green-800' : state === 'incorrect' ? 'bg-red-200 border-red-300 text-red-800' : isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-slate-100/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 text-slate-500 dark:text-slate-400'}`}>
                                                        {letters[index]}
                                                    </span>
                                                    <span className="font-medium">{option}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {questionStatus === 'answered' && (
                                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">({optionPercentages[index]}%)</span>
                                                    )}
                                                    {state === 'correct' && <CheckIcon className="w-6 h-6 text-green-600" />}
                                                    {state === 'incorrect' && <XIcon className="w-6 h-6 text-red-600" />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                                
                                {showNotes && (
                                    <div className="mt-6 animate-fade-in">
                                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Notes</label>
                                        <textarea
                                            id="notes"
                                            rows={4}
                                            className="w-full p-3 border border-white/20 dark:border-slate-700/50 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white/20 dark:bg-slate-900/40 backdrop-blur-lg"
                                            placeholder="Jot down your thoughts on this question..."
                                            value={currentNote}
                                            onChange={(e) => handleNoteChange(e.target.value)}
                                        />
                                    </div>
                                )}

                                {questionStatus === 'answered' && currentQuestionAnswer?.isCorrect === false && (
                                    <div className="mt-6 animate-fade-in">
                                        {isFetchingExplanation ? (
                                            <div className="flex justify-center p-4"><Loader text="AI is analyzing..." /></div>
                                        ) : explanation ? (
                                            <div className="p-5 bg-amber-500/10 dark:bg-amber-900/20 border-2 border-amber-500/20 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 rounded-xl">
                                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                                    <FlaskIcon className="w-5 h-5"/> AI Explanation
                                                </h4>
                                                <div className="text-sm leading-relaxed prose prose-sm max-w-none text-amber-800 dark:text-amber-100" dangerouslySetInnerHTML={{ __html: explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Button onClick={handleAskAIExplanation} variant="secondary">
                                                    <FlaskIcon className="w-5 h-5 mr-2" />
                                                    Ask AI for Explanation
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Sticky Footer for Actions */}
                    <div className="flex-shrink-0 p-4 bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg border-t border-white/30 dark:border-slate-700/50">
                         <div className="max-w-3xl mx-auto flex justify-between items-center">
                            <Button variant="secondary" onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}>
                                <ChevronLeftIcon className="w-5 h-5 mr-1"/> Previous
                            </Button>
                            
                            {questionStatus === 'unanswered' && (
                                <Button onClick={handleCheckAnswer} disabled={!selectedOption} size="lg" className="px-8 shadow-lg shadow-primary-500/30">
                                    Check Answer
                                </Button>
                            )}
                            
                            {questionStatus === 'answered' && (
                                currentQuestionIndex < exam.questions.length - 1 ? (
                                    <Button onClick={goToNext} size="lg" className="px-8">
                                        Next Question <ChevronRightIcon className="w-5 h-5 ml-1"/>
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleFinishExam('manual')} size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30">
                                        Finish Exam <CheckCircleIcon className="w-5 h-5 ml-1"/>
                                    </Button>
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