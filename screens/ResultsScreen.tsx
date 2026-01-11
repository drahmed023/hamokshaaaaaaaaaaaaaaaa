
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Button from '../components/Button';
import { GamificationActionType, Question, BookmarksActionType, NotesActionType } from '../types';
import { useGamification } from '../hooks/useGamification';
import { useBookmarks } from '../hooks/useBookmarks';
import { useNotes } from '../hooks/useNotes';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';
import ScoreRing from '../components/ScoreRing';
import jsPDF from 'jspdf';

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
import { SearchIcon } from '../components/icons/SearchIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { PencilAltIcon } from '../components/icons/PencilAltIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';

function Explanation({ question, userAnswer }: { question: Question; userAnswer: string | undefined }) {
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchExplanation = async () => {
        if (!userAnswer || !question) return;
        setIsLoading(true);
        try {
            const result = await getExplanationForAnswer(question.questionText, userAnswer, question.correctAnswer);
            setExplanation(result);
        } catch (error) {
            setExplanation("Could not fetch explanation.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader text="Getting AI explanation..." /></div>;
    }

    if (explanation) {
        return (
            <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-100 rounded-xl shadow-sm animate-fade-in">
                <h4 className="font-bold mb-2 flex items-center gap-2"><FlaskIcon className="w-4 h-4"/> Explanation</h4>
                <p className="text-sm leading-relaxed">{explanation}</p>
            </div>
        );
    }

    return (
        <div className="mt-6 flex justify-center">
          <Button onClick={fetchExplanation} size="sm" variant="secondary" className="shadow-sm border-slate-300 dark:border-slate-600">
              <FlaskIcon className="w-4 h-4 mr-2 text-amber-500"/>
              Ask AI for Explanation
          </Button>
        </div>
    );
};


function ResultsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results } = useExam();
  const { bookmarks, dispatch: bookmarkDispatch } = useBookmarks();
  const { notes, dispatch: notesDispatch } = useNotes();
  const { dispatch: gamificationDispatch } = useGamification();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const exam = exams.find(e => e.id === id);
  const result = results.find(r => r.examId === id);

  useEffect(() => {
    if (result) {
        const lastAwarded = sessionStorage.getItem(`xp_awarded_${result.examId}`);
        if(lastAwarded !== result.submittedAt) {
            const xpGained = Math.round(result.score);
            gamificationDispatch({ type: GamificationActionType.ADD_XP, payload: xpGained });
            if (results.length === 1) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'exam_1' });
            if (results.length >= 5) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'exam_5' });
            if (result.score === 100) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'score_100' });
            sessionStorage.setItem(`xp_awarded_${result.examId}`, result.submittedAt);
        }
    }
  }, [result, results.length, gamificationDispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
            setIsMoreOptionsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsMenuRef]);

  const filteredQuestions = useMemo(() => {
    if (!exam) return [];
    if (!searchTerm) return exam.questions.map((q, i) => ({ ...q, originalIndex: i }));
    return exam.questions
        .map((q, i) => ({ ...q, originalIndex: i }))
        .filter(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [exam, searchTerm]);


  if (!exam || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-8 text-center" dir="ltr">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
            <XCircleIcon className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Result Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">We couldn't locate the results for this exam. It might have been deleted or not saved correctly.</p>
        <Button onClick={() => navigate('/history')} className="">Back to History</Button>
      </div>
    );
  }

  const scorePercentage = Math.round(result.score);
  const totalQuestions = exam.questions.length;
  const correctAnswersCount = result.answers.filter(a => {
      const q = exam.questions.find(q => q.id === a.questionId);
      return q && q.correctAnswer === a.answer;
  }).length;
  const incorrectAnswersCount = result.answers.length - correctAnswersCount;
  const skippedCount = totalQuestions - result.answers.length;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Exam Report: ${exam.title}`, 10, 20);
    
    doc.setFontSize(12);
    doc.text(`Score: ${scorePercentage}%`, 10, 30);
    doc.text(`Correct: ${correctAnswersCount}, Incorrect: ${incorrectAnswersCount}, Skipped: ${skippedCount}`, 10, 38);

    let y = 50;
    exam.questions.forEach((q, index) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        const userAnswer = result.answers.find(a => a.questionId === q.id)?.answer || "Skipped";
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const questionLines = doc.splitTextToSize(`${index + 1}. ${q.questionText}`, 180);
        doc.text(questionLines, 10, y);
        y += (questionLines.length * 5) + 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        q.options.forEach(opt => {
            let prefix = '  ';
            if (opt === q.correctAnswer) {
                doc.setTextColor(0, 128, 0); // Green
                prefix = '✓ ';
            }
            if (opt === userAnswer && userAnswer !== q.correctAnswer) {
                doc.setTextColor(255, 0, 0); // Red
                prefix = '✗ ';
            }

            const optionLines = doc.splitTextToSize(`${prefix}${opt}`, 170);
            doc.text(optionLines, 15, y);
            y += (optionLines.length * 4) + 2;
            doc.setTextColor(0, 0, 0); // Reset color
        });
        y += 8;
    });

    doc.save(`exam-report-${exam.id}.pdf`);
  };

  const currentQuestion: Question | undefined = exam.questions[currentQuestionIndex];

  // SAFETY GUARD
  if (!currentQuestion) return null;

  const userAnswer = result.answers.find(a => a.questionId === currentQuestion.id)?.answer;
  const isCurrentCorrect = userAnswer === currentQuestion.correctAnswer;
  const currentNote = notes.find(n => n.questionId === currentQuestion.id)?.text || '';

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

  const handleNext = () => currentQuestionIndex < exam.questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1);
  const handlePrev = () => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1);
  
  const handleToggleBookmark = () => {
    const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);
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
            <h2 className="font-bold text-lg truncate pr-2 text-slate-900 dark:text-white">{exam.title}</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <XCircleIcon className="w-6 h-6"/>
            </button>
          </div>
          <div className="relative mt-4">
              <input type="text" placeholder="Search Questions" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 border border-slate-200 dark:border-slate-700" />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400"/>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
                {filteredQuestions.map((q, index) => {
                    const questionResult = result.answers.find(a => a.questionId === q.id);
                    const isCorrect = questionResult?.answer === q.correctAnswer;
                    const isBookmarked = bookmarks.some(b => b.questionId === q.id);
                    const isSelected = q.originalIndex === currentQuestionIndex;

                    return (
                        <li key={q.id}>
                            <button onClick={() => setCurrentQuestionIndex(q.originalIndex)} className={`w-full text-left p-2 rounded-md flex items-start gap-3 transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <div className="flex-shrink-0 flex items-center gap-1 min-w-[24px]">
                                    <span className={`font-semibold text-sm`}>{q.originalIndex + 1}</span>
                                    {isBookmarked && <BookmarkIcon solid className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <span className="flex-grow text-sm truncate">{q.questionText}</span>
                                {isCorrect ? <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          <Button variant="secondary" className="w-full justify-center border-slate-300 dark:border-slate-600" onClick={() => navigate('/history')}>Back to History</Button>
        </div>
     </aside>
  );

  return (
    <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-black" dir="ltr">
       <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 relative z-30 shadow-sm">
           <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MenuIcon className="w-6 h-6"/>
                    </button>
                    <h1 className="font-bold text-lg truncate text-slate-900 dark:text-100">Exam Results</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleDownloadPdf} variant="secondary" size="sm" className="border-slate-300 dark:border-slate-600">
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        Download
                    </Button>
                    <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="border-slate-300 dark:border-slate-600">Dashboard</Button>
                </div>
           </div>
       </header>

       <div className="flex flex-grow overflow-hidden relative">
           <Sidebar />
           
           {isSidebarOpen && (
                <div className="absolute inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
           )}

           <main className="flex-grow p-4 md:p-8 overflow-y-auto">
               <div className="max-w-4xl mx-auto pb-20">
                   <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-4 md:pb-0 md:pr-6">
                                <ScoreRing score={scorePercentage} size={100} strokeWidth={8} />
                                <p className="mt-2 font-bold text-lg text-slate-800 dark:text-slate-100">{scorePercentage >= 50 ? 'Passed' : 'Review Needed'}</p>
                            </div>
                            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correctAnswersCount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Correct</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrectAnswersCount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Incorrect</p>
                                </div>
                                <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{skippedCount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Skipped</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round((correctAnswersCount / (correctAnswersCount + incorrectAnswersCount || 1)) * 100)}%</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Accuracy</p>
                                </div>
                            </div>
                        </div>
                   </div>

                   <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                       <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                           <div>
                               <span className="inline-block px-2 py-1 text-xs font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2">
                                   Question {currentQuestionIndex + 1} of {totalQuestions}
                               </span>
                           </div>
                           <div ref={optionsMenuRef} className="relative flex items-center gap-2 text-slate-400">
                                <button onClick={() => setShowNotes(prev => !prev)} className={`p-1 rounded transition-colors ${showNotes ? 'bg-primary-100 text-primary-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Question Notes"><PencilAltIcon className="w-5 h-5" /></button>
                               <button onClick={handleToggleBookmark} className="hover:text-yellow-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Bookmark Question">
                                <BookmarkIcon solid={bookmarks.some(b => b.questionId === currentQuestion.id)} className="w-5 h-5"/>
                               </button>
                               <button className="hover:text-green-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Good question"><ThumbUpIcon className="w-5 h-5" /></button>
                               <button className="hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Bad question"><ThumbDownIcon className="w-5 h-5" /></button>
                               <button onClick={() => setIsMoreOptionsOpen(prev => !prev)} title="More options" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><DotsVerticalIcon className="w-5 h-5" /></button>
                               
                               {isMoreOptionsOpen && (
                                   <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 overflow-hidden">
                                       <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Report an issue</a>
                                       <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Get Help</a>
                                   </div>
                               )}
                           </div>
                       </div>
                       
                       <p className="mb-6 text-slate-900 dark:text-slate-100 font-medium text-lg leading-relaxed">{currentQuestion.questionText}</p>

                       <div className="space-y-4">
                           {currentQuestion.options.map((option, index) => {
                               const isCorrectAnswer = option === currentQuestion.correctAnswer;
                               const isUserAnswer = option === userAnswer;
                               
                               let optionClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60";
                               let icon = null;

                               if (isCorrectAnswer) {
                                   optionClass = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-100 shadow-sm opacity-100 ring-1 ring-green-500/20";
                                   icon = <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />;
                               } else if (isUserAnswer) {
                                   optionClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100 shadow-sm opacity-100 ring-1 ring-red-500/20";
                                   icon = <XIcon className="w-5 h-5 text-red-600 flex-shrink-0" />;
                               }
                               
                               const letters = ['A', 'B', 'C', 'D', 'E'];
                               return (
                                   <div key={index} className={`p-4 rounded-xl border-2 flex items-center justify-between ${optionClass}`}>
                                       <div className="flex items-center">
                                           <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 font-bold text-sm border ${isCorrectAnswer ? 'bg-green-100 border-green-500 text-green-800' : isUserAnswer ? 'bg-red-100 border-red-500 text-red-800' : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>
                                               {letters[index]}
                                           </span>
                                           <span className="font-medium text-lg">{option}</span>
                                       </div>
                                       <div className="flex items-center gap-3">
                                            {icon}
                                       </div>
                                   </div>
                               )
                           })}
                       </div>

                        {showNotes && (
                            <div className="mt-8 animate-fade-in">
                                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Notes</label>
                                <textarea
                                    id="notes"
                                    rows={4}
                                    className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                    placeholder="Add notes for this question..."
                                    value={currentNote}
                                    onChange={(e) => handleNoteChange(e.target.value)}
                                />
                            </div>
                        )}

                       {!isCurrentCorrect && <Explanation question={currentQuestion} userAnswer={userAnswer} />}

                       <div className="mt-8 flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                           <Button variant="secondary" onClick={handlePrev} disabled={currentQuestionIndex === 0} className="border-slate-300 dark:border-slate-600">
                               <ChevronLeftIcon className="w-5 h-5 mr-1"/> Previous
                           </Button>
                           <Button onClick={handleNext} disabled={currentQuestionIndex === exam.questions.length - 1}>
                               Next <ChevronRightIcon className="w-5 h-5 ml-1"/>
                           </Button>
                       </div>
                   </div>
               </div>
           </main>
       </div>
    </div>
  );
}

export default ResultsScreen;
