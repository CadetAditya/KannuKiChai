import React, { useState, useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Camera, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { sound } from '../utils/sound';

export default function AestheticBackground() {
  const { gallery } = useRealtime();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activePhotos = (gallery && gallery.length > 0)
    ? gallery.filter(p => p.active !== false)
    : [];

  useEffect(() => {
    if (activePhotos.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activePhotos.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [activePhotos.length, isPaused]);

  if (activePhotos.length === 0) return null;

  const currentPhoto = activePhotos[currentIndex % activePhotos.length];

  const handleNext = (e) => {
    e.stopPropagation();
    sound.playTap();
    setCurrentIndex(prev => (prev + 1) % activePhotos.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    sound.playTap();
    setCurrentIndex(prev => (prev - 1 + activePhotos.length) % activePhotos.length);
  };

  const togglePause = (e) => {
    e.stopPropagation();
    sound.playTap();
    setIsPaused(prev => !prev);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Photo Rotation Layers with Ken-Burns and Crossfade */}
      {activePhotos.map((photo, index) => {
        const isActive = index === (currentIndex % activePhotos.length);
        return (
          <div
            key={photo.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={`w-full h-full bg-cover bg-center transition-transform duration-[8000ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url(${photo.url})`,
                filter: 'saturate(1.15) contrast(1.05)'
              }}
            />
          </div>
        );
      })}

      {/* Aesthetic Light Chai Scrim & Gradients */}
      {/* 1. Soft creamy warm base overlay */}
      <div className="absolute inset-0 bg-[#f7f4ed]/80 transition-opacity duration-500" />

      {/* 2. Soft golden hour vignette and contrast layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/75 to-[#f7f4ed]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f7f4ed]/90 via-transparent to-[#f7f4ed] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none" />

      {/* Bottom Floating Photo Pill & Micro Controls in Light Theme */}
      <div className="absolute bottom-3 left-4 right-4 max-w-md mx-auto flex items-center justify-between pointer-events-auto z-10 text-[10px] text-stone-600 select-none">
        {/* Caption */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/80 shadow-sm shadow-stone-900/5">
          <Camera size={12} className="text-orange-500" />
          <span className="font-semibold text-stone-800 max-w-[150px] xs:max-w-[190px] truncate">
            {currentPhoto?.title || 'Campus Chai Memories'}
          </span>
          <span className="text-stone-400 font-mono text-[9px]">
            {currentIndex + 1}/{activePhotos.length}
          </span>
        </div>

        {/* Rotation Dots & Mini Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-stone-200/80 px-2 py-1 rounded-full shadow-sm shadow-stone-900/5">
          <button
            onClick={handlePrev}
            className="p-0.5 text-stone-500 hover:text-stone-800"
            title="Previous photo"
          >
            <ChevronLeft size={13} />
          </button>

          <button
            onClick={togglePause}
            className="p-0.5 text-stone-500 hover:text-stone-800"
            title={isPaused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {isPaused ? <Play size={11} className="text-orange-500" /> : <Pause size={11} />}
          </button>

          <button
            onClick={handleNext}
            className="p-0.5 text-stone-500 hover:text-stone-800"
            title="Next photo"
          >
            <ChevronRight size={13} />
          </button>

          {/* Dots */}
          <div className="hidden xs:flex items-center gap-1 pl-1 border-l border-stone-200 ml-0.5">
            {activePhotos.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${
                  i === (currentIndex % activePhotos.length)
                    ? 'w-2.5 bg-orange-500'
                    : 'bg-stone-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
