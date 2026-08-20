import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";

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
      } catch (error) {
        setFavoriteIds((current) =>
          wasFavorite
            ? [...current, normalizedId]
            : current.filter((favoriteId) => favoriteId !== normalizedId),
        );
        // Report why the save was refused. A single generic message made a
        // rejected session indistinguishable from an unverified email or an
        // offline device, which is what made this hard to diagnose.
        if (error instanceof ApiError) {
          if (error.isVerificationError) {
            setFavoriteError("Verify your email to save places.");
          } else if (error.isAuthError) {
            setFavoriteError("Your session expired. Sign in again to save places.");
          } else if (error.code === "network_error") {
            setFavoriteError("We couldn't reach Compass. Check your connection and try again.");
          } else if (error.status === 404) {
            setFavoriteError("This place can't be saved yet.");
          } else {
            setFavoriteError("We couldn't update saved places. Try again.");
          }
        } else {
          setFavoriteError("We couldn't update saved places. Try again.");
        }
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