import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Camera, Heart, Plus, Sparkles, X, User, Clock, ChevronRight } from 'lucide-react';
import { sound } from '../utils/sound';
import ShareMomentModal from './ShareMomentModal';

export default function YesterdaysMoments() {
  const { moments } = useRealtime();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likedMap, setLikedMap] = useState({});

  const approvedMoments = (moments && moments.length > 0)
    ? moments.filter(m => m.status === 'approved')
    : [];

  const handleLike = async (e, momentId) => {
    e.stopPropagation();
    sound.playTap();

    // Optimistic like
    setLikedMap(prev => ({
      ...prev,
      [momentId]: (prev[momentId] || 0) + 1
    }));

    try {
      await fetch(`/api/moments/${momentId}/like`, { method: 'POST' });
    } catch (err) {}
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Camera size={14} />
            </span>
            <h3 className="text-sm font-bold text-stone-900 font-heading tracking-tight">
              Yesterday's Moments
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Campus memories & chai cheer circles ☕
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            sound.playTap();
            setShowShareModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all"
        >
          <Plus size={13} />
          <span>Share Moment</span>
        </button>
      </div>

      {/* Horizontal Scrollable Moments Cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-1 -mx-1 snap-x">
        {approvedMoments.map(moment => {
          const totalLikes = (moment.likes || 0) + (likedMap[moment.id] || 0);
          const isLiked = Boolean(likedMap[moment.id]);

          return (
            <div
              key={moment.id}
              onClick={() => {
                sound.playTap();
                setSelectedPhoto(moment);
              }}
              className="flex-shrink-0 w-64 snap-start rounded-2xl bg-white border border-stone-200/90 shadow-sm overflow-hidden hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group"
            >
              {/* Photo preview */}
              <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                <img
                  src={moment.url}
                  alt={moment.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Like / Cheer button on image */}
                <button
                  onClick={(e) => handleLike(e, moment.id)}
                  className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm transition-all active:scale-90 ${
                    isLiked
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/90 text-stone-800 hover:bg-white'
                  }`}
                >
                  <span className="text-xs">☕</span>
                  <span className="font-mono text-[11px]">{totalLikes}</span>
                </button>

                {/* Caption on image */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <p className="text-xs font-bold text-white drop-shadow-md truncate font-heading">
                    {moment.title}
                  </p>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-3 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1 truncate max-w-[130px] font-medium text-stone-700">
                  <User size={11} className="text-orange-500 flex-shrink-0" />
                  <span className="truncate">{moment.author || 'Student'}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-stone-400">
                  <Clock size={10} />
                  <span>{moment.time || 'Yesterday'}</span>
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty state / Prompt to share first moment */}
        {approvedMoments.length === 0 && (
          <div className="w-full py-8 text-center bg-white/80 rounded-2xl border border-stone-200/80 p-4 space-y-2">
            <p className="text-xs font-bold text-stone-800">
              No moments shared yet!
            </p>
            <p className="text-[11px] text-stone-500">
              Be the first to share a photo from yesterday's tapri chai session.
            </p>
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
            >
              Upload Photo
            </button>
          </div>
        )}
      </div>

      {/* Share Modal Drawer */}
      <ShareMomentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3"
          >
            <div className="relative max-h-[65vh] overflow-hidden bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-auto max-h-[65vh] object-contain mx-auto"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 pt-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-stone-900 font-heading">
                  {selectedPhoto.title}
                </h4>
                <button
                  onClick={(e) => handleLike(e, selectedPhoto.id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-bold text-xs border border-orange-200"
                >
                  <span>☕</span>
                  <span className="font-mono">
                    {(selectedPhoto.likes || 0) + (likedMap[selectedPhoto.id] || 0)} cheers
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                <span className="font-medium text-stone-700">
                  Shared by {selectedPhoto.author}
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedPhoto.time || 'Yesterday'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

