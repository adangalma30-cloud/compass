import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

function normalizeId(id: string | number) {
  return String(id);
}

export function useFavorites(isSignedIn = false, isVerified = false) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    if (!isSignedIn || !isVerified) return;
    let cancelled = false;
    api
      .getFavorites()
      .then((ids) => {
        if (!cancelled) setFavoriteIds(ids);
      })
      .catch(() => {
        if (!cancelled) setFavoriteError("Saved places are temporarily unavailable.");
      });
    return () => {
      cancelled = true;
      // Dropping the cached list when the session ends prevents one account's
      // saved places from being shown to the next user of the device.
      setFavoriteIds([]);
      setFavoriteError("");
    };
  }, [isSignedIn, isVerified]);

  const toggleFavorite = useCallback(
    async (id: string | number) => {
      if (!isSignedIn || !isVerified) {
        setFavoriteError("Verify your email to save businesses.");
        return;
      }
      const normalizedId = normalizeId(id);
      const wasFavorite = favoriteIds.includes(normalizedId);
      setFavoriteError("");
      setFavoriteIds((current) =>
        wasFavorite
          ? current.filter((favoriteId) => favoriteId !== normalizedId)
          : [...current, normalizedId],
      );
      try {
        if (wasFavorite) {
          await api.removeFavorite(normalizedId);
        } else {
          await api.addFavorite(normalizedId);
        }
      } catch {
        setFavoriteIds((current) =>
          wasFavorite
            ? [...current, normalizedId]
            : current.filter((favoriteId) => favoriteId !== normalizedId),
        );
        setFavoriteError("We couldn't update saved places. Try again.");
      }
    },
    [favoriteIds, isSignedIn, isVerified],
  );

  const isFavorite = useCallback(
    (id: string | number) => favoriteIds.includes(normalizeId(id)),
    [favoriteIds],
  );

  const visibleFavoriteIds = isSignedIn && isVerified ? favoriteIds : [];

  return {
    favoriteIds: visibleFavoriteIds,
    toggleFavorite,
    isFavorite,
    favoriteError,
  };
}