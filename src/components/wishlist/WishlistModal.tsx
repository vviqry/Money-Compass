import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ExternalLink, X, Camera } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import {
  addWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  subscribeWishlist,
} from '@/lib/db';
import type { WishlistItem } from '@/types';

interface WishlistModalProps {
  open: boolean;
  onClose: () => void;
}

function WishlistItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: WishlistItem;
  onUpdate: (id: string, changes: Partial<WishlistItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [localItem, setLocalItem] = useState(item);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const handleChange = (field: keyof WishlistItem, value: string | number) => {
    const updated = { ...localItem, [field]: value };
    setLocalItem(updated);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onUpdate(item.id, { [field]: value });
    }, 500);
  };

  const handleBlur = (field: keyof WishlistItem) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    onUpdate(item.id, { [field]: localItem[field] });
  };

  const handleLinkClick = () => {
    if (localItem.link) {
      window.open(localItem.link, '_blank');
    } else {
      const url = prompt('Masukkan URL Link:');
      if (url) {
        handleChange('link', url);
        onUpdate(item.id, { link: url });
      }
    }
  };

  const handleImageClick = () => {
    const url = prompt(
      'Masukkan URL Gambar (Image URL):',
      localItem.imageUrl || ''
    );
    if (url !== null) {
      handleChange('imageUrl', url);
      onUpdate(item.id, { imageUrl: url });
    }
  };

  return (
    <div className="relative flex gap-4 p-4 rounded-xl border border-border/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5 group">
      {/* Delete button */}
      <button
        onClick={() => {
          if (confirm('Hapus target ini?')) onDelete(item.id);
        }}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Left Thumbnail */}
      <div
        className={`w-16 h-16 rounded-full shrink-0 flex items-center justify-center cursor-pointer overflow-hidden ${localItem.imageUrl ? '' : 'border-2 border-dashed border-border/50'}`}
        onClick={handleImageClick}
      >
        {localItem.imageUrl ? (
          <img
            src={localItem.imageUrl}
            alt={localItem.title || 'Image'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <input
            type="text"
            value={localItem.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="Judul target..."
            className="w-full bg-transparent border-none p-0 focus:ring-0 font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleLinkClick}
            className="shrink-0 p-1 hover:bg-white/10 rounded"
            title={localItem.link || 'Tambahkan link'}
          >
            <ExternalLink
              className={`w-4 h-4 ${localItem.link ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </button>
        </div>

        <input
          type="text"
          value={localItem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder="Deskripsi..."
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />

        <div className="flex items-center gap-1 mt-1">
          <span className="text-amber-500 font-bold text-sm">Rp</span>
          <input
            type="number"
            value={localItem.price || ''}
            onChange={(e) => handleChange('price', Number(e.target.value))}
            onBlur={() => handleBlur('price')}
            placeholder="0"
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-amber-500 font-bold focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export function WishlistModal({ open, onClose }: WishlistModalProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (user && open) {
      const unsubscribe = subscribeWishlist(user.uid, (data) => {
        setItems(data);
      });
      return () => unsubscribe();
    }
  }, [user, open]);

  const handleAdd = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const newItem: WishlistItem = {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
      link: '',
      createdAt: now,
      updatedAt: now,
    };
    await addWishlistItem(user.uid, newItem);
  };

  const handleUpdate = useCallback(
    (id: string, changes: Partial<WishlistItem>) => {
      if (!user) return;
      updateWishlistItem(user.uid, id, changes);
    },
    [user]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!user) return;
      deleteWishlistItem(user.uid, id);
    },
    [user]
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center gap-2 shrink-0">
              <Target className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-lg text-foreground">
                Wishlist Pengungkit Produktivitas & Kekayaan
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Add button at top */}
              <button
                onClick={handleAdd}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                + Tambah Target Baru
              </button>

              {/* Items */}
              {items.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Belum ada wishlist. Klik tombol di atas untuk menambahkan tool
                  atau alat pengungkit produktivitas!
                </p>
              ) : (
                items.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
