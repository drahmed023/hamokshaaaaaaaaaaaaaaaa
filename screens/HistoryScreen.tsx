







import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Card from '../components/Card';
import Button from '../components/Button';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';

function HistoryScreen() {
  const { exams, results } = useExam();
  const navigate = useNavigate();
  
  const completedExams = results.map(result => {
    const exam = exams.find(e => e.id === result.examId);
    return { ...result, exam };
  }).filter(item => item.exam);

  if (completedExams.length === 0) {
    return (
      <div className="text-center">
        <BarChartIcon className="w-16 h-16 mx-auto text-slate-400" />
        <h1 className="text-3xl font-bold mt-4">No Exam History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You haven't completed any exams yet. Create one to get started.</p>
        {/* Fix: Added children to Button component to resolve missing prop error. */}
        <Button onClick={() => navigate('/create-exam')} className="mt-6">
          Create Exam
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Exam History</h1>
      <div className="space-y-4">
        {completedExams.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(({ exam, score, submittedAt }) => (
          <div key={exam!.id}>
            {/* Fix: Added children to Card component to resolve missing prop error. */}
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold">{exam!.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Submitted: {new Date(submittedAt).toLocaleString()}
                  </p>
                  {exam!.sourceFileName && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                        Source: {exam!.sourceFileName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex-grow sm:flex-grow-0 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Score</p>
                    <p className={`text-2xl font-bold ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.round(score)}%
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {exam!.sourceFileName && (
                        <Button onClick={() => navigate(`/question-bank/${encodeURIComponent(exam!.sourceFileName)}`)} variant="secondary" className="w-full sm:w-auto">
                           <DatabaseIcon className="w-4 h-4 mr-2" />
                           Bank
                        </Button>
                    )}
                    <Button onClick={() => navigate(`/results/${exam!.id}`)} variant="secondary" className="w-full sm:w-auto">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryScreen;