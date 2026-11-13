import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Shield, KeyRound, Lock, Unlock, AlertTriangle, Check, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

export default function SecurityTab() {
  const { authPin, setAuthPin, operatorEnabled, refresh } = useRealtime();

  const [opPin, setOpPin] = useState('');
  const [opPinConfirm, setOpPinConfirm] = useState('');
  const [adminPinNew, setAdminPinNew] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isOpEnabled, setIsOpEnabled] = useState(operatorEnabled);
  const [loading, setLoading] = useState(false);

  const showMsg = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleUpdateOperatorPin = async (e) => {
    e.preventDefault();
    if (opPin.length < 4) {
      sound.playWarning();
      return showMsg('Operator PIN must be at least 4 digits');
    }
    if (opPin !== opPinConfirm) {
      sound.playWarning();
      return showMsg('Operator PIN confirmation does not match');
    }

    setLoading(true);
    sound.playTap();

    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({ operatorPin: opPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg('Shopkeeper PIN updated successfully!');
        setOpPin('');
        setOpPinConfirm('');
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to update PIN');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Network error updating PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminPin = async (e) => {
    e.preventDefault();
    if (adminPinNew.length < 4) {
      sound.playWarning();
      return showMsg('Admin PIN must be at least 4 digits');
    }
    if (adminPinNew !== adminPinConfirm) {
      sound.playWarning();
      return showMsg('Admin PIN confirmation does not match');
    }

    setLoading(true);
    sound.playTap();

    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({ adminPin: adminPinNew })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg('Super Admin PIN updated! Keep your new PIN safe.');
        setAuthPin(adminPinNew);
        setAdminPinNew('');
        setAdminPinConfirm('');
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to update PIN');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Network error updating PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOperatorAccess = async () => {
    sound.playTap();
    const nextState = !isOpEnabled;

    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({ operatorEnabled: nextState })
      });
      if (res.ok) {
        sound.playSuccess();
        setIsOpEnabled(nextState);
        showMsg(nextState ? 'Shopkeeper operator access ENABLED' : 'Shopkeeper operator access PAUSED');
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Failed to toggle access');
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <Check size={14} />
        </div>
      )}

      {/* Operator Access Pause Switch */}
      <div className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isOpEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isOpEnabled ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-heading">
                Shopkeeper Access Control
              </h4>
              <p className="text-[11px] text-[#8a7263]">
                {isOpEnabled ? 'Shopkeeper PIN is active' : 'Shopkeeper PIN is temporarily locked'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOperatorAccess}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 ${
              isOpEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500 text-white shadow-md shadow-rose-950/50'
            }`}
          >
            {isOpEnabled ? 'PAUSE ACCESS' : 'ENABLE ACCESS'}
          </button>
        </div>

        {!isOpEnabled && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-[11px]">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Shopkeeper cannot log in or override status while paused. Only you have access.
            </span>
          </div>
        )}
      </div>

      {/* Change Shopkeeper's PIN */}
      <form onSubmit={handleUpdateOperatorPin} className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-orange-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Change Shopkeeper PIN
          </h4>
        </div>
        <p className="text-[11px] text-[#8a7263]">
          Simple 4-digit PIN for the chai tapri operator
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[#8a7263] mb-1">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength={6}
              value={opPin}
              onChange={(e) => setOpPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 5678"
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono tracking-widest text-center"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#8a7263] mb-1">Confirm PIN</label>
            <input
              type="password"
              maxLength={6}
              value={opPinConfirm}
              onChange={(e) => setOpPinConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 5678"
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono tracking-widest text-center"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !opPin}
          className="w-full py-2.5 rounded-xl bg-[#24170f] hover:bg-orange-500 hover:text-white border border-[#3d2719] text-xs font-bold text-orange-400 transition-all"
        >
          Update Shopkeeper PIN
        </button>
      </form>

      {/* Change Admin PIN */}
      <form onSubmit={handleUpdateAdminPin} className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Change Super Admin PIN
          </h4>
        </div>
        <p className="text-[11px] text-[#8a7263]">
          Master control PIN for store management
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[#8a7263] mb-1">New Admin PIN</label>
            <input
              type="password"
              maxLength={6}
              value={adminPinNew}
              onChange={(e) => setAdminPinNew(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 8888"
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono tracking-widest text-center"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#8a7263] mb-1">Confirm Admin PIN</label>
            <input
              type="password"
              maxLength={6}
              value={adminPinConfirm}
              onChange={(e) => setAdminPinConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 8888"
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono tracking-widest text-center"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !adminPinNew}
          className="w-full py-2.5 rounded-xl bg-[#24170f] hover:bg-amber-500 hover:text-white border border-[#3d2719] text-xs font-bold text-amber-400 transition-all"
        >
          Update Master Admin PIN
        </button>
      </form>
    </div>
  );
}

