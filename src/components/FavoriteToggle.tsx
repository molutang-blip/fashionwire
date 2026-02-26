'use client';

import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteKind } from "@/domain/types";

interface FavoriteToggleProps {
  id: string;
  kind: FavoriteKind;
  label: string;
  meta?: string;
}

export function FavoriteToggle({ id, kind, label, meta }: FavoriteToggleProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const active = isFavorited(kind, id);

  return (
    <button
      onClick={() =>
        toggleFavorite({ id, kind, label, meta, createdAt: new Date().toISOString() })
      }
      className={`text-base transition-colors ${
        active ? "text-rose-500" : "text-neutral-300 hover:text-neutral-500"
      }`}
      aria-label={active ? "取消收藏" : "收藏"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
