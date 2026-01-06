
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { Question } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { SearchIcon } from '../components/icons/SearchIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import jsPDF from 'jspdf';
import { DownloadIcon } from '../components/icons/DownloadIcon';

function QuestionBankScreen() {
    const { fileName } = useParams<{ fileName: string }>();
    const navigate = useNavigate();
    const { exams } = useExam();
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const uniqueQuestions = useMemo(() => {
        if (!fileName) return [];

        const decodedFileName = decodeURIComponent(fileName);
        const relevantExams = (exams || []).filter(exam => exam?.sourceFileName === decodedFileName);
        
        // Use a map with the question text as key to strictly ensure uniqueness
        const questionMap = new Map<string, Question>();
        
        relevantExams.forEach(exam => {
            (exam?.questions || []).forEach(q => {
                if (q && q.questionText) {
                    const normalizedText = q.questionText.trim().toLowerCase();
                    if (!questionMap.has(normalizedText)) {
                        questionMap.set(normalizedText, q);
                    }
                }
            });
        });
        
        return Array.from(questionMap.values());
    }, [exams, fileName]);

    const filteredQuestions = useMemo(() => {
        if (!searchTerm) return uniqueQuestions;
        return uniqueQuestions.filter(q =>
            q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [uniqueQuestions, searchTerm]);
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const decodedFileName = decodeURIComponent(fileName || "Question Bank");
        
        doc.setFontSize(18);
        doc.text(`Question Bank: ${decodedFileName}`, 10, 20);

        let y = 30;
        uniqueQuestions.forEach((q, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            const questionLines = doc.splitTextToSize(`${index + 1}. ${q.questionText}`, 180);
            doc.text(questionLines, 10, y);
            y += (questionLines.length * 5) + 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            (q.options || []).forEach(opt => {
                if (opt === q.correctAnswer) {
                    doc.setTextColor(0, 128, 0); // Green
                }
                const optionLines = doc.splitTextToSize(`  - ${opt}`, 170);
                doc.text(optionLines, 15, y);
                y += (optionLines.length * 4) + 2;
                doc.setTextColor(0, 0, 0); // Reset color
            });
            y += 8;
        });

        doc.save(`question-bank-${decodedFileName}.pdf`);
    };

    if (!fileName) {
        return <div className="p-20 text-center font-black">Error: No file specified.</div>;
    }

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-black" dir="rtl">
            <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30 relative px-4 md:px-8">
                <div className="container mx-auto h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl hidden sm:block">
                            <DatabaseIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-lg md:text-xl font-black truncate max-w-[200px] md:max-w-md text-slate-900 dark:text-white">
                            بنك: {decodeURIComponent(fileName)}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button onClick={handleDownloadPdf} variant="secondary" className="rounded-xl h-9 px-4 border-slate-200 hidden sm:flex">
                            <DownloadIcon className="w-4 h-4 ml-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">تحميل PDF</span>
                        </Button>
                        <Button onClick={() => navigate('/history')} variant="secondary" className="rounded-xl h-9 px-4 border-slate-200">
                            <ChevronLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                            <span className="text-[10px] font-black uppercase tracking-widest">رجوع</span>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden relative">
                {/* Sidebar - Questions List */}
                <aside className="w-72 md:w-96 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 border-l border-slate-200 dark:border-slate-800 shadow-sm z-20">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="بحث في الأسئلة..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold transition-all"
                            />
                            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <div className="mt-3 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredQuestions.length} سؤال متاح</span>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                        {filteredQuestions.map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestion(q)}
                                className={`w-full text-right p-4 rounded-2xl flex flex-col gap-1 transition-all group ${selectedQuestion?.id === q.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedQuestion?.id === q.id ? 'text-primary-100' : 'text-primary-600'}`}>سؤال #{index + 1}</span>
                                <span className={`text-sm font-bold truncate w-full ${selectedQuestion?.id === q.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{q.questionText}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content - Question Detail */}
                <main className="flex-grow p-4 md:p-12 overflow-y-auto bg-slate-50 dark:bg-black">
                    {selectedQuestion ? (
                        <div className="max-w-3xl mx-auto animate-fade-in">
                            <Card className="border-none shadow-2xl p-8 md:p-10 rounded-[2.5rem]">
                                 <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-4">تفاصيل السؤال</span>
                                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">{selectedQuestion.questionText}</p>
                                 </div>
                                 
                                 <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الخيارات</p>
                                    {(selectedQuestion.options || []).map((option, index) => {
                                        const isCorrect = option === selectedQuestion.correctAnswer;
                                        const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
                                        return (
                                            <div key={index} className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${isCorrect
                                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-md'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${isCorrect ? 'bg-green-500 border-green-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                                        {letters[index]}
                                                    </span>
                                                    <span className={`text-lg font-bold ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-slate-700 dark:text-slate-300'}`}>{option}</span>
                                                </div>
                                                {isCorrect && (
                                                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">الإجابة الصحيحة</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                 </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center">
                            <div className="max-w-sm space-y-4">
                                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
                                    <DatabaseIcon className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">اختر سؤالاً للعرض</h2>
                                <p className="text-slate-400 font-bold text-sm">تصفح قائمة الأسئلة على اليمين لمراجعة الخيارات والإجابات الصحيحة في هذا البنك.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default QuestionBankScreen;
