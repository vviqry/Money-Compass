import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, Plus } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/store/AuthContext';
import type { RevenueStream, RevenueStreamCategory } from '@/types';
import {
  addRevenueStream,
  updateRevenueStream,
  deleteRevenueStream,
  subscribeRevenueStreams,
} from '@/lib/db';

interface RevenueModalProps {
  open: boolean;
  onClose: () => void;
}

const STREAM_COLORS = [
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const CATEGORIES: RevenueStreamCategory[] = [
  'Gaji',
  'Affiliate',
  'Freelance',
  'Bisnis',
  'Investasi',
  'Lainnya',
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─── Stream Item Card ────────────────────────────────────────────────

function StreamItem({
  stream,
  uid,
  onDelete,
}: {
  stream: RevenueStream;
  uid: string;
  onDelete: (id: string) => void;
}) {
  const [localData, setLocalData] = useState<RevenueStream>(stream);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalData(stream);
  }, [stream]);

  const handleChange = (field: keyof RevenueStream, value: string | number) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated as RevenueStream);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      updateRevenueStream(uid, stream.id, { [field]: value });
    }, 500);
  };

  const handleBlur = (field: keyof RevenueStream) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    updateRevenueStream(uid, stream.id, { [field]: localData[field] });
  };

  return (
    <div className="relative bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-border/50 rounded-xl p-4 flex gap-3 group">
      {/* Color dot */}
      <div className="mt-1.5 shrink-0">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: localData.color }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={localData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="Nama stream..."
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <select
            value={localData.category}
            onChange={(e) =>
              handleChange('category', e.target.value as RevenueStreamCategory)
            }
            onBlur={() => handleBlur('category')}
            className="bg-background/50 border border-border/50 rounded-md text-xs py-1 px-2 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-emerald-400 font-bold text-sm">Rp</span>
          <input
            type="number"
            value={localData.amount || ''}
            onChange={(e) => handleChange('amount', Number(e.target.value))}
            onBlur={() => handleBlur('amount')}
            placeholder="0"
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-bold text-emerald-400 placeholder:text-emerald-400/50 focus:outline-none"
          />
        </div>

        <input
          type="text"
          value={localData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={() => handleBlur('notes')}
          placeholder="Catatan..."
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(stream.id)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Revenue Modal ───────────────────────────────────────────────────

export function RevenueModal({ open, onClose }: RevenueModalProps) {
  const { user } = useAuth();
  const [streams, setStreams] = useState<RevenueStream[]>([]);

  useEffect(() => {
    if (!user || !open) return;

    const unsubscribe = subscribeRevenueStreams(user.uid, (data) => {
      setStreams(data);
    });

    return () => unsubscribe();
  }, [user, open]);

  const handleAddStream = async () => {
    if (!user) return;

    const color = STREAM_COLORS[streams.length % STREAM_COLORS.length];
    const now = new Date().toISOString();

    const newStream: RevenueStream = {
      id: `rs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: '',
      category: 'Lainnya',
      amount: 0,
      notes: '',
      color,
      createdAt: now,
      updatedAt: now,
    };

    await addRevenueStream(user.uid, newStream);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Hapus revenue stream ini?')) {
      await deleteRevenueStream(user.uid, id);
    }
  };

  const totalAmount = streams.reduce((sum, s) => sum + (s.amount || 0), 0);

  // Chart data (filter out zero amounts)
  const chartData = streams
    .filter((s) => s.amount > 0)
    .map((s) => ({
      name: s.name || s.category,
      value: s.amount,
      color: s.color,
    }));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2>Revenue Stream Tracker</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Donut Chart Section */}
              <div className="relative">
                {chartData.length > 0 ? (
                  <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center total label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-muted-foreground">
                        Total
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {formatRupiah(totalAmount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center border border-dashed border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      Belum ada data revenue
                    </p>
                  </div>
                )}

                {/* Legend */}
                {chartData.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {chartData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className="text-muted-foreground truncate max-w-[80px]"
                          title={item.name}
                        >
                          {item.name || 'Unnamed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-border/50" />

              {/* Stream Items List */}
              <div className="space-y-4">
                {streams.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Tekan tombol di bawah untuk menambah sumber pendapatan.
                  </p>
                ) : (
                  streams.map((stream) => (
                    <StreamItem
                      key={stream.id}
                      stream={stream}
                      uid={user?.uid || ''}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Footer button */}
            <div className="p-5 border-t border-border/50 bg-card/50 rounded-b-2xl shrink-0">
              <button
                onClick={handleAddStream}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Tambah Stream Baru
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
