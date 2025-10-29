import React, { useState } from 'react';

type FlashcardProps = {
  front: string;
  back: string;
};

function Flashcard({ front, back }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full h-64 [perspective:1000px]" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute w-full h-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg flex items-center justify-center p-6 text-center [backface-visibility:hidden]">
          <p className="text-xl font-semibold">{front}</p>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full bg-primary-50 dark:bg-slate-800 border border-primary-200 dark:border-slate-600 rounded-lg shadow-lg flex items-center justify-center p-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-lg">{back}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;