import { useCallback, useEffect, useRef, useState } from "react";
import { MatchService } from "../match-service";
import type { Database } from "../../supabase/database.types";

type Match = Database["public"]["Tables"]["matches"]["Row"];

export interface UseMatchTimerReturn {
  currentDuration: number;
  formattedTime: string;
  minutes: number;
  seconds: number;
  isPaused: boolean;
  isActive: boolean;
  isTimerBusy: boolean;
  startMatch: () => Promise<void>;
  pauseMatch: () => Promise<void>;
  resumeMatch: () => Promise<void>;
  endMatch: (winnerTeam?: "A" | "B" | null) => Promise<void>;
  refreshMatch: () => void;
}

export function useMatchTimer(
  match: Match | null,
  onMatchUpdate?: (match: Match) => void,
): UseMatchTimerReturn {
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isTimerBusy, setIsTimerBusy] = useState(false);

  // Use refs to track previous values and prevent unnecessary updates
  const prevMatchId = useRef<string | null>(null);
  const prevMatchStatus = useRef<string | null>(null);
  const onMatchUpdateRef = useRef(onMatchUpdate);

  // Update ref when callback changes
  useEffect(() => {
    onMatchUpdateRef.current = onMatchUpdate;
  }, [onMatchUpdate]);

  // Update timer state based on match - only when match actually changes
  useEffect(() => {
    const matchId = match?.id;
    const matchStatus = match?.match_status;

    // Only update if match ID or status actually changed
    if (
      prevMatchId.current === matchId && prevMatchStatus.current === matchStatus
    ) {
      if (process.env.NODE_ENV === "development") {
      }
      return;
    }

    if (!match) {
      setCurrentDuration(0);
      setIsPaused(false);
      setIsActive(false);
      prevMatchId.current = null;
      prevMatchStatus.current = null;
      return;
    }

    setIsPaused(match.match_status === "paused");
    setIsActive(match.match_status === "active");

    // Calculate initial duration
    const duration = MatchService.calculateCurrentDuration(match);
    setCurrentDuration(duration);

    // Update refs
    prevMatchId.current = matchId || null;
    prevMatchStatus.current = matchStatus || null;
  }, [match?.id, match?.match_status]);

  // Timer interval for active matches
  useEffect(() => {
    if (!match || !isActive || isPaused) return;

    const interval = setInterval(() => {
      const duration = MatchService.calculateCurrentDuration(match);
      setCurrentDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [match, isActive, isPaused]);

  // Format time for display
  const { minutes, seconds, formatted: formattedTime } = MatchService
    .formatDuration(currentDuration);

  // Match control functions - memoized to prevent unnecessary re-renders
  const startMatch = useCallback(async () => {
    if (!match || isTimerBusy) return;

    setIsTimerBusy(true);
    try {
      const updatedMatch = await MatchService.startMatch(match.id);
      if (updatedMatch && onMatchUpdateRef.current) {
        onMatchUpdateRef.current(updatedMatch);
      }
    } finally {
      setIsTimerBusy(false);
    }
  }, [match?.id, isTimerBusy]);

  const pauseMatch = useCallback(async () => {
    if (!match || isTimerBusy) {
      return;
    }

    setIsTimerBusy(true);
    try {
      const updatedMatch = await MatchService.pauseMatch(match.id);
      if (updatedMatch && onMatchUpdateRef.current) {
        onMatchUpdateRef.current(updatedMatch);
      }
    } finally {
      setIsTimerBusy(false);
    }
  }, [match?.id, isTimerBusy]);

  const resumeMatch = useCallback(async () => {
    if (!match || isTimerBusy) {
      return;
    }

    setIsTimerBusy(true);
    try {
      const updatedMatch = await MatchService.resumeMatch(match.id);
      if (updatedMatch && onMatchUpdateRef.current) {
        onMatchUpdateRef.current(updatedMatch);
      }
    } finally {
      setIsTimerBusy(false);
    }
  }, [match?.id, isTimerBusy]);

  const endMatch = useCallback(async (winnerTeam?: "A" | "B" | null) => {
    if (!match || isTimerBusy) {
      return;
    }

    setIsTimerBusy(true);
    try {
      const updatedMatch = await MatchService.endMatch(match.id, winnerTeam);

      if (updatedMatch && onMatchUpdateRef.current) {
        onMatchUpdateRef.current(updatedMatch);
      } else {
      }
    } finally {
      setIsTimerBusy(false);
    }
  }, [match?.id, match?.match_status, isTimerBusy]);

  const refreshMatch = useCallback(() => {
    if (match) {
      const duration = MatchService.calculateCurrentDuration(match);
      setCurrentDuration(duration);
    }
  }, [match?.id]);

  return {
    currentDuration,
    formattedTime,
    minutes,
    seconds,
    isPaused,
    isActive,
    isTimerBusy,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    refreshMatch,
  };
}
