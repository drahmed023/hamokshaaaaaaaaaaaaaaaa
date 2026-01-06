
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Card from '../components/Card';
import Button from '../components/Button';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';

function HistoryScreen() {
  const { exams, results } = useExam();
  const navigate = useNavigate();
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  const { questionBanks, individualSessions } = useMemo(() => {
    const banks: { [fileName: string]: { 
        sessions: any[], 
        averageScore: number, 
        totalQuestions: number,
        lastActivity: string
    } } = {};
    const individuals: any[] = [];

    const safeResults = Array.isArray(results) ? results : [];
    const safeExams = Array.isArray(exams) ? exams : [];

    safeExams.forEach(exam => {
        if (exam.sourceFileName && exam.sourceFileName !== 'Manual Entry') {
            const fileName = exam.sourceFileName;
            if (!banks[fileName]) {
                banks[fileName] = { 
                    sessions: [], 
                    averageScore: 0, 
                    totalQuestions: 0,
                    lastActivity: '' 
                };
            }
            banks[fileName].totalQuestions += exam.questions.length;
        }
    });

    safeResults.forEach(result => {
        const exam = safeExams.find(e => e.id === result.examId);
        if (exam) {
            const item = { ...result, exam };
            if (exam.sourceFileName && exam.sourceFileName !== 'Manual Entry') {
                const fileName = exam.sourceFileName;
                if (banks[fileName]) {
                    banks[fileName].sessions.push(item);
                    if (!banks[fileName].lastActivity || new Date(result.submittedAt) > new Date(banks[fileName].lastActivity)) {
                        banks[fileName].lastActivity = result.submittedAt;
                    }
                }
            } else {
                individuals.push(item);
            }
        }
    });

    Object.keys(banks).forEach(fileName => {
        const bank = banks[fileName];
        if (bank.sessions.length > 0) {
            bank.averageScore = bank.sessions.reduce((acc, s) => acc + s.score, 0) / bank.sessions.length;
            bank.sessions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        }
    });

    individuals.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return { questionBanks: banks, individualSessions: individuals };
  }, [exams, results]);

  const hasAnyData = Object.keys(questionBanks).length > 0 || individualSessions.length > 0;

  if (!hasAnyData) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
            <BarChartIcon className="w-8 h-8 text-slate-300" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Records</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest opacity-60">Generate an exam to start tracking your performance.</p>
        <Button onClick={() => navigate('/create-exam')} className="mt-8 px-8 h-11 rounded-xl shadow-lg shadow-primary-500/20">
          <span className="text-xs font-black uppercase tracking-widest">Create First Exam</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4" dir="ltr">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Academic Records</h1>
        <p className="text-slate-400 mt-1 font-bold uppercase text-[10px] tracking-[0.4em] opacity-50">Performance Tracking & Repositories</p>
      </div>

      <div className="space-y-12">
        {/* Question Banks Section */}
        {Object.keys(questionBanks).length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-primary-500 pl-3 py-1">Question Repositories</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(questionBanks) as [string, any][]).map(([fileName, bank]) => (
                <div key={fileName} className="group">
                  <Card className={`transition-all duration-300 p-0 overflow-hidden border-2 ${expandedBank === fileName ? 'border-primary-500 shadow-xl' : 'border-transparent bg-white/50 hover:bg-white dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-6">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{fileName}</h3>
                            {bank.sessions.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${bank.averageScore >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    Avg: {Math.round(bank.averageScore)}%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <BookOpenIcon className="w-3.5 h-3.5" />
                                <span>{bank.totalQuestions} Questions</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span>{bank.sessions.length} Attempts</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button onClick={() => navigate(`/question-bank/${encodeURIComponent(fileName)}`)} variant="secondary" className="flex-grow md:flex-initial rounded-lg h-9 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200 shadow-sm hover:shadow-md transition-all">
                          Open Vault
                        </Button>
                        <button 
                            onClick={() => setExpandedBank(prev => prev === fileName ? null : fileName)}
                            className={`p-2 rounded-lg transition-all ${expandedBank === fileName ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600'}`}
                        >
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${expandedBank === fileName ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {expandedBank === fileName && (
                      <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 p-4 md:p-6 animate-fade-in">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detailed Attempts History</p>
                        <div className="space-y-2">
                          {bank.sessions.length > 0 ? bank.sessions.map(({ exam, score, submittedAt }: any) => (
                            <div key={submittedAt} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group/item hover:border-primary-200 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${score >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {Math.round(score)}%
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{new Date(submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(submittedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <Button onClick={() => navigate(`/results/${exam!.id}`)} size="sm" variant="secondary" className="rounded-lg font-black text-[9px] uppercase h-8 px-4 border-slate-200 opacity-0 group-hover/item:opacity-100 transition-all">
                                Review
                              </Button>
                            </div>
                          )) : (
                              <div className="text-center py-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic opacity-40">No attempts yet</div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Individual Sessions Section */}
        {individualSessions.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-slate-300 pl-3 py-1">Solo Study Sessions</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {individualSessions.map(({ exam, score, submittedAt }) => (
                <div key={exam!.id}>
                  <Card className="hover:border-slate-200 dark:hover:border-slate-800 bg-white/50 dark:bg-slate-900/50 transition-all shadow-sm p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-grow">
                        <h3 className="text-md font-black text-slate-800 dark:text-white uppercase tracking-tight">{exam!.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                          Completed: {new Date(submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 self-end sm:self-auto">
                         <div className="text-right">
                          <p className={`text-xl font-black ${score >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Math.round(score)}%
                          </p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Final Score</p>
                        </div>
                        <Button onClick={() => navigate(`/results/${exam!.id}`)} variant="secondary" className="rounded-lg h-9 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200">
                          Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default HistoryScreen;
