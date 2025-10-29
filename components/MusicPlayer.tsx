import React, { useRef, useEffect } from 'react';
import { useMusic } from '../hooks/useMusic';
import { musicTracks } from '../data/music';

function MusicPlayer() {
  const { currentTrackId, isPlaying, volume } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (currentTrackId) {
        const track = musicTracks.find(t => t.id === currentTrackId);
        if (track && audioRef.current.src !== track.url) {
          audioRef.current.src = track.url;
        }
      } else {
        audioRef.current.src = '';
      }
    }
  }, [currentTrackId]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentTrackId) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  return <audio ref={audioRef} loop />;
};

export default MusicPlayer;