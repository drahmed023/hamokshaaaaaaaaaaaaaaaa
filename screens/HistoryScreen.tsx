import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Card from '../components/Card';
import Button from '../components/Button';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

function HistoryScreen() {
  const { exams, results } = useExam();
  const navigate = useNavigate();
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  const { questionBanks, individualSessions } = useMemo(() => {
    const banks: { [fileName: string]: { sessions: any[], averageScore: number } } = {};
    const individuals: any[] = [];

    const completedExams = results
      .map(result => {
        const exam = exams.find(e => e.id === result.examId);
        return { ...result, exam };
      })
      .filter(item => item.exam)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    completedExams.forEach(item => {
      if (item.exam!.sourceFileName) {
        const fileName = item.exam!.sourceFileName;
        if (!banks[fileName]) {
          banks[fileName] = { sessions: [], averageScore: 0 };
        }
        banks[fileName].sessions.push(item);
      } else {
        individuals.push(item);
      }
    });

    // Calculate average scores
    Object.values(banks).forEach(bank => {
      if ((bank as any).sessions.length > 0) {
        (bank as any).averageScore = (bank as any).sessions.reduce((acc: any, s: any) => acc + s.score, 0) / (bank as any).sessions.length;
      }
    });

    return { questionBanks: banks, individualSessions: individuals };
  }, [exams, results]);

  if (Object.keys(questionBanks).length === 0 && individualSessions.length === 0) {
    return (
      <div className="text-center">
        <BarChartIcon className="w-16 h-16 mx-auto text-slate-400" />
        <h1 className="text-3xl font-bold mt-4">No Exam History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You haven't completed any exams yet. Create one to get started.</p>
        <Button onClick={() => navigate('/create-exam')} className="mt-6">
          Create Exam
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Exam History</h1>
      <div className="space-y-6">
        
        {Object.keys(questionBanks).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Question Banks</h2>
            <div className="space-y-4">
              {Object.entries(questionBanks).map(([fileName, bank]) => (
                // FIX: The 'key' prop is for React's reconciliation and should be on the wrapping element, not passed to custom components.
                <div key={fileName}>
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold">{fileName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {/* FIX: Cast 'bank' to 'any' to resolve TypeScript error where its type is inferred as 'unknown'. */}
                          {(bank as any).sessions.length} sessions taken &middot; {Math.round((bank as any).averageScore)}% avg. score
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={() => navigate(`/question-bank/${encodeURIComponent(fileName)}`)} variant="secondary" className="w-full sm:w-auto">
                          <DatabaseIcon className="w-4 h-4 mr-2" />
                          View Question Bank
                        </Button>
                        <Button onClick={() => setExpandedBank(prev => prev === fileName ? null : fileName)} variant="secondary" size="sm" className="!p-2">
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedBank === fileName ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    {expandedBank === fileName && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                        <h4 className="font-semibold">Individual Sessions:</h4>
                        {/* FIX: Cast 'bank' to 'any' to access the 'sessions' property. */}
                        {(bank as any).sessions.map(({ exam, score, submittedAt }: any) => (
                          <div key={submittedAt} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div>
                              <p className="font-medium">Score: <span className={`font-bold ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(score)}%</span></p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(submittedAt).toLocaleString()}</p>
                            </div>
                            <Button onClick={() => navigate(`/results/${exam!.id}`)} size="sm" variant="secondary">View Details</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {individualSessions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 mt-8">Individual Sessions</h2>
            <div className="space-y-4">
              {individualSessions.map(({ exam, score, submittedAt }) => (
                // FIX: The 'key' prop is for React's reconciliation and should be on the wrapping element, not passed to custom components.
                <div key={exam!.id}>
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{exam!.title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Submitted: {new Date(submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Score</p>
                          <p className={`text-2xl font-bold ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.round(score)}%
                          </p>
                        </div>
                        <Button onClick={() => navigate(`/results/${exam!.id}`)} variant="secondary">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;