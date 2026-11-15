import type { ShopItem, ShopSlot } from './types';

/**
 * What the shop sells. Looks only: nothing here changes scoring, hints or practice words.
 * Prices are points, never money. The first item is affordable after one short session (about 15 points).
 */
export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: 'hat-beanie',
    name: 'Blue beanie',
    slot: 'hat',
    price: 15,
    description: 'A cozy knit hat for the bird.',
  },
  { id: 'hat-party', name: 'Party hat', slot: 'hat', price: 25, description: 'A pointy hat for a good day.' },
  {
    id: 'hat-crown',
    name: 'Little crown',
    slot: 'hat',
    price: 60,
    description: 'A gold crown for the bird.',
  },
  {
    id: 'meter-sunrise',
    name: 'Sunrise meter',
    slot: 'meter',
    price: 20,
    description: 'Warm yellow and orange bar.',
  },
  {
    id: 'meter-ocean',
    name: 'Ocean meter',
    slot: 'meter',
    price: 35,
    description: 'Deep teal bar with waves.',
  },
  {
    id: 'meter-night',
    name: 'Night meter',
    slot: 'meter',
    price: 50,
    description: 'Dark navy bar with stars.',
  },
  {
    id: 'bg-clouds',
    name: 'Soft clouds',
    slot: 'background',
    price: 30,
    description: 'Light clouds behind the bird.',
  },
  {
    id: 'bg-forest',
    name: 'Forest branch',
    slot: 'background',
    price: 45,
    description: 'Green leaves and a branch.',
  },
];

export const SHOP_SLOTS: readonly ShopSlot[] = ['hat', 'meter', 'background'];

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
