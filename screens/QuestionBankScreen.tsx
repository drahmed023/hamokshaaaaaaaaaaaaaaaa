
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { Question } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { SearchIcon } from '../components/icons/SearchIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';

function QuestionBankScreen() {
    const { fileName } = useParams<{ fileName: string }>();
    const navigate = useNavigate();
    const { exams } = useExam();
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const uniqueQuestions = useMemo(() => {
        if (!fileName) return [];

        const decodedFileName = decodeURIComponent(fileName);
        const relevantExams = exams.filter(exam => exam.sourceFileName === decodedFileName);
        const allQuestions = relevantExams.flatMap(exam => exam.questions);

        // De-duplicate questions based on questionText
        const questionMap = new Map<string, Question>();
        allQuestions.forEach(q => {
            if (!questionMap.has(q.questionText)) {
                questionMap.set(q.questionText, q);
            }
        });
        return Array.from(questionMap.values());
    }, [exams, fileName]);

    const filteredQuestions = useMemo(() => {
        if (!searchTerm) return uniqueQuestions;
        return uniqueQuestions.filter(q =>
            q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [uniqueQuestions, searchTerm]);

    if (!fileName) {
        return <div>Error: No file specified for the question bank.</div>;
    }

    return (
        <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] flex flex-col">
            <header className="flex-shrink-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border-b border-white/30 dark:border-slate-700/50 z-30 relative">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <DatabaseIcon className="w-6 h-6 text-primary-500" />
                        <h1 className="text-xl font-bold truncate">Question Bank: {decodeURIComponent(fileName)}</h1>
                    </div>
                    <Button onClick={() => navigate('/history')} variant="secondary" size="sm">
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Back to History
                    </Button>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-white/20 dark:bg-slate-800/20 backdrop-blur-lg flex flex-col flex-shrink-0 border-r border-white/20 dark:border-slate-700/50">
                    <div className="p-4 border-b border-white/20 dark:border-slate-700/50">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/20 dark:bg-slate-700/50 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2">
                        <ul className="space-y-1">
                            {filteredQuestions.map((q, index) => (
                                <li key={q.id}>
                                    <button
                                        onClick={() => setSelectedQuestion(q)}
                                        className={`w-full text-left p-2 rounded-md flex items-start gap-3 transition-colors ${selectedQuestion?.id === q.id ? 'bg-primary-600 text-white' : 'hover:bg-white/20 dark:hover:bg-white/10'}`}
                                    >
                                        <span className="font-semibold text-sm">{index + 1}.</span>
                                        <span className="flex-grow text-sm truncate">{q.questionText}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                    {selectedQuestion ? (
                        <Card>
                             <p className="text-lg font-semibold mb-6">{selectedQuestion.questionText}</p>
                             <div className="space-y-3">
                                {selectedQuestion.options.map((option, index) => (
                                    <div key={index} className={`p-4 border rounded-lg ${option === selectedQuestion.correctAnswer
                                            ? 'bg-green-100 dark:bg-green-900/40 border-green-500 font-semibold'
                                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {option}
                                    </div>
                                ))}
                             </div>
                        </Card>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                            <div>
                                <DatabaseIcon className="w-16 h-16 mx-auto text-slate-400" />
                                <h2 className="mt-4 text-xl font-bold">Select a Question</h2>
                                <p>Choose a question from the list on the left to view its details.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default QuestionBankScreen;
