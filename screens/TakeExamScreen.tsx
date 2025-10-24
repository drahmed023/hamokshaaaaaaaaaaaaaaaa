import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ActionType, ExamResult, Question } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

const TakeExamScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results, dispatch } = useExam();
  
  const exam = exams.find(e => e.id === id);
  const existingResult = results.find(r => r.examId === id);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
  
  const handleSubmit = () => {
    if (Object.keys(answers).length !== exam.questions.length) {
        if (!window.confirm('You have not answered all questions. Are you sure you want to submit?')) {
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
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      submittedAt: new Date().toISOString(),
    };

    dispatch({ type: ActionType.ADD_RESULT, payload: result });
    navigate(`/results/${exam.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {exam.sourceFileName ? `Based on: ${exam.sourceFileName}` : 'Custom Exam'}
        </p>
      </div>
      
      <Card>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Question {currentQuestionIndex + 1} of {exam.questions.length}
          </p>
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.questionText}</h2>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-start p-4 border rounded-lg transition-colors duration-200
                  ${answers[currentQuestion.id] === option 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-500' 
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
        <Button onClick={goToPrev} disabled={currentQuestionIndex === 0} variant="secondary">
          <ChevronLeftIcon className="w-5 h-5 me-1" />
          <span>Previous</span>
        </Button>
        {currentQuestionIndex === exam.questions.length - 1 ? (
          <Button onClick={handleSubmit} size="lg">
            Submit Exam
          </Button>
        ) : (
          <Button onClick={goToNext} disabled={currentQuestionIndex === exam.questions.length - 1}>
            <span>Next</span>
            <ChevronRightIcon className="w-5 h-5 ms-1" />
          </Button>
        )}
      </div>

    </div>
  );
};

export default TakeExamScreen;