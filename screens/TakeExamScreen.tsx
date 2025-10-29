





import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
// FIX: Updated to use renamed ExamActionType to avoid type conflicts.
import { ExamActionType, ExamResult, Question } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';

function TakeExamScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results, dispatch } = useExam();
  
  const exam = exams.find(e => e.id === id);
  const existingResult = results.find(r => r.examId === id);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
      if (existingResult) {
          navigate(`/results/${id}`);
      }
  }, [existingResult, id, navigate]);

  if (!exam) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Exam Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The exam you are looking for may have been deleted or the link is incorrect.</p>
        {/* Fix: Added children to Button component to resolve missing prop error. */}
        <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
      </div>
    );
  }

  const currentQuestion: Question = exam.questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const goToNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarks(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };
  
  const handleSubmit = () => {
    const unansweredCount = exam.questions.length - Object.keys(answers).length;
    const bookmarkedCount = Object.values(bookmarks).filter(Boolean).length;
    
    let confirmMessage = 'Are you sure you want to submit?';
    if (unansweredCount > 0) {
      confirmMessage = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`;
    } else if (bookmarkedCount > 0) {
      confirmMessage = `You have ${bookmarkedCount} bookmarked question(s) for review. Are you sure you want to submit?`;
    }

    if (unansweredCount > 0 || bookmarkedCount > 0) {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else if (Object.keys(answers).length === exam.questions.length) {
        if (!window.confirm(confirmMessage)) {
            return;
        }
    }
    
    let score = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const result: ExamResult = {
      examId: exam.id,
      score: (score / exam.questions.length) * 100,
      // Fix: Explicitly cast answer to string to satisfy the type checker.
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer: String(answer) })),
      submittedAt: new Date().toISOString(),
    };

    // FIX: Using ExamActionType for correct type.
    dispatch({ type: ExamActionType.ADD_RESULT, payload: result });
    navigate(`/results/${exam.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {exam.sourceFileName ? `Based on: ${exam.sourceFileName}` : 'Custom Exam'}
        </p>
      </div>
      
      {/* Fix: Added children to Card component to resolve missing prop error. */}
      <Card className="mb-6">
        <h3 className="font-bold mb-3 text-center text-slate-700 dark:text-slate-300">Question Palette</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {exam.questions.map((q, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = answers[q.id] !== undefined;
            const isBookmarked = bookmarks[q.id];

            let buttonClass = 'w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-colors relative ';
            if (isCurrent) {
              buttonClass += 'bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-slate-900';
            } else if (isAnswered) {
              buttonClass += 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 hover:bg-green-200';
            } else {
              buttonClass += 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';
            }

            return (
              <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={buttonClass} aria-label={`Go to question ${index + 1}`}>
                {index + 1}
                {isBookmarked && (
                  <BookmarkIcon className="w-3 h-3 absolute -top-1 -right-1 fill-red-500 stroke-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </Card>
      
      {/* Fix: Added children to Card component to resolve missing prop error. */}
      <Card>
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </p>
            <button 
              onClick={() => toggleBookmark(currentQuestion.id)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1"
            >
              <BookmarkIcon className={`w-5 h-5 transition-colors ${bookmarks[currentQuestion.id] ? 'fill-primary-500 text-primary-500' : ''}`} />
              {bookmarks[currentQuestion.id] ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.questionText}</h2>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-start p-4 border rounded-lg transition-colors duration-200
                  ${answers[currentQuestion.id] === option 
                    ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500 ring-2 ring-primary-500' 
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </Card>
      
      <div className="mt-6 flex justify-between items-center">
        {/* Fix: Added children to Button component to resolve missing prop error. */}
        <Button onClick={goToPrev} disabled={currentQuestionIndex === 0} variant="secondary">
          <ChevronLeftIcon className="w-5 h-5 me-1" />
          <span>Previous</span>
        </Button>
        {currentQuestionIndex === exam.questions.length - 1 ? (
          // Fix: Added children to Button component to resolve missing prop error.
          <Button onClick={handleSubmit} size="lg">
            Submit Exam
          </Button>
        ) : (
          // Fix: Added children to Button component to resolve missing prop error.
          <Button onClick={goToNext}>
            <span>Next</span>
            <ChevronRightIcon className="w-5 h-5 ms-1" />
          </Button>
        )}
      </div>

    </div>
  );
};

export default TakeExamScreen;