import React from 'react';

export default function ChaiSteamingCup({ isOpen }) {
  if (!isOpen) {
    return (
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {/* Subtle closed / resting tapri kettle in light theme */}
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl shadow-sm">
          🌙
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
      {/* Three steaming smoke trails */}
      <div className="absolute -top-3 flex justify-center gap-2.5 z-10 pointer-events-none">
        <div className="w-1.5 h-6 rounded-full bg-gradient-to-t from-orange-400/90 to-transparent animate-steam-1"></div>
        <div className="w-2 h-7 rounded-full bg-gradient-to-t from-amber-500/90 to-transparent animate-steam-2"></div>
        <div className="w-1.5 h-5 rounded-full bg-gradient-to-t from-orange-400/90 to-transparent animate-steam-3"></div>
      </div>

      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

      {/* SVG Clay Kulhad Cup */}
      <svg className="w-20 h-20 relative z-0 drop-shadow-[0_8px_16px_rgba(234,88,12,0.4)]" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="kulhadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="teaSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="clayTexture" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Kulhad Body */}
        <path
          d="M 24 34 L 32 86 C 33 90, 67 90, 68 86 L 76 34 Z"
          fill="url(#kulhadGradient)"
        />
        {/* Shading Overlay */}
        <path
          d="M 24 34 L 32 86 C 33 90, 67 90, 68 86 L 76 34 Z"
          fill="url(#clayTexture)"
        />

        {/* Handcrafted Kulhad Ridge Rings */}
        <path d="M 26 46 Q 50 51 74 46" stroke="#7c2d12" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
        <path d="M 28 60 Q 50 64 72 60" stroke="#7c2d12" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />

        {/* Steaming Tea Surface Rim */}
        <ellipse cx="50" cy="34" rx="26" ry="9" fill="#9a3412" />
        <ellipse cx="50" cy="34" rx="24" ry="7.5" fill="url(#teaSurface)" />

        {/* Malai / Foam swirl */}
        <ellipse cx="46" cy="34" rx="7" ry="2" fill="#fffbeb" opacity="0.4" />
      </svg>
    </div>
  );
}

