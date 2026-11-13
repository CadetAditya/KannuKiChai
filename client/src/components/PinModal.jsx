import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Lock, Unlock, X, Delete, Shield, KeyRound, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

export default function PinModal({ isOpen, onClose }) {
  const { setAuthRole, setAuthPin } = useRealtime();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (loading) return;
    sound.playTap();
    setError('');

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    sound.playTap();
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    sound.playTap();
    setPin('');
    setError('');
  };

  const verifyPin = async (submittedPin) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: submittedPin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sound.playSuccess();
        setAuthRole(data.role); // 'operator' or 'admin'
        setAuthPin(submittedPin);
        onClose();
      } else {
        triggerError(data.error || 'Incorrect PIN');
      }
    } catch (err) {
      triggerError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg) => {
    sound.playWarning();
    setError(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#130d09] border border-[#382214] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Staff & Admin Access
              </h3>
              <p className="text-[11px] text-[#9a8274]">
                Enter 4-Digit Security PIN
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/5 text-[#a89080] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* PIN Dots Display with Shake */}
        <div className={`flex flex-col items-center py-2 ${shake ? 'animate-bounce' : ''}`}>
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3].map(idx => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isFilled
                      ? 'bg-orange-500 border-orange-400 scale-110 shadow-md shadow-orange-500/50'
                      : 'border-[#42291a] bg-[#1a110b]'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {error ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-[#786153]">
              Shopkeeper PIN (1234) • Super Admin PIN (9999)
            </p>
          )}
        </div>

        {/* Numeric Keypad (Thumb-Friendly 3x4 Grid) */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="py-3.5 rounded-2xl bg-[#1d130c] hover:bg-[#281a10] active:scale-95 active:bg-orange-500 active:text-white border border-[#382214] text-lg font-bold text-white font-mono transition-all shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Clear */}
          <button
            onClick={handleClear}
            className="py-3.5 rounded-2xl bg-[#170e08] hover:bg-[#20140c] active:scale-95 text-xs font-bold text-[#a89080] border border-[#2b190e] transition-all"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className="py-3.5 rounded-2xl bg-[#1d130c] hover:bg-[#281a10] active:scale-95 active:bg-orange-500 active:text-white border border-[#382214] text-lg font-bold text-white font-mono transition-all shadow-sm"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className="py-3.5 rounded-2xl bg-[#170e08] hover:bg-[#20140c] active:scale-95 flex items-center justify-center text-[#a89080] hover:text-white border border-[#2b190e] transition-all"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
