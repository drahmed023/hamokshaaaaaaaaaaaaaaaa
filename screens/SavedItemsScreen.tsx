import React, { useState } from 'react';
import { useStudyAids } from '../hooks/useStudyAids';
import { StudyAidsActionType } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import MindMapNode from '../components/MindMapNode';
import { useNavigate } from 'react-router-dom';

type Tab = 'summaries' | 'flashcards' | 'mindmaps';

const SavedItemsScreen: React.FC = () => {
    const { summaries, flashcardDecks, mindMaps, dispatch } = useStudyAids();
    const [activeTab, setActiveTab] = useState<Tab>('summaries');
    const navigate = useNavigate();

    const renderTabs = () => (
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('summaries')} className={`${tabStyles} ${activeTab === 'summaries' ? activeTabStyles : inactiveTabStyles}`}>Summaries</button>
                <button onClick={() => setActiveTab('flashcards')} className={`${tabStyles} ${activeTab === 'flashcards' ? activeTabStyles : inactiveTabStyles}`}>Flashcards</button>
                <button onClick={() => setActiveTab('mindmaps')} className={`${tabStyles} ${activeTab === 'mindmaps' ? activeTabStyles : inactiveTabStyles}`}>Mind Maps</button>
            </nav>
        </div>
    );

    const tabStyles = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm";
    const activeTabStyles = "border-indigo-500 text-indigo-600 dark:text-indigo-400";
    const inactiveTabStyles = "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600";
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-center">Saved Study Items</h1>
            {renderTabs()}

            {activeTab === 'summaries' && (
                <div className="space-y-4">
                    {summaries.length > 0 ? summaries.map(s => (
                        <Card key={s.id}>
                            <h3 className="font-bold text-lg">{s.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">{s.content}</p>
                            <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="danger" onClick={() => dispatch({ type: StudyAidsActionType.DELETE_SUMMARY, payload: {id: s.id} })}>Delete</Button>
                            </div>
                        </Card>
                    )) : <p>No summaries saved yet.</p>}
                </div>
            )}

            {activeTab === 'flashcards' && (
                <div className="space-y-4">
                    {flashcardDecks.length > 0 ? flashcardDecks.map(deck => (
                        <Card key={deck.id}>
                            <h3 className="font-bold text-lg">{deck.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{deck.cards.length} cards</p>
                            <div className="mt-4 flex gap-2">
                                <Button size="sm" onClick={() => navigate(`/flashcard-review/${deck.id}`)}>Review Deck</Button>
                                <Button size="sm" variant="danger" onClick={() => dispatch({ type: StudyAidsActionType.DELETE_FLASHCARD_DECK, payload: {id: deck.id} })}>Delete</Button>
                            </div>
                        </Card>
                    )) : <p>No flashcard decks saved yet.</p>}
                </div>
            )}

            {activeTab === 'mindmaps' && (
                 <div className="space-y-4">
                    {mindMaps.length > 0 ? mindMaps.map(map => (
                        <Card key={map.id}>
                            <h3 className="font-bold text-lg">{map.title}</h3>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400">View Map</summary>
                                <ul className="list-none p-0 mt-2">
                                    <MindMapNode node={map.root} />
                                </ul>
                            </details>
                             <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="danger" onClick={() => dispatch({ type: StudyAidsActionType.DELETE_MIND_MAP, payload: {id: map.id} })}>Delete</Button>
                            </div>
                        </Card>
                    )) : <p>No mind maps saved yet.</p>}
                 </div>
            )}
        </div>
    );
};

export default SavedItemsScreen;