import type { FavoriteEntry, FavoriteKind } from "@/domain/types";

const STORAGE_KEY = "fashion-favorites-v1";

export function loadFavorites(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveFavorites(entries: FavoriteEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

export function isFavorited(entries: FavoriteEntry[], kind: FavoriteKind, id: string) {
  return entries.some((entry) => entry.kind === kind && entry.id === id);
}
