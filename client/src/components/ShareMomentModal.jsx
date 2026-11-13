import React, { useState, useRef } from 'react';
import { X, Camera, Image, Upload, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { sound } from '../utils/sound';
import { compressImage } from '../utils/imageCompress';

export default function ShareMomentModal({ isOpen, onClose }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [base64Data, setBase64Data] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    setError('');
    setCompressing(true);
    try {
      // Compress and optimize image to ensure fast, reliable upload
      const optimizedBase64 = await compressImage(file, 1280, 1280, 0.82);
      setPhotoPreview(optimizedBase64);
      setBase64Data(optimizedBase64);
      sound.playTap();
    } catch (err) {
      // Fallback to FileReader if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
        setBase64Data(reader.result);
        sound.playTap();
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base64Data) {
      setError('Please choose or take a photo first.');
      return;
    }

    setSubmitting(true);
    sound.playTap();

    try {
      const res = await fetch('/api/moments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Campus Chai Moment',
          author: author.trim() || 'Campus Student',
          base64: base64Data
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        setSubmitted(true);
      } else {
        sound.playWarning();
        setError(data.error || 'Failed to upload moment.');
      }
    } catch (err) {
      sound.playWarning();
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    sound.playTap();
    setPhotoPreview(null);
    setBase64Data('');
    setTitle('');
    setAuthor('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#faf7f2] border border-stone-200 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl text-stone-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
              <Camera size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-heading">
                Share Your Tapri Moment
              </h3>
              <p className="text-[11px] text-stone-500">
                Add to Yesterday's Moments 📸
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-sm">
              ✨
            </div>
            <h4 className="text-lg font-bold text-stone-900 font-heading">
              Photo Sent to Kannu!
            </h4>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              Thanks for sharing your campus chai memory! Once the admin reviews and approves it, it will appear on <strong>Yesterday's Moments</strong> for everyone to see.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Photo Picker / Preview */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="moment-file-input"
              />

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-orange-300 bg-stone-100 group shadow-sm">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setBase64Data('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="moment-file-input"
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-stone-300 hover:border-orange-500 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                >
                  <div className="p-3 rounded-full bg-orange-50 text-orange-600">
                    <Camera size={26} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-stone-800">
                      Snap or Upload Chai Photo
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Camera, gallery, or screenshots (JPG, PNG)
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Caption / Title */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Moment Caption / Memory *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Post-lab cutting chai, 3 AM exam prep"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm"
                required
              />
            </div>

            {/* Author / Hostel */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Your Name / Group (Optional)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Aryan • Hostel 4, Sneha & Priya"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
              <Sparkles size={14} className="flex-shrink-0 text-amber-600 mt-0.5" />
              <span>
                To keep the tapri community authentic and safe, Kannu reviews each moment before it goes live on the website.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !base64Data}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-98 font-bold text-xs text-white shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>{submitting ? 'Uploading Moment...' : 'Submit Moment for Approval'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

