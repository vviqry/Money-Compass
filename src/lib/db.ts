import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Transaction, Settings, WishlistItem, RevenueStream } from '@/types';

// ─── Data Layout ─────────────────────────────────────────────────────
// users/{uid}/transactions/{transactionId}
// users/{uid}/meta/settings

const SETTINGS_DOC_ID = 'settings';

function transactionsCol(uid: string) {
  return collection(firestore, 'users', uid, 'transactions');
}

function settingsDoc(uid: string) {
  return doc(firestore, 'users', uid, 'meta', SETTINGS_DOC_ID);
}

// ─── Transaction Operations ──────────────────────────────────────────

export async function addTransaction(uid: string, transaction: Transaction): Promise<void> {
  await setDoc(doc(transactionsCol(uid), transaction.id), transaction);
}

export async function updateTransaction(
  uid: string,
  id: string,
  changes: Partial<Transaction>
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await setDoc(doc(transactionsCol(uid), id), { ...changes, updatedAt }, { merge: true });
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(transactionsCol(uid), id));
}

export async function getAllTransactions(uid: string): Promise<Transaction[]> {
  const q = query(transactionsCol(uid), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Transaction);
}

export async function getTransactionsByType(
  uid: string,
  type: 'income' | 'expense'
): Promise<Transaction[]> {
  const q = query(transactionsCol(uid), where('type', '==', type), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Transaction);
}

// ─── Settings Operations ─────────────────────────────────────────────

export async function getSettings(uid: string): Promise<Settings | undefined> {
  const snap = await getDoc(settingsDoc(uid));
  return snap.exists() ? (snap.data() as Settings) : undefined;
}

export async function saveSettings(uid: string, settings: Settings): Promise<void> {
  await setDoc(settingsDoc(uid), { ...settings, updatedAt: new Date().toISOString() });
}

// ─── Bulk Operations (for Import/Restore) ────────────────────────────

export async function replaceAllData(
  uid: string,
  transactions: Transaction[],
  settings: Settings
): Promise<void> {
  // Firestore batches are capped at 500 writes, so chunk if needed.
  const existing = await getDocs(transactionsCol(uid));

  let batch = writeBatch(firestore);
  let opCount = 0;

  const flushIfNeeded = async () => {
    if (opCount >= 450) {
      await batch.commit();
      batch = writeBatch(firestore);
      opCount = 0;
    }
  };

  for (const docSnap of existing.docs) {
    batch.delete(docSnap.ref);
    opCount++;
    await flushIfNeeded();
  }

  for (const transaction of transactions) {
    batch.set(doc(transactionsCol(uid), transaction.id), transaction);
    opCount++;
    await flushIfNeeded();
  }

  batch.set(settingsDoc(uid), { ...settings, updatedAt: new Date().toISOString() });
  await batch.commit();
}

// ─── Export entire DB ────────────────────────────────────────────────

export async function exportAllData(uid: string) {
  const transactions = await getAllTransactions(uid);
  const settings = await getSettings(uid);
  return { transactions, settings };
}

// ─── Wishlist Operations (Pengungkit Produktivitas & Kekayaan) ───────

function wishlistCol(uid: string) {
  return collection(firestore, 'users', uid, 'wishlist');
}

export async function addWishlistItem(uid: string, item: WishlistItem): Promise<void> {
  await setDoc(doc(wishlistCol(uid), item.id), item);
}

export async function updateWishlistItem(
  uid: string,
  id: string,
  changes: Partial<WishlistItem>
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await setDoc(doc(wishlistCol(uid), id), { ...changes, updatedAt }, { merge: true });
}

export async function deleteWishlistItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(wishlistCol(uid), id));
}

export function subscribeWishlist(
  uid: string,
  callback: (items: WishlistItem[]) => void
): () => void {
  const q = query(wishlistCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => d.data() as WishlistItem);
    callback(items);
  });
}

// ─── Revenue Stream Operations (Reminder & Management) ──────────────

function revenueStreamsCol(uid: string) {
  return collection(firestore, 'users', uid, 'revenue_streams');
}

export async function addRevenueStream(uid: string, stream: RevenueStream): Promise<void> {
  await setDoc(doc(revenueStreamsCol(uid), stream.id), stream);
}

export async function updateRevenueStream(
  uid: string,
  id: string,
  changes: Partial<RevenueStream>
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await setDoc(doc(revenueStreamsCol(uid), id), { ...changes, updatedAt }, { merge: true });
}

export async function deleteRevenueStream(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(revenueStreamsCol(uid), id));
}

export function subscribeRevenueStreams(
  uid: string,
  callback: (streams: RevenueStream[]) => void
): () => void {
  const q = query(revenueStreamsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const streams = snapshot.docs.map((d) => d.data() as RevenueStream);
    callback(streams);
  });
}
