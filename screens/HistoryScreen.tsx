
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

    // First, identify all unique question banks from the exams created
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
            // Use a Set to calculate truly unique questions for this bank across all exams
            // (Simulated here by counting this exam's questions)
            banks[fileName].totalQuestions += exam.questions.length;
        }
    });

    // Then, attach results to the banks or individual sessions
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

    // Calculate average scores and sort sessions
    Object.keys(banks).forEach(fileName => {
        const bank = banks[fileName];
        if (bank.sessions.length > 0) {
            bank.averageScore = bank.sessions.reduce((acc, s) => acc + s.score, 0) / bank.sessions.length;
            bank.sessions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        }
    });

    // Sort individuals by date
    individuals.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return { questionBanks: banks, individualSessions: individuals };
  }, [exams, results]);

  const hasAnyData = Object.keys(questionBanks).length > 0 || individualSessions.length > 0;

  if (!hasAnyData) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChartIcon className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">لا يوجد سجل حالياً</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">ابدأ برفع ملفاتك وتوليد أول اختبار لتظهر لك الإحصائيات هنا.</p>
        <Button onClick={() => navigate('/create-exam')} className="mt-8 px-8 py-3 rounded-2xl shadow-lg">
          ابدأ الآن
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4" dir="rtl">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">سجل التعلم</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs opacity-60">متابعة الأداء وبنوك الأسئلة</p>
      </div>

      <div className="space-y-12">
        {/* Question Banks Section */}
        {Object.keys(questionBanks).length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <DatabaseIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">بنوك الأسئلة الذكية</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* FIX: Cast Object.entries result to resolve 'unknown' property access errors for 'bank' object. */}
              {(Object.entries(questionBanks) as [string, any][]).map(([fileName, bank]) => (
                <div key={fileName} className="group">
                  <Card className={`transition-all duration-300 border-2 ${expandedBank === fileName ? 'border-primary-500 shadow-xl' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 shadow-sm'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-md">{fileName}</h3>
                            {bank.sessions.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${bank.averageScore >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    متوسط: {Math.round(bank.averageScore)}%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                                <BookOpenIcon className="w-4 h-4 opacity-50" />
                                <span>{bank.totalQuestions} سؤال متاح</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                                <ClockIcon className="w-4 h-4 opacity-50" />
                                <span>{bank.sessions.length} محاولة سابقة</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button onClick={() => navigate(`/question-bank/${encodeURIComponent(fileName)}`)} variant="secondary" className="flex-grow md:flex-initial rounded-xl font-black text-xs uppercase tracking-widest px-6 h-10 border-slate-200">
                          فتح البنك
                        </Button>
                        <button 
                            onClick={() => setExpandedBank(prev => prev === fileName ? null : fileName)}
                            className={`p-2.5 rounded-xl transition-all ${expandedBank === fileName ? 'bg-primary-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600'}`}
                        >
                          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${expandedBank === fileName ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {expandedBank === fileName && (
                      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">تفاصيل المحاولات</p>
                        <div className="space-y-3">
                          {bank.sessions.length > 0 ? bank.sessions.map(({ exam, score, submittedAt }: any) => (
                            <div key={submittedAt} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:bg-white dark:hover:bg-slate-800 transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-black ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(score)}%</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(submittedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <Button onClick={() => navigate(`/results/${exam!.id}`)} size="sm" variant="secondary" className="rounded-xl font-bold text-[10px] opacity-0 group-hover/item:opacity-100 transition-opacity">
                                مراجعة الإجابات
                              </Button>
                            </div>
                          )) : (
                              <div className="text-center py-6 text-slate-400 font-bold text-xs">لا يوجد محاولات لهذا البنك بعد</div>
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
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <ClockIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">جلسات منفردة</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {individualSessions.map(({ exam, score, submittedAt }) => (
                <div key={exam!.id}>
                  <Card className="hover:border-slate-200 dark:hover:border-slate-800 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="flex-grow">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{exam!.title}</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                          تاريخ التقديم: {new Date(submittedAt).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-center">
                          <p className={`text-2xl font-black ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.round(score)}%
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النتيجة</p>
                        </div>
                        <Button onClick={() => navigate(`/results/${exam!.id}`)} variant="secondary" className="rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest border-slate-200">
                          التفاصيل
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
