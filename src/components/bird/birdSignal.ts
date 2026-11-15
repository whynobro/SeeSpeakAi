/*
 * A tiny shared store for the "hide the bird" choice, which is saved on this device only.
 * The bird never touches the microphone code: the practice screen hands it "how loud, 0 to 1" as a prop.
 */

type Listener = () => void;

/** The saved "hide the bird" choice. Keys that start with "seespeak:" are cleared by Start over. */
export const BIRD_HIDDEN_KEY = 'seespeak:bird-hidden';

/** Used when storage is blocked (private mode), so the switch still works for this visit. */
let hiddenThisVisit: boolean | null = null;
const hiddenListeners = new Set<Listener>();

export function isBirdHidden(): boolean {
  if (hiddenThisVisit !== null) return hiddenThisVisit;
  try {
    return window.localStorage.getItem(BIRD_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function setBirdHidden(hidden: boolean): void {
  hiddenThisVisit = hidden;
  try {
    if (hidden) window.localStorage.setItem(BIRD_HIDDEN_KEY, '1');
    else window.localStorage.removeItem(BIRD_HIDDEN_KEY);
  } catch {
    // Not saved, still applies for this visit.
  }
  hiddenListeners.forEach((listener) => listener());
}

/** Calls the listener when the choice changes, here or in another tab. Returns a function that stops it. */
export function subscribeBirdHidden(listener: Listener): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== BIRD_HIDDEN_KEY) return;
    // Another tab changed it (or cleared everything): read the saved value again.
    hiddenThisVisit = null;
    listener();
  };
  hiddenListeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    hiddenListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
