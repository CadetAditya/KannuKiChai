import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Save, Check, MapPin, Clock, Store, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

export default function StoreSettingsTab() {
  const { settings, authPin, refresh } = useRealtime();

  const [form, setForm] = useState({
    shopName: settings.shopName || '',
    tagline: settings.tagline || '',
    campusLocation: settings.campusLocation || '',
    landmarkWalkTime: settings.landmarkWalkTime || '',
    phone: settings.phone || '',
    upiId: settings.upiId || '',
    morningStart: settings.shifts?.morning?.start || '07:30',
    morningEnd: settings.shifts?.morning?.end || '11:30',
    eveningStart: settings.shifts?.evening?.start || '15:30',
    eveningEnd: settings.shifts?.evening?.end || '21:30',
    daysActive: settings.shifts?.daysActive || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day) => {
    sound.playTap();
    setForm(prev => {
      const exists = prev.daysActive.includes(day);
      return {
        ...prev,
        daysActive: exists
          ? prev.daysActive.filter(d => d !== day)
          : [...prev.daysActive, day]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    sound.playTap();

    try {
      const payload = {
        shopName: form.shopName.trim(),
        tagline: form.tagline.trim(),
        campusLocation: form.campusLocation.trim(),
        landmarkWalkTime: form.landmarkWalkTime.trim(),
        phone: form.phone.trim(),
        upiId: form.upiId.trim(),
        shifts: {
          morning: {
            start: form.morningStart,
            end: form.morningEnd,
            label: 'Morning Shift'
          },
          evening: {
            start: form.eveningStart,
            end: form.eveningEnd,
            label: 'Evening Shift'
          },
          daysActive: form.daysActive
        }
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        setFeedback('Store settings & shift timings updated successfully!');
        refresh();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        sound.playWarning();
        setFeedback(data.error || 'Failed to update settings');
      }
    } catch (err) {
      sound.playWarning();
      setFeedback('Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <Check size={14} />
        </div>
      )}

      {/* Basic Shop Info */}
      <div className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <Store size={14} className="text-orange-400" /> Tapri Profile
        </h4>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
              Shop Name
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
              Tagline / Subtext
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
                Tapri UPI ID
              </label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campus Location */}
      <div className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <MapPin size={14} className="text-orange-400" /> Campus Location & Landmark
        </h4>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
              Campus Landmark Text (Shown to students)
            </label>
            <input
              type="text"
              value={form.campusLocation}
              onChange={(e) => setForm({ ...form, campusLocation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#a89080] mb-1">
              Estimated Walk Time from Hostels
            </label>
            <input
              type="text"
              value={form.landmarkWalkTime}
              onChange={(e) => setForm({ ...form, landmarkWalkTime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Morning & Evening Shift Timings */}
      <div className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <Clock size={14} className="text-orange-400" /> Daily Shift Schedule
        </h4>

        {/* Morning Shift */}
        <div className="p-3 rounded-xl bg-[#110a06] border border-[#26160d] space-y-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            ☀️ Morning Shift (Chai & Breakfast)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8a7263]">Start Time (24h)</label>
              <input
                type="time"
                value={form.morningStart}
                onChange={(e) => setForm({ ...form, morningStart: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a100a] border border-[#3b2316] text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8a7263]">End Time (24h)</label>
              <input
                type="time"
                value={form.morningEnd}
                onChange={(e) => setForm({ ...form, morningEnd: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a100a] border border-[#3b2316] text-xs text-white font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Evening Shift */}
        <div className="p-3 rounded-xl bg-[#110a06] border border-[#26160d] space-y-2">
          <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
            🌙 Evening Shift (Samosa & Kulhad Rush)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8a7263]">Start Time (24h)</label>
              <input
                type="time"
                value={form.eveningStart}
                onChange={(e) => setForm({ ...form, eveningStart: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a100a] border border-[#3b2316] text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8a7263]">End Time (24h)</label>
              <input
                type="time"
                value={form.eveningEnd}
                onChange={(e) => setForm({ ...form, eveningEnd: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a100a] border border-[#3b2316] text-xs text-white font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Days Active */}
        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-[#a89080] mb-1.5">
            Operating Days
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map(day => {
              const active = form.daysActive.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#1a100a] text-[#786153] border border-[#2b190f]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all"
      >
        <Save size={15} />
        <span>{saving ? 'Saving...' : 'Save Settings & Shift Schedule'}</span>
      </button>
    </form>
  );
}

