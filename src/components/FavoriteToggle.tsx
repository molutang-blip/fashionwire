'use client';

import { cn } from "@/lib/utils";
import type { FavoriteKind } from "@/domain/types";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteToggleProps {
  id: string;
  kind: FavoriteKind;
  label: string;
  meta?: string;
}

export function FavoriteToggle({ id, kind, label, meta }: FavoriteToggleProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const active = isFavorited(kind, id);

  const handleClick = () => {
    toggleFavorite({
      id,
      kind,
      createdAt: new Date().toISOString(),
      ...(kind === "trending"
        ? { titleZh: label, titleEn: meta ?? "" }
        : kind === "brandUpdate"
        ? { brand: meta ?? "", title: label }
        : { brand: meta ?? "", name: label, imageUrl: "" })
    } as any);
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-neutral-300 text-neutral-500 hover:bg-neutral-100"
      )}
    >
      <span className="mr-1">{active ? "♥" : "♡"}</span>
      <span>收藏</span>
    </button>
  );
}
