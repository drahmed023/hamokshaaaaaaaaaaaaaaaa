
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudyAids } from '../hooks/useStudyAids';
import { StudyAidsActionType, Flashcard, MindMap, Summary, FlashcardDeck, GamificationActionType } from '../types';
import { generateStudyAid } from '../services/geminiService';
import { parseFileToText } from '../utils/fileParser';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import FlashcardComponent from '../components/Flashcard';
import MindMapNode from '../components/MindMapNode';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { useGamification } from '../hooks/useGamification';
import { ClockIcon } from '../components/icons/ClockIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { useDropzone } from 'react-dropzone';

type AidType = 'summary' | 'flashcards' | 'mind-map';
type Tab = 'generator' | 'library' | 'focus';

function StudyAidsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>('generator');
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [title, setTitle] = useState('');
    const [aidType, setAidType] = useState<AidType>('summary');
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { summaries, flashcardDecks, mindMaps, dispatch } = useStudyAids();
    const { dispatch: gamificationDispatch } = useGamification();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.content) {
            setText(location.state.content);
            const passedFileName = location.state.fileName || '';
            setFileName(passedFileName);
            setTitle(passedFileName.replace(/\.[^/.]+$/, ""));
            // Clear the state
            navigate('.', { replace: true, state: {} });
        }
    }, [location, navigate]);
    
    const handleFile = async (file: File) => {
        if (file) {
            setFileName(file.name);
            setIsLoading(true);
            setError(null);
            try {
                const content = await parseFileToText(file);
                setText(content);
                setTitle(file.name.replace(/\.[^/.]+$/, "")); 
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleFile(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        disabled: isLoading
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) {
            setError('Please enter text or upload a file.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);

        try {
            const result = await generateStudyAid(text, aidType);
            setGeneratedContent(result);
            if (!title) setTitle(text.substring(0, 40) + "...");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!generatedContent || !title.trim()) {
            setError("Title is required to save.");
            return;
        }

        const id = Date.now().toString();

        if (aidType === 'summary') {
            const newSummary: Summary = { id, title, content: generatedContent };
            dispatch({ type: StudyAidsActionType.ADD_SUMMARY, payload: newSummary });
        } else if (aidType === 'flashcards') {
            const newDeck: FlashcardDeck = {
                id,
                title,
                cards: (generatedContent || []).map((card: any) => ({
                    ...card,
                    id: `${id}-${card.front?.slice(0, 10) || Math.random()}`,
                    nextReview: new Date().toISOString(),
                    interval: 1,
                    easeFactor: 2.5,
                }))
            };
            dispatch({ type: StudyAidsActionType.ADD_FLASHCARD_DECK, payload: newDeck });
        } else if (aidType === 'mind-map') {
            const newMindMap: MindMap = { id, title, root: generatedContent };
            dispatch({ type: StudyAidsActionType.ADD_MIND_MAP, payload: newMindMap });
        }
        
        gamificationDispatch({ type: GamificationActionType.ADD_XP, payload: 50 });
        setActiveTab('library');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Study Center</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Your hub for creating and managing learning materials.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex gap-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === 'generator'
                                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        AI Generator
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === 'library'
                                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        My Library
                    </button>
                    <button
                        onClick={() => setActiveTab('focus')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            activeTab === 'focus'
                                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <ClockIcon className="w-4 h-4" />
                        Focus Room
                    </button>
                </div>
            </div>

            {/* GENERATOR TAB */}
            {activeTab === 'generator' && (
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-primary-500" />
                            Create New Study Aid
                        </h2>
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <textarea
                                rows={8}
                                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700/50 dark:border-slate-600 transition-all resize-none"
                                placeholder="Paste your study notes, lecture transcript, or text here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={isLoading}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Input Source</label>
                                    <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input {...getInputProps()} />
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                <FileTextIcon className="w-6 h-6 text-primary-500" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-medium text-slate-700 dark:text-slate-200 text-sm">
                                                    {isDragActive ? 'Drop file here...' : (fileName ? `Selected: ${fileName}` : 'Drag & drop or click to upload')}
                                                </span>
                                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                                    .pdf, .docx, .txt
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Output Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['summary', 'flashcards', 'mind-map'] as AidType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setAidType(type)}
                                                className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${
                                                    aidType === type
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                        : 'border-transparent bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</div>}
                            
                            <Button type="submit" size="lg" disabled={isLoading || !text} className="w-full shadow-lg shadow-primary-500/20">
                                {isLoading && !generatedContent ? <Loader text="AI is working its magic..." /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <SparklesIcon className="w-5 h-5" />
                                        <span>Generate Content</span>
                                    </div>
                                )}
                            </Button>
                        </form>
                    </Card>

                    {generatedContent && (
                        <div className="mt-8 animate-fade-in">
                            <Card className="border-primary-200 dark:border-primary-900/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Preview: {aidType.replace('-', ' ')}</h2>
                                    <Button onClick={handleSave} disabled={!title.trim()}>
                                        Save to Library
                                    </Button>
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="save-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Title
                                    </label>
                                    <input
                                        id="save-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter a title to save..."
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>

                                <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto">
                                    {aidType === 'summary' && <p className="whitespace-pre-wrap leading-relaxed">{generatedContent}</p>}
                                    {aidType === 'flashcards' && Array.isArray(generatedContent) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {generatedContent.map((fc: any, index: number) => <div key={index}><FlashcardComponent front={fc.front} back={fc.back} /></div>)}
                                        </div>
                                    )}
                                    {aidType === 'mind-map' && (
                                        <ul className="list-none p-0">
                                            <li className="my-2"><MindMapNode node={generatedContent} /></li>
                                        </ul>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onClick={() => navigate('/saved-items')} className="cursor-pointer group">
                            <Card className="h-full hover:border-primary-500 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                        <FileTextIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Summaries</h3>
                                        <p className="text-slate-500 text-sm">{summaries.length} items</p>
                                    </div>
                                </div>
                                <Button variant="secondary" className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">View Summaries</Button>
                            </Card>
                        </div>
                        <div onClick={() => navigate('/saved-items')} className="cursor-pointer group">
                            <Card className="h-full hover:border-primary-500 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                        <BookOpenIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Flashcards</h3>
                                        <p className="text-slate-500 text-sm">{flashcardDecks.length} decks</p>
                                    </div>
                                </div>
                                <Button variant="secondary" className="w-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20">Review Decks</Button>
                            </Card>
                        </div>
                        <div onClick={() => navigate('/saved-items')} className="cursor-pointer group">
                            <Card className="h-full hover:border-primary-500 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                        <SparklesIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Mind Maps</h3>
                                        <p className="text-slate-500 text-sm">{mindMaps.length} maps</p>
                                    </div>
                                </div>
                                <Button variant="secondary" className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20">Explore Maps</Button>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* FOCUS TAB */}
            {activeTab === 'focus' && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-indigo-200 dark:border-indigo-900">
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 dark:shadow-none">
                                <ClockIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">Deep Work Session</h2>
                            <p className="text-indigo-600 dark:text-indigo-300 max-w-md mx-auto mb-8">
                                Enter the Pomodoro Focus Room to eliminate distractions, track your study time, and boost productivity with AI-driven motivation.
                            </p>
                            <Button onClick={() => navigate('/pomodoro')} size="lg" className="px-10 py-4 text-lg shadow-xl shadow-indigo-500/30">
                                Enter Focus Room
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StudyAidsScreen;
