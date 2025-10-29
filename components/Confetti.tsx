import React from 'react';

function Confetti() {
    const confettiCount = 50;
    const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa'];

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
            {Array.from({ length: confettiCount }).map((_, i) => {
                const style = {
                    left: `${Math.random() * 100}%`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                };
                return <div key={i} className="confetti-piece" style={style}></div>;
            })}
        </div>
    );
};

export default Confetti;