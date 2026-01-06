
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
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(12); doc.setFont('helvetica', 'bold');
            const questionLines = doc.splitTextToSize(`${index + 1}. ${q.questionText}`, 180);
            doc.text(questionLines, 10, y); y += (questionLines.length * 5) + 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            (q.options || []).forEach(opt => {
                if (opt === q.correctAnswer) doc.setTextColor(16, 185, 129);
                const optionLines = doc.splitTextToSize(`  - ${opt}`, 170);
                doc.text(optionLines, 15, y); y += (optionLines.length * 4) + 2;
                doc.setTextColor(0, 0, 0);
            });
            y += 8;
        });
        doc.save(`bank-${decodedFileName}.pdf`);
    };

    if (!fileName) return <div className="p-20 text-center font-black">Error: No file specified.</div>;

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-black" dir="ltr">
            <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30 relative px-4 md:px-8">
                <div className="container mx-auto h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg hidden sm:block">
                            <DatabaseIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-sm md:text-md font-black truncate max-w-[150px] md:max-w-md text-slate-900 dark:text-white uppercase tracking-tight">
                            Vault: {decodeURIComponent(fileName)}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleDownloadPdf} variant="secondary" className="rounded-lg h-8 px-4 border-slate-200 hidden sm:flex">
                            <DownloadIcon className="w-3.5 h-3.5 mr-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Download PDF</span>
                        </Button>
                        <Button onClick={() => navigate('/history')} variant="secondary" className="rounded-lg h-8 px-4 border-slate-200">
                            <ChevronLeftIcon className="w-3.5 h-3.5 mr-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Exit Vault</span>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden relative">
                {/* Sidebar - Compact Questions List */}
                <aside className="w-64 md:w-80 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-sm z-20">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Filter questions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold transition-all"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <div className="mt-3 px-1 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredQuestions.length} Items Available</span>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                        {filteredQuestions.map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestion(q)}
                                className={`w-full text-left p-3 rounded-xl flex flex-col gap-1 transition-all group ${selectedQuestion?.id === q.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className={`text-[8px] font-black uppercase tracking-widest ${selectedQuestion?.id === q.id ? 'text-primary-100' : 'text-primary-600'}`}>ITEM #{index + 1}</span>
                                <span className={`text-[11px] font-bold truncate w-full leading-tight ${selectedQuestion?.id === q.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{q.questionText}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area - Question Detail */}
                <main className="flex-grow p-4 md:p-10 overflow-y-auto bg-slate-50 dark:bg-[#020617]">
                    {selectedQuestion ? (
                        <div className="max-w-3xl mx-auto animate-fade-in">
                            <Card className="border-none shadow-2xl p-6 md:p-12 rounded-[2rem] bg-white dark:bg-slate-900">
                                 <div className="mb-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                                    <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-md text-[9px] font-black uppercase tracking-[0.2em] mb-4">Question Analysis</span>
                                    <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-relaxed">{selectedQuestion.questionText}</p>
                                 </div>
                                 
                                 <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">Multiple Choice Options</p>
                                    {(selectedQuestion.options || []).map((option, index) => {
                                        const isCorrect = option === selectedQuestion.correctAnswer;
                                        const letters = ['A', 'B', 'C', 'D', 'E'];
                                        return (
                                            <div key={index} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${isCorrect
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 shadow-md'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] border ${isCorrect ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'}`}>
                                                        {letters[index]}
                                                    </span>
                                                    <span className={`text-md font-bold ${isCorrect ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-600 dark:text-slate-400'}`}>{option}</span>
                                                </div>
                                                {isCorrect && (
                                                    <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Verified Solution</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                 </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center p-12">
                            <div className="max-w-sm space-y-6">
                                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-slate-50 dark:border-slate-800">
                                    <DatabaseIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Repository Entry</h2>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-loose">Select a question from the explorer to preview the verified academic content and solutions.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default QuestionBankScreen;
