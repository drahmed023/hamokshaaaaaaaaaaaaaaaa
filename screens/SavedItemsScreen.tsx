





import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudyAids } from '../hooks/useStudyAids';
import Card from '../components/Card';
import Button from '../components/Button';
import { StudyAidsActionType } from '../types';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { BrainCircuitIcon } from '../components/icons/BrainCircuitIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';

function SavedItemsScreen() {
  const { summaries, flashcardDecks, mindMaps, dispatch } = useStudyAids();
  const navigate = useNavigate();

  const handleDelete = (type: 'summary' | 'deck' | 'map', id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      if (type === 'summary') {
        dispatch({ type: StudyAidsActionType.DELETE_SUMMARY, payload: id });
      } else if (type === 'deck') {
        dispatch({ type: StudyAidsActionType.DELETE_FLASHCARD_DECK, payload: id });
      } else if (type === 'map') {
        dispatch({ type: StudyAidsActionType.DELETE_MIND_MAP, payload: id });
      }
    }
  };

  const hasItems = summaries.length > 0 || flashcardDecks.length > 0 || mindMaps.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Saved Study Aids</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review, manage, and delete your generated materials.</p>
      </div>

      {!hasItems ? (
        // Fix: Added children to Card component to resolve missing prop error.
        <Card className="text-center py-12">
          <SparklesIcon className="w-16 h-16 mx-auto text-slate-400" />
          <h2 className="text-2xl font-bold mt-4">No Saved Items Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Create some study aids to see them here.</p>
          {/* Fix: Added children to Button component to resolve missing prop error. */}
          <Button onClick={() => navigate('/study-aids')} className="mt-6">
            Generate Study Aids
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Summaries */}
          {summaries.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><FileTextIcon className="w-6 h-6" /> Summaries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaries.map(summary => (
                  <div key={summary.id}>
                    {/* Fix: Added children to Card component to resolve missing prop error. */}
                    <Card>
                      <h3 className="font-bold truncate">{summary.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 h-10 overflow-hidden text-ellipsis">{summary.content}</p>
                      <div className="mt-4 flex justify-between items-center">
                        {/* Fix: Added children to Button component to resolve missing prop error. */}
                        <Button onClick={() => navigate(`/summary/${summary.id}`)} variant="secondary">View & Edit</Button>
                        <button onClick={() => handleDelete('summary', summary.id, summary.title)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flashcard Decks */}
          {flashcardDecks.length > 0 && (
             <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpenIcon className="w-6 h-6" /> Flashcard Decks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcardDecks.map(deck => (
                  <div key={deck.id}>
                    {/* Fix: Added children to Card component to resolve missing prop error. */}
                    <Card>
                      <h3 className="font-bold">{deck.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{deck.cards.length} cards</p>
                      <div className="mt-4 flex justify-between items-center">
                        {/* Fix: Added children to Button component to resolve missing prop error. */}
                        <Button onClick={() => navigate(`/review/deck/${deck.id}`)}>Start Review</Button>
                        <button onClick={() => handleDelete('deck', deck.id, deck.title)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mind Maps */}
          {mindMaps.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BrainCircuitIcon className="w-6 h-6" /> Mind Maps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mindMaps.map(map => (
                  <div key={map.id}>
                    {/* Fix: Added children to Card component to resolve missing prop error. */}
                    <Card>
                      <h3 className="font-bold">{map.title}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Central Topic: {map.root.topic}</p>
                      <div className="mt-4 flex justify-between items-center">
                        {/* Fix: Added children to Button component to resolve missing prop error. */}
                        <Button onClick={() => navigate(`/mind-map/${map.id}`)} variant="secondary">View Map</Button>
                        <button onClick={() => handleDelete('map', map.id, map.title)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedItemsScreen;