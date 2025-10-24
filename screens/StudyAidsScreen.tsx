import React, { useState } from 'react';
import { useStudyAids } from '../hooks/useStudyAids';
import { StudyAidsActionType, Flashcard, MindMap, Summary, FlashcardDeck } from '../types';
import { generateStudyAid } from '../services/geminiService';
import { parseFileToText } from '../utils/fileParser';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import FlashcardComponent from '../components/Flashcard';
import MindMapNode from '../components/MindMapNode';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';

type AidType = 'summary' | 'flashcards' | 'mind-map';

const StudyAidsScreen: React.FC = () => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [title, setTitle] = useState('');
    const [aidType, setAidType] = useState<AidType>('summary');
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { dispatch } = useStudyAids();
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setIsLoading(true);
            setError(null);
            try {
                const content = await parseFileToText(file);
                setText(content);
                setTitle(file.name.replace(/\.[^/.]+$/, "")); // Use file name as title
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

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
                cards: generatedContent.map((card: any) => ({
                    ...card,
                    id: `${id}-${card.front.slice(0, 10)}`,
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
        
        // Reset form
        setGeneratedContent(null);
        setTitle('');
        alert(`"${title}" saved successfully!`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">AI Study Aids</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Generate summaries, flashcards, and mind maps automatically.</p>
            </div>

            <Card>
                <form onSubmit={handleGenerate} className="space-y-6">
                    <textarea
                        rows={8}
                        className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                        placeholder="Paste your study content here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium">
                            <FileTextIcon className="w-5 h-5" />
                            <span>{fileName || 'Or choose a file (.txt)'}</span>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt" disabled={isLoading} />
                        </label>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <Button type="button" size="sm" variant={aidType === 'summary' ? 'primary' : 'secondary'} onClick={() => setAidType('summary')}>Summary</Button>
                            <Button type="button" size="sm" variant={aidType === 'flashcards' ? 'primary' : 'secondary'} onClick={() => setAidType('flashcards')}>Flashcards</Button>
                            <Button type="button" size="sm" variant={aidType === 'mind-map' ? 'primary' : 'secondary'} onClick={() => setAidType('mind-map')}>Mind Map</Button>
                        </div>
                    </div>
                    {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}
                    <Button type="submit" size="lg" disabled={isLoading || !text} className="w-full">
                        {isLoading && !generatedContent ? <Loader text="Generating..." /> : (
                            <div className="flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5" />
                                <span>{`Generate ${aidType.replace('-', ' ')}`}</span>
                            </div>
                        )}
                    </Button>
                </form>
            </Card>

            {generatedContent && (
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Generated {aidType.replace('-', ' ')}</h2>
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
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                        />
                    </div>

                    {aidType === 'summary' && <p className="whitespace-pre-wrap">{generatedContent}</p>}
                    {aidType === 'flashcards' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedContent.map((fc: any, index: number) => <FlashcardComponent key={index} front={fc.front} back={fc.back} />)}
                        </div>
                    )}
                    {aidType === 'mind-map' && (
                         <ul className="list-none p-0">
                             <MindMapNode node={generatedContent} />
                         </ul>
                    )}

                    <div className="mt-6 border-t pt-4 border-slate-200 dark:border-slate-700">
                        <Button onClick={handleSave} disabled={!title.trim()} className="w-full">
                            Save "{title}"
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StudyAidsScreen;