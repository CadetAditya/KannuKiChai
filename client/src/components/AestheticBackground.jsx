import React, { useState, useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Camera, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

export default function AestheticBackground() {
  const { gallery } = useRealtime();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [brightness, setBrightness] = useState(35); // 20% to 55%

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
                filter: 'saturate(1.2) contrast(1.05)'
              }}
            />
          </div>
        );
      })}

      {/* Cinematic Tapri Scrim & Gradients */}
      {/* 1. Base dark tint controlled by brightness slider */}
      <div
        className="absolute inset-0 bg-[#090604] transition-opacity duration-500"
        style={{ opacity: 1 - brightness / 100 }}
      />

      {/* 2. Warm Chai Terracotta & Masala Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090604] via-[#090604]/80 to-[#090604]/50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090604]/90 via-transparent to-[#090604] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-black/60 pointer-events-none" />

      {/* Bottom Floating Photo Pill & Micro Controls */}
      <div className="absolute bottom-3 left-4 right-4 max-w-md mx-auto flex items-center justify-between pointer-events-auto z-10 text-[10px] text-[#a89080] select-none">
        {/* Caption */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#140e0a]/80 backdrop-blur-md border border-white/10 shadow-lg">
          <Camera size={11} className="text-orange-400" />
          <span className="font-medium text-white max-w-[150px] xs:max-w-[190px] truncate">
            {currentPhoto?.title || 'Campus Chai Memories'}
          </span>
          <span className="text-[#8a7263] font-mono text-[9px]">
            {currentIndex + 1}/{activePhotos.length}
          </span>
        </div>

        {/* Rotation Dots & Mini Controls */}
        <div className="flex items-center gap-1 bg-[#140e0a]/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full shadow-lg">
          <button
            onClick={handlePrev}
            className="p-0.5 hover:text-white"
            title="Previous photo"
          >
            <ChevronLeft size={12} />
          </button>

          <button
            onClick={togglePause}
            className="p-0.5 hover:text-white"
            title={isPaused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {isPaused ? <Play size={10} className="text-orange-400" /> : <Pause size={10} />}
          </button>

          <button
            onClick={handleNext}
            className="p-0.5 hover:text-white"
            title="Next photo"
          >
            <ChevronRight size={12} />
          </button>

          {/* Dots */}
          <div className="hidden xs:flex items-center gap-1 pl-1 border-l border-white/10 ml-0.5">
            {activePhotos.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${
                  i === (currentIndex % activePhotos.length)
                    ? 'w-2.5 bg-orange-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
