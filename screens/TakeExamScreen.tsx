

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, ExamResult, Question, BookmarksActionType } from '../types';
import Button from '../components/Button';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { useBookmarks } from '../hooks/useBookmarks';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { ClockIcon } from '../components/icons/ClockIcon';


const FONT_SIZES = [
    'text-xl sm:text-2xl', // Small
    'text-2xl sm:text-3xl', // Default
    'text-3xl sm:text-4xl', // Large
    'text-4xl sm:text-5xl', // X-Large
];

function TakeExamScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results, dispatch } = useExam();
  const { bookmarks, dispatch: bookmarkDispatch } = useBookmarks();
  
  const exam = exams.find(e => e.id === id);
  const existingResult = Array.isArray(results) ? results.find(r => r.examId === id) : undefined;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionStatus, setQuestionStatus] = useState<'unanswered' | 'answered'>('unanswered');
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exam ? exam.questions.length * 60 : 0);
  const [fontScaleIndex, setFontScaleIndex] = useState(1);
  const submittedRef = useRef(false);

  useEffect(() => {
      if (existingResult) {
          navigate(`/results/${id}`, { replace: true });
      }
  }, [existingResult, id, navigate]);

  useEffect(() => {
    if (!exam || existingResult || submittedRef.current) return;
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                if (!submittedRef.current) {
                    handleFinishExam(); 
                    submittedRef.current = true;
                }
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, existingResult]);


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
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exam Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The exam you are looking for may have been deleted or the link is incorrect.</p>
        <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
      </div>
    );
  }

  const currentQuestion: Question = exam.questions[currentQuestionIndex];
  const answeredProgress = (sessionAnswers.length / exam.questions.length) * 100;
  const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);

  const handleCheckAnswer = async () => {
    if (!selectedOption) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    setSessionAnswers(prev => [...prev, {
        questionId: currentQuestion.id,
        answer: selectedOption,
        isCorrect: isCorrect,
    }]);

    setQuestionStatus('answered');

    if (!isCorrect) {
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
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setQuestionStatus('unanswered');
      setExplanation(null);
    }
  };
  
  const handleFinishExam = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const totalQuestions = exam.questions.length;
    // For auto-submit, correct answers are only those the user actually answered.
    const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
    
    const result: ExamResult = {
        examId: exam.id,
        // The score should be based on total questions in the exam, not just answered ones.
        score: totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0,
        answers: sessionAnswers.map(({ questionId, answer }) => ({ questionId, answer })),
        submittedAt: new Date().toISOString(),
    };

    dispatch({ type: ExamActionType.ADD_RESULT, payload: result });
    navigate(`/results/${exam.id}`, { replace: true });
  };

  const getOptionState = (option: string) => {
    if (questionStatus === 'unanswered') {
        return { isSelected: selectedOption === option, state: 'default' as const };
    }
    const isCorrectAnswer = option === currentQuestion.correctAnswer;
    const isSelectedAnswer = option === selectedOption;

    if (isCorrectAnswer) return { isSelected: isSelectedAnswer, state: 'correct' as const };
    if (isSelectedAnswer) return { isSelected: true, state: 'incorrect' as const };
    return { isSelected: false, state: 'disabled' as const };
  };

  const handleToggleBookmark = () => {
      if (isBookmarked) {
          bookmarkDispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId: currentQuestion.id }});
      } else {
          bookmarkDispatch({ type: BookmarksActionType.ADD_BOOKMARK, payload: { examId: exam.id, questionId: currentQuestion.id }});
      }
  };

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
      setFontScaleIndex(prev => {
          if (direction === 'increase') return Math.min(prev + 1, FONT_SIZES.length - 1);
          return Math.max(prev - 1, 0);
      });
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col">
      {/* Sticky Header */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm">
        <div className="mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <button onClick={handleQuit} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-500">
              <XCircleIcon className="w-6 h-6"/>
              <span className="hidden sm:inline">Quit</span>
            </button>
            <div className="flex-grow text-center">
              <h1 className="text-base sm:text-lg font-bold truncate text-slate-800 dark:text-slate-100">{exam.title}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-md p-0.5">
                    <button onClick={() => handleFontSizeChange('decrease')} className="px-1.5 py-0.5 rounded text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Decrease font size">A-</button>
                    <button onClick={() => handleFontSizeChange('increase')} className="px-1.5 py-0.5 rounded text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Increase font size">A+</button>
                </div>
                <button onClick={handleToggleBookmark} className={`p-1.5 rounded-full ${isBookmarked ? 'text-primary-500' : 'text-slate-400'} hover:bg-slate-100 dark:hover:bg-slate-700`} aria-label="Bookmark question">
                    <BookmarkIcon solid={isBookmarked} className="w-5 h-5"/>
                </button>
                <div className={`flex items-center gap-1 font-semibold tabular-nums ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    <ClockIcon className="w-5 h-5"/>
                    <span className="text-sm">{formatTime(timeLeft)}</span>
                </div>
            </div>
          </div>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${answeredProgress}%` }}></div>
          </div>
        </div>
      </header>

      {/* Main Content (Scrollable) */}
      <main className="flex-grow overflow-y-auto py-8 px-4 flex justify-center">
        <div className="w-full max-w-3xl space-y-8">
          <h2 className={`${FONT_SIZES[fontScaleIndex]} font-bold leading-tight text-slate-800 dark:text-slate-100 text-center transition-all duration-200`}>
            {currentQuestion.questionText}
          </h2>
          
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const { state, isSelected } = getOptionState(option);

              const baseClasses = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between";
              const stateClasses = {
                  default: `bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${isSelected ? 'border-primary-600 ring-2 ring-primary-500/50 bg-primary-50 dark:bg-primary-900/20' : ''}`,
                  correct: 'bg-green-50 dark:bg-green-900/20 border-green-500 cursor-default',
                  incorrect: 'bg-red-50 dark:bg-red-900/20 border-red-500 cursor-default',
                  disabled: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-default',
              };
              const letterBaseClasses = "flex-shrink-0 w-8 h-8 rounded-md border-2 flex items-center justify-center font-bold transition-colors";
              const letterStateClasses = {
                  default: `border-slate-300 dark:border-slate-500 group-hover:border-primary-500 text-slate-500 ${isSelected ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200' : ''}`,
                  correct: 'border-green-500 bg-green-500 text-white',
                  incorrect: 'border-red-500 bg-red-500 text-white',
                  disabled: 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-400',
              };
              
              return (
                <button
                  key={index}
                  onClick={() => questionStatus === 'unanswered' && setSelectedOption(option)}
                  disabled={questionStatus === 'answered'}
                  className={`${baseClasses} ${stateClasses[state]} group`}
                >
                  <div className="flex items-center">
                    <div className={`${letterBaseClasses} ${letterStateClasses[state]}`}>
                      {letters[index]}
                    </div>
                    <span className="ml-4 font-medium text-lg text-slate-800 dark:text-slate-100">{option}</span>
                  </div>
                  {state === 'correct' && <CheckIcon className="w-7 h-7 text-green-600 flex-shrink-0" />}
                  {state === 'incorrect' && <XCircleIcon className="w-7 h-7 text-red-600 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
          
          {questionStatus === 'answered' && (
              <div className="mt-6">
                  {isFetchingExplanation ? (
                      <Loader text="Getting AI explanation..." />
                  ) : explanation ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                          <h4 className="font-bold mb-2">Explanation</h4>
                          <p className="text-sm">{explanation}</p>
                      </div>
                  ) : null}
              </div>
          )}
        </div>
      </main>
      
      {/* Sticky Footer */}
      <footer className="flex-shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 w-full sticky bottom-0">
        <div className="mx-auto px-4 py-4 flex items-center justify-center">
          {questionStatus === 'unanswered' && (
              <Button onClick={handleCheckAnswer} disabled={!selectedOption} size="lg" className="min-w-[240px]">
                  Check Answer
              </Button>
          )}
          {questionStatus === 'answered' && (
              currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button onClick={goToNext} size="lg" className="min-w-[240px]">
                      Next Question
                      <ChevronRightIcon className="w-5 h-5 ml-2" />
                  </Button>
              ) : (
                  <Button onClick={handleFinishExam} size="lg" className="min-w-[240px] bg-green-600 hover:bg-green-700">
                      Finish Exam & View Results
                      <CheckCircleIcon className="w-5 h-5 ml-2" />
                  </Button>
              )
          )}
        </div>
      </footer>
    </div>
  );
}

export default TakeExamScreen;