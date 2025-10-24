import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Button from '../components/Button';
import Card from '../components/Card';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';

const Explanation: React.FC<{ question: any; userAnswer: string | undefined }> = ({ question, userAnswer }) => {
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchExplanation = async () => {
        if (!userAnswer) return;
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
        return <div className="p-2"><Loader text="Getting AI explanation..." /></div>;
    }

    if (explanation) {
        return <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">{explanation}</div>;
    }

    return (
        <Button onClick={fetchExplanation} size="sm" variant="secondary" className="mt-2">
            Why was this wrong?
        </Button>
    );
};


const ResultsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results } = useExam();

  const exam = exams.find(e => e.id === id);
  const result = results.find(r => r.examId === id);

  if (!exam || !result) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Result Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">This result could not be displayed. The exam may not be completed yet.</p>
        <Button onClick={() => navigate('/history')} className="mt-4">Back to History</Button>
      </div>
    );
  }

  const scorePercentage = Math.round(result.score);
  const correctAnswers = Math.round((result.score / 100) * exam.questions.length);

  const getOptionClass = (option: string, questionId: string, correctAnswer: string) => {
    const userAnswer = result.answers.find(a => a.questionId === questionId)?.answer;
    if (option === correctAnswer) {
      return 'bg-green-100 dark:bg-green-900/40 border-green-500';
    }
    if (option === userAnswer && option !== correctAnswer) {
      return 'bg-red-100 dark:bg-red-900/40 border-red-500';
    }
    return 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="text-center">
        <h1 className="text-3xl font-bold">Result: {exam.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Submitted on: {new Date(result.submittedAt).toLocaleString()}
        </p>
        <div className="my-6">
          <div className={`text-6xl font-extrabold ${scorePercentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {scorePercentage}%
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mt-2">
            {correctAnswers} of {exam.questions.length} correct answers
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(`/exam/${exam.id}`)} variant="secondary">Retake Exam</Button>
          <Button onClick={() => navigate('/create-exam')}>Create New Exam</Button>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Review Answers</h2>
        <div className="space-y-6">
          {exam.questions.map((question, index) => {
            const userAnswer = result.answers.find(a => a.questionId === question.id)?.answer;
            const isCorrect = userAnswer === question.correctAnswer;
            return (
              <Card key={question.id}>
                <div className="flex justify-between items-start">
                  <p className="text-lg font-semibold">{index + 1}. {question.questionText}</p>
                  {isCorrect 
                    ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> 
                    : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />}
                </div>
                <div className="mt-4 space-y-2">
                  {question.options.map(option => (
                    <div key={option} className={`p-3 border rounded-lg ${getOptionClass(option, question.id, question.correctAnswer)}`}>
                      {option}
                    </div>
                  ))}
                </div>
                 {!isCorrect && (
                    <Explanation question={question} userAnswer={userAnswer} />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;