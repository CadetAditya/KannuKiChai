import React, { useState, useRef } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Upload, Trash2, Check, Plus, Image, Eye, EyeOff, Sparkles, AlertCircle, Link } from 'lucide-react';
import { sound } from '../../utils/sound';

export default function GalleryManagerTab() {
  const { gallery, authPin, refresh } = useRealtime();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const fileInputRef = useRef(null);

  const showMsg = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sound.playWarning();
      return showMsg('Please select an image file (JPG, PNG, WebP).');
    }

    if (file.size > 8 * 1024 * 1024) {
      sound.playWarning();
      return showMsg('Image file size must be under 8MB.');
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      sound.playTap();

      try {
        const base64 = reader.result;
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
        showMsg('Network error uploading photo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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

  const handleDelete = async (id, title) => {
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
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <Check size={14} />
        </div>
      )}

      {/* Upload Box */}
      <div className="p-4 rounded-2xl bg-[#170e09] border border-[#2e1d13] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <Upload size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                Upload Background Photos
              </h4>
              <p className="text-[11px] text-[#8a7263]">
                Photos will smoothly rotate in the background of the app
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUrlForm(!showUrlForm)}
            className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <Link size={12} /> {showUrlForm ? 'Upload File' : 'Paste URL'}
          </button>
        </div>

        {/* Optional Title input */}
        <div>
          <label className="block text-[10px] text-[#8a7263] mb-1">
            Photo Caption / Title (Optional)
          </label>
          <input
            type="text"
            value={photoTitle}
            onChange={(e) => setPhotoTitle(e.target.value)}
            placeholder="e.g. Hostel 4 Chai Break, Evening Kulhad Rush"
            className="w-full px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white placeholder-[#786153] focus:outline-none focus:border-orange-500"
          />
        </div>

        {showUrlForm ? (
          <form onSubmit={handleAddByUrl} className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/tapri-photo.jpg"
              className="flex-1 px-3 py-2 rounded-xl bg-[#110a06] border border-[#2d1b11] text-xs text-white placeholder-[#786153]"
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
              id="photo-upload-input"
            />
            <label
              htmlFor="photo-upload-input"
              className="w-full py-6 rounded-2xl border-2 border-dashed border-[#3d2719] hover:border-orange-500/50 bg-[#120a06] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="p-3 rounded-full bg-orange-500/10 text-orange-400">
                <Image size={24} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">
                  {uploading ? 'Uploading Photo...' : 'Click to Select or Take Photo'}
                </p>
                <p className="text-[10px] text-[#8a7263] mt-0.5">
                  JPG, PNG, or WebP up to 8MB
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Gallery List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Active Photos in Rotation ({gallery?.length || 0})
          </h4>
          <span className="text-[11px] text-[#8a7263]">
            {gallery?.filter(p => p.active !== false).length || 0} active
          </span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
          {gallery?.map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="relative overflow-hidden rounded-2xl bg-[#150f0b] border border-[#2d1c12] group shadow-md"
            >
              {/* Photo Thumbnail */}
              <div className="relative h-32 w-full bg-[#0a0705] overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    photo.active === false ? 'opacity-40 grayscale' : 'opacity-90'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    photo.active !== false
                      ? 'bg-emerald-500/80 text-white shadow-sm'
                      : 'bg-zinc-700/80 text-zinc-300'
                  }`}>
                    {photo.active !== false ? 'In Rotation' : 'Disabled'}
                  </span>
                </div>

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(photo)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                    title={photo.active !== false ? 'Pause from rotation' : 'Include in rotation'}
                  >
                    {photo.active !== false ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-zinc-400" />}
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id, photo.title)}
                    className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 backdrop-blur-sm"
                    title="Remove photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Caption on image */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-bold text-white truncate drop-shadow-md">
                    {photo.title}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {(!gallery || gallery.length === 0) && (
            <div className="col-span-2 text-center py-8 text-xs text-[#8a7263]">
              No photos currently added to rotation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

