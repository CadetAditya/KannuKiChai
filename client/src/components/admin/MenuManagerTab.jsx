import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Plus, Edit2, Trash2, Check, X, Tag, DollarSign, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

export default function MenuManagerTab() {
  const { menu, authPin, refresh } = useRealtime();

  const [editingItem, setEditingItem] = useState(null); // null or item object
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Special Chai',
    price: '',
    badge: '',
    description: '',
    inStock: true
  });

  const CATEGORIES = ['Special Chai', 'Snacks & Bites', 'Cold Beverages', 'Quick Sips'];

  const showMsg = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    setLoading(true);
    sound.playTap();

    try {
      const res = await fetch('/api/admin/menu/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg(`Added "${formData.name}" to menu!`);
        setShowAddForm(false);
        setFormData({ name: '', category: 'Special Chai', price: '', badge: '', description: '', inStock: true });
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to add item');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    sound.playTap();

    try {
      const res = await fetch(`/api/admin/menu/item/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': authPin
        },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showMsg(`Updated "${editingItem.name}"!`);
        setEditingItem(null);
        refresh();
      } else {
        sound.playWarning();
        showMsg(data.error || 'Failed to update item');
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from menu?`)) return;
    sound.playTap();

    try {
      const res = await fetch(`/api/admin/menu/item/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        showMsg(`Deleted "${name}"`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showMsg('Failed to delete item');
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

      {/* Header & Add Button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8274] font-heading">
            Live Tapri Menu Inventory ({menu.length} items)
          </h3>
          <p className="text-[11px] text-[#8a7263]">Full price, description, and item editing</p>
        </div>
        <button
          onClick={() => {
            sound.playTap();
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-xs font-bold text-white transition-all shadow-md"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Cancel' : 'Add Item'}</span>
        </button>
      </div>

      {/* Add New Item Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[#170e09] border border-orange-500/30 space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-heading">
            Add New Menu Item
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8a7263] mb-0.5">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Masala Bun"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8a7263] mb-0.5">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="25"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8a7263] mb-0.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#8a7263] mb-0.5">Badge (Optional)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Must Try"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#8a7263] mb-0.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Freshly baked spiced bun..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Item to Menu
          </button>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {menu.map(item => {
          const isEditing = editingItem && editingItem.id === item.id;

          if (isEditing) {
            return (
              <form key={item.id} onSubmit={handleUpdate} className="p-3.5 rounded-2xl bg-[#1b120c] border border-orange-500/40 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white font-bold"
                    required
                  />
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    value={editingItem.badge || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    placeholder="Badge (optional)"
                    className="px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
                  />
                </div>

                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Description..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#110a06] border border-[#2d1b11] text-xs text-white"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center justify-center gap-1"
                  >
                    <Check size={13} /> Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[#a89080] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#150f0b] border border-[#2d1c12] flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-white font-heading">
                    {item.name}
                  </h4>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.inStock ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {item.inStock ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
                <p className="text-[10px] text-[#8a7263] mt-0.5">
                  ₹{item.price} • {item.category}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    sound.playTap();
                    setEditingItem(item);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#a89080] hover:text-white transition-all"
                  title="Edit item"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                  title="Delete item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

