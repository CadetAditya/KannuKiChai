import React, { useState, useRef } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Upload, Trash2, Check, Plus, Image, Eye, EyeOff, Sparkles, AlertCircle, Link, CheckCircle, XCircle, Clock, User, Heart } from 'lucide-react';
import { sound } from '../../utils/sound';
import { compressImage } from '../../utils/imageCompress';

export default function GalleryManagerTab() {
  const { gallery, moments, authPin, refresh } = useRealtime();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const fileInputRef = useRef(null);

  const pendingMoments = (moments || []).filter(m => m.status === 'pending');
  const approvedMoments = (moments || []).filter(m => m.status === 'approved');

  const showMsg = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  // Moments Approval Handlers
  const handleApproveMoment = async (id, title) => {
    sound.playTap();
    try {
      const res = await fetch(`/api/admin/moments/${id}/approve`, {
        method: 'POST',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        showMsg(`Approved: "${title}" is now LIVE on Yesterday's Moments! ✨`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Failed to approve moment');
    }
  };

  const handleRejectMoment = async (id, title) => {
    sound.playTap();
    try {
      const res = await fetch(`/api/admin/moments/${id}/reject`, {
        method: 'POST',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        showMsg(`Rejected moment: "${title}"`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Failed to reject moment');
    }
  };

  const handleDeleteMoment = async (id, title) => {
    if (!window.confirm(`Delete moment "${title}" from the website?`)) return;
    sound.playTap();
    try {
      const res = await fetch(`/api/admin/moments/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        showMsg(`Deleted moment "${title}"`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
    }
  };

  // Background Photos Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sound.playWarning();
      return showMsg('Please select an image file (JPG, PNG, WebP).');
    }

    setUploading(true);
    sound.playTap();

    try {
      // Compress and optimize image
      let base64;
      try {
        base64 = await compressImage(file, 1600, 1600, 0.85);
      } catch (err) {
        // Fallback to FileReader
        base64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({
          title: photoTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
          base64,
          filename: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg('Photo uploaded and added to background rotation! ✨');
        setPhotoTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Upload failed. Please check your network and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddByUrl = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setUploading(true);
    sound.playTap();

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({
          title: photoTitle.trim() || 'Tapri Moment',
          url: imageUrl.trim(),
          active: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg('Photo link added to background rotation!');
        setImageUrl('');
        setPhotoTitle('');
        setShowUrlForm(false);
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to add image link');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Network error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGallery = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from background rotation?`)) return;
    sound.playTap();

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        showMsg(`Removed photo: "${title}"`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Failed to delete photo');
    }
  };

  const handleToggleActive = async (photo) => {
    sound.playTap();
    const nextState = !photo.active;

    try {
      const res = await fetch(`/api/admin/gallery/${photo.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify({ active: nextState })
      });
      if (res.ok) {
        sound.playSuccess();
        refresh();
      }
    } catch (err) {
      sound.playWarning();
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-800 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <Check size={14} />
        </div>
      )}

      {/* 1. STUDENT MOMENTS APPROVAL QUEUE */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock size={16} />
            </span>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-heading">
                Moments Approval Queue
              </h4>
              <p className="text-[11px] text-stone-500">
                Review student photo submissions before they appear live
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            pendingMoments.length > 0
              ? 'bg-orange-500 text-white animate-pulse'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {pendingMoments.length} Pending
          </span>
        </div>

        {/* Pending list */}
        {pendingMoments.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {pendingMoments.map(m => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex items-start gap-3"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-200">
                  <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h5 className="text-xs font-bold text-stone-900 font-heading">
                    {m.title}
                  </h5>
                  <p className="text-[11px] text-stone-600 flex items-center gap-1">
                    <User size={11} className="text-orange-500" />
                    <span>Submitted by: <strong>{m.author}</strong></span>
                  </p>
                  <span className="inline-block text-[10px] text-stone-400">
                    {new Date(m.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveMoment(m.id, m.title)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold text-white flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle size={13} /> Approve & Publish
                    </button>
                    <button
                      onClick={() => handleRejectMoment(m.id, m.title)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center rounded-xl bg-stone-50 text-xs text-stone-500 border border-stone-100">
            ✅ All student moments reviewed! No submissions waiting.
          </div>
        )}
      </div>

      {/* 2. APPROVED YESTERDAY'S MOMENTS */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-heading">
            Live Yesterday's Moments ({approvedMoments.length})
          </h4>
          <span className="text-[11px] text-stone-400">Visible on public screen</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
          {approvedMoments.map(m => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={m.url} alt={m.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-stone-900 truncate font-heading">
                    {m.title}
                  </h5>
                  <p className="text-[10px] text-stone-500 truncate">
                    {m.author} • {m.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  ☕ {m.likes || 0}
                </span>
                <button
                  onClick={() => handleDeleteMoment(m.id, m.title)}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  title="Delete moment"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. UPLOAD BACKGROUND PHOTOS */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
              <Upload size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-heading">
                Wallpaper Background Photos
              </h4>
              <p className="text-[11px] text-stone-500">
                Ambient photos rotating in the background
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUrlForm(!showUrlForm)}
            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <Link size={12} /> {showUrlForm ? 'Upload File' : 'Paste URL'}
          </button>
        </div>

        {/* Title input */}
        <div>
          <label className="block text-[10px] text-stone-500 mb-1">
            Photo Title (Optional)
          </label>
          <input
            type="text"
            value={photoTitle}
            onChange={(e) => setPhotoTitle(e.target.value)}
            placeholder="e.g. Hostel 4 Chai Break"
            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        {showUrlForm ? (
          <form onSubmit={handleAddByUrl} className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/tapri-photo.jpg"
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400"
              required
            />
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white"
            >
              Add
            </button>
          </form>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="bg-photo-upload-input"
            />
            <label
              htmlFor="bg-photo-upload-input"
              className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-300 hover:border-orange-500 bg-stone-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="p-2.5 rounded-full bg-orange-100 text-orange-600">
                <Image size={22} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-stone-800">
                  {uploading ? 'Uploading Photo...' : 'Click to Select or Snap Photo'}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  JPG, PNG, or WebP up to 10MB
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Background List */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {gallery?.map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="relative overflow-hidden rounded-xl bg-stone-100 border border-stone-200 group h-24"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className={`w-full h-full object-cover ${photo.active === false ? 'opacity-40 grayscale' : 'opacity-90'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(photo)}
                  className="p-1 rounded bg-black/60 text-white"
                  title="Toggle rotation"
                >
                  {photo.active !== false ? <Eye size={11} className="text-emerald-400" /> : <EyeOff size={11} className="text-zinc-400" />}
                </button>
                <button
                  onClick={() => handleDeleteGallery(photo.id, photo.title)}
                  className="p-1 rounded bg-rose-600 text-white"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              <div className="absolute bottom-1.5 left-2 right-2">
                <p className="text-[11px] font-bold text-white truncate drop-shadow-sm font-heading">
                  {photo.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
