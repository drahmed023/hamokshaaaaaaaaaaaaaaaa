





import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudyAids } from '../hooks/useStudyAids';
import { StudyAidsActionType, Flashcard as FlashcardType, GamificationActionType } from '../types';
import Flashcard from '../components/Flashcard';
import Button from '../components/Button';
import Card from '../components/Card';
import { useGamification } from '../hooks/useGamification';

function FlashcardReviewScreen() {
    const { deckId } = useParams<{ deckId: string }>();
    const { flashcardDecks, dispatch } = useStudyAids();
    const { dispatch: gamificationDispatch } = useGamification();
    const navigate = useNavigate();
    
    const deck = useMemo(() => flashcardDecks.find(d => d.id === deckId), [deckId, flashcardDecks]);
    
    const cardsToReview = useMemo(() => {
        if (!deck) return [];
        const now = new Date();
        return deck.cards
            .filter(card => new Date(card.nextReview) <= now)
            .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    }, [deck]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!deck) {
        return <div className="text-center">Deck not found.</div>;
    }
    
    if (cardsToReview.length === 0) {
        return (
            // Fix: Added children to Card component to resolve missing prop error.
            <Card className="text-center">
                <h2 className="text-2xl font-bold">All done for now!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">You have no cards due for review in this deck.</p>
                {/* Fix: Added children to Button component to resolve missing prop error. */}
                <Button onClick={() => navigate('/saved-items')} className="mt-4">Back to Saved Items</Button>
            </Card>
        );
    }
    
    const handleConfidence = (rating: 'again' | 'good' | 'easy') => {
        const card = cardsToReview[currentIndex];
        let newInterval: number;
        let newEaseFactor: number;
        let xpGained = 0;

        if (rating === 'again') {
            newInterval = 1; // Start over
            newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
            xpGained = 1;
        } else {
            if (rating === 'good') {
                newInterval = Math.ceil(card.interval * card.easeFactor);
                newEaseFactor = card.easeFactor;
                xpGained = 5;
            } else { // 'easy'
                newInterval = Math.ceil(card.interval * (card.easeFactor + 0.15));
                newEaseFactor = card.easeFactor + 0.15;
                xpGained = 10;
            }
        }
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        const updatedCard: FlashcardType = {
            ...card,
            interval: newInterval,
            easeFactor: newEaseFactor,
            nextReview: nextReviewDate.toISOString(),
        };

        const updatedDeck = {
            ...deck,
            cards: deck.cards.map(c => c.id === updatedCard.id ? updatedCard : c),
        };
        
        dispatch({ type: StudyAidsActionType.UPDATE_FLASHCARD_DECK, payload: updatedDeck });
        gamificationDispatch({ type: GamificationActionType.ADD_XP, payload: xpGained });

        // Move to next card
        setIsFlipped(false);
        if (currentIndex < cardsToReview.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Last card, finish session
            alert("Review session complete!");
            navigate('/saved-items');
        }
    };
    
    const currentCard = cardsToReview[currentIndex];

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center gap-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Reviewing: {deck.title}</h1>
                <p className="text-slate-500 dark:text-slate-400">Cards due: {cardsToReview.length}</p>
            </div>
            <div className="w-full" onClick={() => setIsFlipped(!isFlipped)}>
                <Flashcard front={currentCard.front} back={currentCard.back} />
            </div>
            
            <p className="font-medium">{currentIndex + 1} / {cardsToReview.length}</p>

            {isFlipped && (
                <div className="flex items-center gap-2 sm:gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="font-semibold text-sm mr-2">How well did you know this?</p>
                    {/* Fix: Added children to Button components to resolve missing prop errors. */}
                    <Button onClick={() => handleConfidence('again')} variant="danger" size="sm">Again (+1 XP)</Button>
                    <Button onClick={() => handleConfidence('good')} variant="secondary" size="sm">Good (+5 XP)</Button>
                    <Button onClick={() => handleConfidence('easy')} size="sm">Easy (+10 XP)</Button>
                </div>
            )}
        </div>
    );
};

export default FlashcardReviewScreen;