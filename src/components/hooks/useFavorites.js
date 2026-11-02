import { useSyncExternalStore } from 'react';
const KEY = 'mapCombos_favorites';
const EVENT = 'quper-favorites';
const subscribe = (callback) => {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(KEY) || '[]';
  } catch {
    return '[]';
  }
};
export default function useFavorites() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '[]');
  let favorites;
  try {
    const parsed = JSON.parse(value);
    favorites = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    favorites = [];
  }
  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* Browsing without storage still leaves the catalog usable. */
    }
  };
  return { favorites, isFavorite: (id) => favorites.includes(id), toggleFavorite };
}
