'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  balance,
  buy as buyItem,
  emptyWallet,
  equip as equipItem,
  loadWallet,
  pointsFor,
  streakFor,
} from '@/lib/rewards';
import type { ShopSlot, Streak, Wallet } from '@/lib/rewards';
import { loadAttempts } from '@/lib/store';

export interface RewardsState {
  /** Points earned in total (from saved tries). */
  earned: number;
  /** Points left to spend. This is the number to show on the shop. */
  points: number;
  streak: Streak;
  wallet: Wallet;
  /** Returns true when bought. False: not enough points, already owned, or unknown item. */
  buy(itemId: string): boolean;
  /** Returns true when done. False: item not owned or wrong slot. `null` takes the slot's item off. */
  equip(slot: ShopSlot, itemId: string | null): boolean;
  /** Re-reads storage, for example after a try is saved. */
  refresh(): void;
}

function read() {
  const wallet = loadWallet();
  const attempts = loadAttempts();
  return {
    earned: pointsFor(attempts),
    points: balance(wallet),
    streak: streakFor(attempts, new Date()),
    wallet,
  };
}

/** Points, streak and shop wallet. Storage is read only after the screen is on, so the first render is empty. */
export function useRewards(): RewardsState {
  const [state, setState] = useState(() => ({
    earned: 0,
    points: 0,
    streak: { days: 0, practicedToday: false } as Streak,
    wallet: emptyWallet(),
  }));

  const refresh = useCallback(() => setState(read()), []);

  useEffect(() => {
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const buy = useCallback(
    (itemId: string) => {
      const ok = buyItem(itemId) !== null;
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );
  const equip = useCallback(
    (slot: ShopSlot, itemId: string | null) => {
      const ok = equipItem(slot, itemId) !== null;
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );

  return { ...state, buy, equip, refresh };
}
