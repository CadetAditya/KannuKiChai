import React, { useState, useMemo } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Coffee, Search, Tag, CheckCircle2, AlertTriangle, QrCode, ShoppingBag, X } from 'lucide-react';
import { sound } from '../utils/sound';

export default function StudentMenu() {
  const { menu, settings } = useRealtime();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [showUpiModal, setShowUpiModal] = useState(false);

  const categories = useMemo(() => {
    const cats = ['All'];
    menu.forEach(item => {
      if (item.category && !cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const addToCart = (item) => {
    if (!item.inStock) return;
    sound.playTap();
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    sound.playTap();
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const clearCart = () => {
    sound.playTap();
    setCart({});
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [cart, menu]);

  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }, [cart]);

  return (
    <div className="space-y-3">
      {/* Menu Header & Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Coffee size={16} />
          </span>
          <h3 className="text-base font-bold text-white font-heading">
            Tapri Menu & Availability
          </h3>
        </div>
        <span className="text-xs text-[#9a8274]">
          {menu.filter(m => m.inStock).length} in stock
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a7263]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search adrak chai, samosa, bun maska..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#140e0a] border border-[#2d1b11] text-xs text-white placeholder-[#786153] focus:outline-none focus:border-orange-500/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a7263] hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                sound.playTap();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40'
                  : 'bg-[#18110b] border border-[#2d1c12] text-[#b8a192] hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Menu Items List */}
      <div className="space-y-2">
        {filteredMenu.map(item => {
          const qty = cart[item.id] || 0;
          return (
            <div
              key={item.id}
              onClick={() => item.inStock && addToCart(item)}
              className={`rounded-2xl p-3.5 transition-all border ${
                item.inStock
                  ? 'bg-[#150f0b] border-[#2e1d13] hover:border-[#4d2f1f] active:scale-[0.99] cursor-pointer'
                  : 'bg-[#110c08]/60 border-[#1f140e] opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white font-heading">
                      {item.name}
                    </h4>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-[#9a8274] line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}

                  {/* Stock tag */}
                  <div className="mt-2 flex items-center gap-2">
                    {item.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 size={12} /> Available Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <AlertTriangle size={12} /> Sold Out
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Cart Actions */}
                <div className="flex flex-col items-end justify-between self-stretch">
                  <span className={`text-base font-extrabold font-mono ${item.inStock ? 'text-orange-400' : 'text-[#6e5648] line-through'}`}>
                    ₹{item.price}
                  </span>

                  {item.inStock && (
                    <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {qty > 0 ? (
                        <div className="flex items-center bg-[#24170f] rounded-lg border border-[#3f2719] px-1 py-0.5">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-5 h-5 flex items-center justify-center text-xs text-orange-400 font-bold hover:bg-orange-500/20 rounded"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-white font-mono">{qty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-5 h-5 flex items-center justify-center text-xs text-orange-400 font-bold hover:bg-orange-500/20 rounded"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#24170f] hover:bg-orange-500 hover:text-white border border-[#3f2719] text-[11px] font-bold text-orange-400 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredMenu.length === 0 && (
          <div className="text-center py-8 text-xs text-[#8a7263]">
            No menu items found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Quick Cart / Bill Estimator floating pill */}
      {cartItemCount > 0 && (
        <div className="sticky bottom-16 z-20 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 p-3 shadow-xl shadow-orange-950/50 text-white flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-black/20">
              <ShoppingBag size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold">
                {cartItemCount} item{cartItemCount > 1 ? 's' : ''} selected
              </p>
              <p className="text-base font-extrabold font-mono leading-none">
                Total: ₹{cartTotal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpiModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-orange-700 font-bold text-xs hover:bg-orange-50 active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <QrCode size={14} /> Pay via UPI
            </button>
            <button
              onClick={clearCart}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#140e0a] border border-[#382214] rounded-3xl p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-[#29170d] pb-3">
              <h4 className="text-sm font-bold text-white font-heading">
                Tapri Counter UPI Pay
              </h4>
              <button
                onClick={() => setShowUpiModal(false)}
                className="p-1 text-[#9a8274] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#b8a192]">Estimated Order Total</p>
              <p className="text-3xl font-black font-mono text-orange-400">
                ₹{cartTotal}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white text-black inline-block shadow-inner mx-auto">
              {/* Simulated QR Code display */}
              <div className="w-40 h-40 border-2 border-black flex flex-col items-center justify-center text-center p-2 relative bg-amber-50">
                <QrCode size={100} className="text-stone-900" />
                <span className="text-[10px] font-mono font-bold text-stone-700 mt-1">
                  {settings.upiId}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-[#a89080]">
              <p className="font-semibold text-white">UPI ID: <span className="font-mono text-orange-400">{settings.upiId}</span></p>
              <p className="text-[11px]">Pay directly at Kannu ki Chai tapri counter</p>
            </div>

            <a
              href={`upi://pay?pa=${settings.upiId}&pn=Kannu%20ki%20Chai&am=${cartTotal}&cu=INR`}
              className="block w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              Open GPay / PhonePe / Paytm
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

