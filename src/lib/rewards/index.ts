import { loadAttempts } from '@/lib/store';
import { pointsFor } from './points';
import { itemById, SHOP_SLOTS } from './shop';
import type { ShopSlot, Wallet } from './types';

export { DAILY_BONUS, DAILY_GOAL_TRIES, dayKey, pointsFor, streakFor } from './points';
export { itemById, SHOP_ITEMS, SHOP_SLOTS } from './shop';
export type { ShopItem, ShopSlot, Streak, Wallet } from './types';

/** Everything here stays on this device. Every function is safe with no storage, blocked storage or bad JSON. */
const WALLET_KEY = 'seespeak.wallet';

export function emptyWallet(): Wallet {
  return { spent: 0, owned: [], equipped: {} };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function loadWallet(): Wallet {
  try {
    if (typeof localStorage === 'undefined') return emptyWallet();
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw === null) return emptyWallet();
    const v: unknown = JSON.parse(raw);
    if (!isRecord(v)) return emptyWallet();
    const owned = Array.isArray(v.owned)
      ? [...new Set(v.owned.filter((id): id is string => typeof id === 'string' && !!itemById(id)))]
      : [];
    const equipped: Wallet['equipped'] = {};
    if (isRecord(v.equipped)) {
      for (const slot of SHOP_SLOTS) {
        const id = v.equipped[slot];
        if (typeof id === 'string' && owned.includes(id) && itemById(id)?.slot === slot) equipped[slot] = id;
      }
    }
    const spent =
      typeof v.spent === 'number' && Number.isFinite(v.spent) && v.spent > 0 ? Math.floor(v.spent) : 0;
    return { spent, owned, equipped };
  } catch {
    return emptyWallet();
  }
}

function saveWallet(w: Wallet): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  } catch {
    // Storage is full or blocked: the shop still works for this visit, it just is not remembered.
  }
}

/** Points left to spend: earned from saved tries, minus what was spent. Never below 0. */
export function balance(wallet: Wallet = loadWallet()): number {
  return Math.max(0, pointsFor(loadAttempts()) - wallet.spent);
}

export function owned(itemId: string): boolean {
  return loadWallet().owned.includes(itemId);
}

/**
 * Buys one item at its catalog price. Returns the updated wallet, or null when the item is unknown, already
 * owned, or there are not enough points.
 */
export function buy(itemId: string): Wallet | null {
  const item = itemById(itemId);
  if (!item) return null;
  const wallet = loadWallet();
  if (wallet.owned.includes(itemId)) return null;
  if (balance(wallet) < item.price) return null;
  const next: Wallet = { ...wallet, spent: wallet.spent + item.price, owned: [...wallet.owned, itemId] };
  saveWallet(next);
  return next;
}

/**
 * Wears an owned item in its slot, or takes the slot's item off with `null`. Returns the updated wallet, or
 * null when the item is not owned or belongs to another slot.
 */
export function equip(slot: ShopSlot, itemId: string | null): Wallet | null {
  const wallet = loadWallet();
  const equipped = { ...wallet.equipped };
  if (itemId === null) {
    delete equipped[slot];
  } else {
    if (!wallet.owned.includes(itemId) || itemById(itemId)?.slot !== slot) return null;
    equipped[slot] = itemId;
  }
  const next = { ...wallet, equipped };
  saveWallet(next);
  return next;
}
