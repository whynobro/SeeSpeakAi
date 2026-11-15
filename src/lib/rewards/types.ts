/** Where a shop item goes: the mascot's hat, the sound meter's look, or the screen background. */
export type ShopSlot = 'hat' | 'meter' | 'background';

export interface ShopItem {
  id: string;
  name: string;
  slot: ShopSlot;
  /** Price in points. */
  price: number;
  /** One plain sentence for the shop card. */
  description: string;
}

/** Saved on the device. Points earned come from saved tries, so only spending is stored. */
export interface Wallet {
  /** Points spent so far. Balance = pointsFor(attempts) - spent. */
  spent: number;
  owned: string[];
  equipped: Partial<Record<ShopSlot, string>>;
}

export interface Streak {
  /** Days with at least one try, in a row. One missed day does not break it. */
  days: number;
  /** True when today already has a try. */
  practicedToday: boolean;
}
