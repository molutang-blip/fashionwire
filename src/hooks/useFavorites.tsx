'use client';

import { useEffect, useState, useCallback } from "react";
import type {
  FavoriteEntry,
  FavoriteKind,
  FavoriteTrending,
  FavoriteBrandUpdate,
  FavoriteHotItem
} from "@/domain/types";
import {
  loadFavorites,
  saveFavorites,
  isFavorited as isFavoritedInList
} from "@/lib/favorites-storage";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const persist = useCallback((next: FavoriteEntry[]) => {
    setFavorites(next);
    saveFavorites(next);
  }, []);

  const toggleFavorite = useCallback(
    (entry: FavoriteEntry) => {
      const exists = isFavoritedInList(favorites, entry.kind, entry.id);
      if (exists) {
        const next = favorites.filter(
          (f) => !(f.kind === entry.kind && f.id === entry.id)
        );
        persist(next);
      } else {
        const now = new Date().toISOString();
        const withTimestamp: FavoriteEntry = { ...entry, createdAt: now };
        const next = [withTimestamp, ...favorites];
        persist(next);
      }
    },
    [favorites, persist]
  );

  const isFavorited = useCallback(
    (kind: FavoriteKind, id: string) => isFavoritedInList(favorites, kind, id),
    [favorites]
  );

  const addTrending = useCallback(
    (payload: Omit<FavoriteTrending, "createdAt" | "kind">) => {
      toggleFavorite({
        ...payload,
        kind: "trending",
        createdAt: new Date().toISOString()
      });
    },
    [toggleFavorite]
  );

  const addBrandUpdate = useCallback(
    (payload: Omit<FavoriteBrandUpdate, "createdAt" | "kind">) => {
      toggleFavorite({
        ...payload,
        kind: "brandUpdate",
        createdAt: new Date().toISOString()
      });
    },
    [toggleFavorite]
  );

  const addHotItem = useCallback(
    (payload: Omit<FavoriteHotItem, "createdAt" | "kind">) => {
      toggleFavorite({
        ...payload,
        kind: "hotItem",
        createdAt: new Date().toISOString()
      });
    },
    [toggleFavorite]
  );

  return {
    favorites,
    isFavorited,
    toggleFavorite,
    addTrending,
    addBrandUpdate,
    addHotItem
  };
}
