"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth-context";
import {
  addPlayerToField,
  addPlayerToMatch,
  addScore,
  assignGoalkeeper,
  controlMatch,
  createMatch,
  deleteMatch,
  removeGoalkeeper,
  removePlayerFromMatch,
  resetMatch,
  toggleVests,
  updatePlayerTeam,
} from "@/app/actions";
import {
  convertPlannedGameToActiveGameData,
  getAvailablePlayersForSelection,
} from "../game-utils";
import { updateURLForGame } from "./useGameData";
import type {
  ActiveGameData,
  GoalDialogState,
  Match,
  Player,
  PlayerSelectState,
} from "../types";
import type { GameContext, GameState } from "./useGameState";

export interface GameActions {
  // Dialog states
  showPlayerSelect: PlayerSelectState;
  goalDialog: GoalDialogState;

  // Actions
  handleScoreIncrement: (team: "A" | "B") => void;
  handleGoalDialogPlayerClick: (player: Player) => void;
  handleGoalDialogSubmit: () => Promise<void>;
  handleGoalDialogCancel: () => void;
  removeSelectedPlayer: (type: "scoring" | "assisting") => void;
  handlePauseToggle: () => Promise<void>;
  handleEndMatch: () => Promise<void>;
  handleEndMatchAndCreateNew: () => Promise<void>;
  handleDeleteGame: () => Promise<void>;
  handleResetGame: () => Promise<void>;
  handleSwapSides: () => void;
  handleVestToggle: (team: "A" | "B") => Promise<void>;
  handleAddPlayer: (team: "A" | "B", isGoalkeeper?: boolean) => void;
  handlePlayerSelect: (player: Player, team: "A" | "B") => Promise<void>;
  handleMultiPlayerSelect: (
    players: Player[],
    team: "A" | "B",
  ) => Promise<void>;
  handleClosePlayerSelect: () => void;
  handleSelectPlannedGame: (game: Match) => Promise<void>;
  handleStartPlannedGame: () => Promise<void>;
  handleBackToMatchesList: () => void;
  handleSelectGame: (game: Match) => Promise<void>;
  handleCreateNewGame: () => Promise<void>;
  handleSwitchPlayerTeam: (
    player: Player,
    newTeam: "A" | "B",
    newIndex?: number,
  ) => Promise<void>;
  handleRemovePlayer: (player: Player) => Promise<void>;
  handleSwapGoalkeepers: () => Promise<void>;
  handleSwapFieldPlayers: () => Promise<void>;

  // Helper functions
  updateTeamState: (newTeamA: Player[], newTeamB: Player[]) => void;
  updateTeamStateAndGoalkeeper: (
    newTeamA: Player[],
    newTeamB: Player[],
    goalkeeperTeam: "A" | "B",
    goalkeeperPlayer: Player | null,
  ) => void;
  ensureCorrectMatch: (operation: string) => boolean;

  // New actions
  handleFillFromAttendees: () => Promise<void>;
  handleRandomizeTeams: () => Promise<void>;

  // Computed values
  availablePlayersForSelection: Player[];

  // Authentication status
  isAuthenticated: boolean;

  // State
  isPauseToggleBusy: boolean;
  isFillFromAttendeesLoading: boolean;
  isRandomizeTeamsLoading: boolean;
}

export function useGameActions(
  gameState: GameState,
  timer?: ReturnType<typeof import("./useMatchTimer").useMatchTimer>,
): GameActions {
  const queryClient = useQueryClient();
  const { user, player } = useAuth();
  const isAuthenticated = Boolean(user && player);

  const [showPlayerSelect, setShowPlayerSelect] = useState<PlayerSelectState>({
    team: null,
    isGoalkeeper: false,
  });
  const [goalDialog, setGoalDialog] = useState<GoalDialogState>({
    isOpen: false,
    team: null,
    scoringPlayer: null,
    assistingPlayer: null,
  });
  const [isPauseToggleBusy, setIsPauseToggleBusy] = useState(false);

  // Helper function to ensure we're operating on the correct match
  const ensureCorrectMatch = (operation: string): boolean => {
    if (!gameState.currentGameContext) {
      console.error(`${operation}: No current game context`);
      return false;
    }

    return true;
  };

  // Helper function to check authentication for actions
  const requireAuth = (action: string): boolean => {
    if (!isAuthenticated) {
      // Authentication errors are handled by the auth system
      return false;
    }
    return true;
  };

  // Helper function to update both local state and currentGameContext
  const updateTeamState = (newTeamA: Player[], newTeamB: Player[]) => {
    gameState.setLocalTeamA(newTeamA);
    gameState.setLocalTeamB(newTeamB);

    if (gameState.currentGameContext) {
      gameState.setCurrentGameContext({
        ...gameState.currentGameContext,
        gameData: {
          ...gameState.currentGameContext.gameData,
          teamA: newTeamA,
          teamB: newTeamB,
        },
      });
    }
  };

  // Helper function to update team state and goalkeeper context simultaneously
  const updateTeamStateAndGoalkeeper = (
    newTeamA: Player[],
    newTeamB: Player[],
    goalkeeperTeam: "A" | "B",
    goalkeeperPlayer: Player | null,
  ) => {
    gameState.setLocalTeamA(newTeamA);
    gameState.setLocalTeamB(newTeamB);

    if (gameState.currentGameContext) {
      gameState.setCurrentGameContext({
        ...gameState.currentGameContext,
        gameData: {
          ...gameState.currentGameContext.gameData,
          teamA: newTeamA,
          teamB: newTeamB,
          goalkeepers: {
            ...gameState.currentGameContext.gameData.goalkeepers,
            [goalkeeperTeam === "A" ? "teamA" : "teamB"]: goalkeeperPlayer,
          },
        },
      });
    }
  };

  // Helper function to refresh current game context after server operations
  const refreshCurrentGameContext = async () => {
    if (!gameState.currentGameContext) return;

    try {
      const matchId = gameState.currentGameContext.matchId;

      // Import the loadGameById function from useGameState
      const { supabase } = await import("../supabase");

      // Fetch the specific match with updated data
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError || !match) {
        console.error("Failed to refresh game context:", matchError);
        return;
      }

      // Calculate game count
      const { data: allMatches, error: countError } = await supabase
        .from("matches")
        .select("id, created_at")
        .order("created_at", { ascending: true });

      if (countError) {
        console.error("Failed to get game count:", countError);
        return;
      }

      const gameCount = allMatches?.findIndex((m) => m.id === match.id) + 1 ||
        1;
      const matchWithCount = { ...match, gameCount };

      // Get match players with updated team assignments
      const { data: matchPlayers, error: playersError } = await supabase
        .from("match_players")
        .select(`
          *,
          players (*)
        `)
        .eq("match_id", match.id);

      if (playersError) {
        console.error("Failed to refresh match players:", playersError);
        return;
      }

      // Get scores
      const { data: scores, error: scoresError } = await supabase
        .from("scores")
        .select("*")
        .eq("match_id", match.id);

      if (scoresError) {
        console.error("Failed to refresh scores:", scoresError);
        return;
      }

      if (matchPlayers) {
        const teamA = matchPlayers
          .filter((mp) => mp.team === "A" && !mp.is_goalkeeper)
          .map((mp) => mp.players)
          .filter(Boolean) as Player[];

        const teamB = matchPlayers
          .filter((mp) => mp.team === "B" && !mp.is_goalkeeper)
          .map((mp) => mp.players)
          .filter(Boolean) as Player[];

        const goalkeepers = {
          teamA: matchPlayers.find((mp) =>
            mp.team === "A" && mp.is_goalkeeper
          )?.players || null,
          teamB: matchPlayers.find((mp) =>
            mp.team === "B" && mp.is_goalkeeper
          )?.players || null,
        };

        const refreshedGameData = {
          match: matchWithCount,
          teamA,
          teamB,
          scores: scores || [],
          goalkeepers,
        };

        // Update the current game context with fresh data
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: refreshedGameData,
        });

        // Also update local team state
        gameState.setLocalTeamA([...teamA]);
        gameState.setLocalTeamB([...teamB]);
      }
    } catch (error) {
      console.error("Error refreshing current game context:", error);
    }
  };

  // Event handlers
  const handleScoreIncrement = async (team: "A" | "B") => {
    if (!requireAuth("score increment")) return;
    if (!ensureCorrectMatch("Score increment")) return;

    setGoalDialog({
      isOpen: true,
      team,
      scoringPlayer: null,
      assistingPlayer: null,
    });
  };

  const handleGoalDialogPlayerClick = (player: Player) => {
    setGoalDialog((prev) => {
      const isScoring = prev.scoringPlayer?.id === player.id;
      const isAssisting = prev.assistingPlayer?.id === player.id;

      if (isScoring) {
        if (!prev.assistingPlayer) {
          return { ...prev, scoringPlayer: null, assistingPlayer: player };
        } else {
          return { ...prev, scoringPlayer: null };
        }
      }

      if (isAssisting) {
        return { ...prev, assistingPlayer: null };
      }

      if (!prev.scoringPlayer) {
        return { ...prev, scoringPlayer: player };
      }

      if (!prev.assistingPlayer) {
        return { ...prev, assistingPlayer: player };
      }

      // Only one assisting player can be selected - silently ignore additional selections
      return prev;
    });
  };

  const handleGoalDialogSubmit = async () => {
    if (!ensureCorrectMatch("Goal dialog submit")) return;
    if (!goalDialog.team) return;

    // Create optimistic score update
    const optimisticScore = {
      id: `temp-${Date.now()}`,
      match_id: gameState.currentGameContext!.matchId,
      team: goalDialog.team,
      score_time: `${timer?.currentDuration || 0} seconds`,
      scoring_player_id: goalDialog.scoringPlayer?.id || null,
      assisting_player_id: goalDialog.assistingPlayer?.id || null,
    };

    // Optimistically update the local state
    if (gameState.currentGameContext) {
      const updatedGameData = {
        ...gameState.currentGameContext.gameData,
        scores: [
          ...gameState.currentGameContext.gameData.scores,
          optimisticScore,
        ],
      };

      gameState.setCurrentGameContext({
        ...gameState.currentGameContext,
        gameData: updatedGameData,
      });
    }

    // Close the dialog immediately for better UX
    setGoalDialog({
      isOpen: false,
      team: null,
      scoringPlayer: null,
      assistingPlayer: null,
    });

    try {
      const result = await addScore({
        matchId: gameState.currentGameContext!.matchId,
        team: goalDialog.team,
        scoringPlayerId: goalDialog.scoringPlayer?.id,
        assistingPlayerId: goalDialog.assistingPlayer?.id,
      });

      if (result.validationErrors) {
        // Revert optimistic update
        if (gameState.currentGameContext) {
          const revertedGameData = {
            ...gameState.currentGameContext.gameData,
            scores: gameState.currentGameContext.gameData.scores.filter((s) =>
              s.id !== optimisticScore.id
            ),
          };
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: revertedGameData,
          });
        }
        return;
      }

      if (result.serverError) {
        // Revert optimistic update
        if (gameState.currentGameContext) {
          const revertedGameData = {
            ...gameState.currentGameContext.gameData,
            scores: gameState.currentGameContext.gameData.scores.filter((s) =>
              s.id !== optimisticScore.id
            ),
          };
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: revertedGameData,
          });
        }
        return;
      }

      if (result.data) {
        // Refresh the game data to get the updated scores from the server
        gameState.refreshGameData();
      }
    } catch (error) {
      console.error("Error adding score:", error);
      // Score addition failed - optimistic update will be reverted
      // Revert optimistic update
      if (gameState.currentGameContext) {
        const revertedGameData = {
          ...gameState.currentGameContext.gameData,
          scores: gameState.currentGameContext.gameData.scores.filter((s) =>
            s.id !== optimisticScore.id
          ),
        };
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: revertedGameData,
        });
      }
    }
  };

  const handleGoalDialogCancel = () => {
    setGoalDialog({
      isOpen: false,
      team: null,
      scoringPlayer: null,
      assistingPlayer: null,
    });
  };

  const removeSelectedPlayer = (type: "scoring" | "assisting") => {
    setGoalDialog((prev) => ({
      ...prev,
      [type === "scoring" ? "scoringPlayer" : "assistingPlayer"]: null,
    }));
  };

  const handlePauseToggle = async () => {
    if (!requireAuth("pause/resume match")) return;
    if (!ensureCorrectMatch("pause/resume match")) return;

    // Check if we're already busy to prevent rapid clicking
    if (isPauseToggleBusy || timer?.isTimerBusy) {
      return;
    }

    // Set busy state immediately to prevent double clicks
    setIsPauseToggleBusy(true);

    try {
      // Use timer functions if available, otherwise fall back to server action
      if (timer) {
        if (timer.isPaused) {
          await timer.resumeMatch();
        } else {
          await timer.pauseMatch();
        }
      } else {
        const action = gameState.timer.isPaused ? "resume" : "pause";
        const newStatus = gameState.timer.isPaused ? "active" : "paused";

        // Update local state immediately for better UX
        if (gameState.currentGameContext) {
          const updatedMatch = {
            ...gameState.currentGameContext.gameData.match,
            match_status: newStatus,
          };

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: {
              ...gameState.currentGameContext.gameData,
              match: updatedMatch,
            },
          });
        }

        // Call server action in background
        const result = await controlMatch({
          matchId: gameState.currentGameContext!.matchId,
          action,
        });

        if (result.validationErrors || result.serverError) {
          console.error(
            "Database update failed:",
            result.validationErrors || result.serverError,
          );
          // Revert local state on error
          gameState.refreshGameData();
        } else {
        }
      }
    } catch (error) {
      console.error("Error toggling pause:", error);
      // Revert local state on error
      gameState.refreshGameData();
    } finally {
      // Always clear busy state when done
      setIsPauseToggleBusy(false);
    }
  };

  const handleEndMatch = async () => {
    if (!requireAuth("end match")) return;
    if (!ensureCorrectMatch("End match")) return;

    try {
      gameState.setIsEndingGame(true);

      const winnerTeam = gameState.teamAScore > gameState.teamBScore
        ? "A"
        : gameState.teamBScore > gameState.teamAScore
        ? "B"
        : null;

      const result = await controlMatch({
        matchId: gameState.currentGameContext!.matchId,
        action: "end",
        winnerTeam: winnerTeam || undefined,
      });

      if (result.validationErrors || result.serverError) {
        console.error(
          "Database update failed:",
          result.validationErrors || result.serverError,
        );
        // Match end failed - state will be reverted
        gameState.setIsEndingGame(false);
        return;
      }

      const winnerText = winnerTeam
        ? `Team ${winnerTeam} wins!`
        : "Match ended in a tie!";

      gameState.setCurrentGameContext(null);
      gameState.setUserRequestedMatchesList(true);
      gameState.setShowMatchesList(true);
      updateURLForGame(null);

      gameState.refreshGameData();

      setTimeout(() => {
        gameState.setIsEndingGame(false);
      }, 1000);
    } catch (error) {
      console.error("Error ending match:", error);
      // Match end failed - state will be reverted
      gameState.setIsEndingGame(false);
    }
  };

  const handleEndMatchAndCreateNew = async () => {
    if (!requireAuth("end match and create new")) return;
    if (!ensureCorrectMatch("End match and create new")) return;

    try {
      gameState.setIsEndingGame(true);

      const winnerTeam = gameState.teamAScore > gameState.teamBScore
        ? "A"
        : gameState.teamBScore > gameState.teamAScore
        ? "B"
        : null;

      const result = await controlMatch({
        matchId: gameState.currentGameContext!.matchId,
        action: "end",
        winnerTeam: winnerTeam || undefined,
      });

      if (result.validationErrors || result.serverError) {
        console.error(
          "Database update failed:",
          result.validationErrors || result.serverError,
        );
        // Match end failed - state will be reverted
        gameState.setIsEndingGame(false);
        return;
      }

      const currentTeamData = gameState.currentTeamData;

      const createResult = await createMatch({
        teamWithVests: gameState.currentGameContext!.gameData.match
          .team_with_vests as "A" | "B" | null,
        teamAPlayerIds: currentTeamData.teamA.map((player) => player.id),
        teamBPlayerIds: currentTeamData.teamB.map((player) => player.id),
        teamAGoalkeeperId:
          gameState.currentGameContext!.gameData.goalkeepers.teamA?.id || null,
        teamBGoalkeeperId:
          gameState.currentGameContext!.gameData.goalkeepers.teamB?.id || null,
      });

      if (createResult.validationErrors || createResult.serverError) {
        // New match creation failed
        gameState.setIsEndingGame(false);
        return;
      }

      if (createResult.data) {
        const winnerText = winnerTeam
          ? `Team ${winnerTeam} wins!`
          : "Match ended in a tie!";

        gameState.setCurrentGameContext(null);
        gameState.setUserRequestedMatchesList(true);
        gameState.setShowMatchesList(true);
        updateURLForGame(null);

        gameState.refreshGameData();

        setTimeout(() => {
          gameState.setIsEndingGame(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error ending match and creating new:", error);
      // End match and create new failed
      gameState.setIsEndingGame(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!requireAuth("delete game")) return;
    if (!ensureCorrectMatch("Delete game")) return;

    try {
      const result = await deleteMatch({
        matchId: gameState.currentGameContext!.matchId,
      });

      if (result.validationErrors || result.serverError) {
        // Game deletion failed
        return;
      }

      gameState.setCurrentGameContext(null);
      gameState.setUserRequestedMatchesList(true);
      gameState.setShowMatchesList(true);
      updateURLForGame(null);

      gameState.refreshGameData();
    } catch (error) {
      console.error("Error deleting game:", error);
      // Game deletion failed
    }
  };

  const handleResetGame = async () => {
    if (!ensureCorrectMatch("Reset game")) return;

    try {
      const result = await resetMatch({
        matchId: gameState.currentGameContext!.matchId,
      });

      if (result.validationErrors || result.serverError) {
        // Game reset failed
        return;
      }

      // Immediately update the current game context with reset match data
      if (gameState.currentGameContext) {
        const resetMatch = {
          ...gameState.currentGameContext.gameData.match,
          start_time: new Date().toISOString(),
          match_status: "paused",
        };

        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: {
            ...gameState.currentGameContext.gameData,
            match: resetMatch,
            scores: [], // Clear scores
          },
        });
      }

      // Force immediate refetch of game data to get updated timer
      gameState.refreshGameData();
    } catch (error) {
      console.error("Error resetting game:", error);
      // Game reset failed
    }
  };

  const handleSwapSides = () => {
    gameState.setIsSidesSwapped(!gameState.isSidesSwapped);
  };

  const handleVestToggle = async (team: "A" | "B") => {
    if (!ensureCorrectMatch("Vest toggle")) return;

    try {
      const currentTeamWithVests = gameState.currentGameContext!.gameData.match
        .team_with_vests as "A" | "B" | null;
      const newTeamWithVests = currentTeamWithVests === team ? null : team;

      // Update local state immediately for both planned and active games
      const updatedGameData = {
        ...gameState.currentGameContext!.gameData,
        match: {
          ...gameState.currentGameContext!.gameData.match,
          team_with_vests: newTeamWithVests,
        },
      };

      gameState.setCurrentGameContext({
        ...gameState.currentGameContext!,
        gameData: updatedGameData,
      });

      const result = await toggleVests({
        matchId: gameState.currentGameContext!.matchId,
        team: newTeamWithVests,
      });

      if (result.validationErrors) {
        // Invalid input data
        // Revert local state on error
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext!,
          gameData: {
            ...gameState.currentGameContext!.gameData,
            match: {
              ...gameState.currentGameContext!.gameData.match,
              team_with_vests: currentTeamWithVests,
            },
          },
        });
        return;
      }

      if (result.serverError) {
        // Server error occurred
        // Revert local state on error
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext!,
          gameData: {
            ...gameState.currentGameContext!.gameData,
            match: {
              ...gameState.currentGameContext!.gameData.match,
              team_with_vests: currentTeamWithVests,
            },
          },
        });
        return;
      }

      if (result.data) {
        if (gameState.currentGameContext?.type === "planned") {
        } else {
          // For active games, refresh to sync with server
          gameState.refreshGameData();
        }
      }
    } catch (error) {
      console.error("Error toggling vests:", error);
      // Vest update failed
      // Revert local state on error
      if (gameState.currentGameContext) {
        const currentTeamWithVests = gameState.currentGameContext.gameData.match
          .team_with_vests as "A" | "B" | null;
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: {
            ...gameState.currentGameContext.gameData,
            match: {
              ...gameState.currentGameContext.gameData.match,
              team_with_vests: currentTeamWithVests,
            },
          },
        });
      }
    }
  };

  const handleAddPlayer = (team: "A" | "B", isGoalkeeper?: boolean) => {
    // For planned games, use multi-selection mode
    if (gameState.currentGameContext?.type === "planned" && !isGoalkeeper) {
      setShowPlayerSelect({ team, isGoalkeeper: false, isMultiSelect: true });
    } else {
      setShowPlayerSelect({
        team,
        isGoalkeeper: isGoalkeeper || false,
        isMultiSelect: false,
      });
    }
  };

  const handlePlayerSelect = async (player: Player, team: "A" | "B") => {
    if (!ensureCorrectMatch("Add player")) return;

    // Store original state for potential rollback
    const originalGameData = gameState.currentGameContext?.gameData;

    try {
      if (gameState.currentGameContext?.type === "planned") {
        if (showPlayerSelect.isGoalkeeper) {
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                [team === "A" ? "teamA" : "teamB"]: player,
              },
            },
            matchId: gameState.currentGameContext.matchId,
          });
        } else {
          if (team === "A") {
            const newTeamA = [...gameState.localTeamA, player];
            gameState.setLocalTeamA(newTeamA);
            gameState.setCurrentGameContext({
              type: "planned",
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamA: newTeamA,
              },
              matchId: gameState.currentGameContext.matchId,
            });
          } else {
            const newTeamB = [...gameState.localTeamB, player];
            gameState.setLocalTeamB(newTeamB);
            gameState.setCurrentGameContext({
              type: "planned",
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamB: newTeamB,
              },
              matchId: gameState.currentGameContext.matchId,
            });
          }
        }
      } else {
        // Optimistic update for active games
        if (gameState.currentGameContext) {
          let updatedGameData = { ...gameState.currentGameContext.gameData };

          if (showPlayerSelect.isGoalkeeper) {
            updatedGameData.goalkeepers = {
              ...updatedGameData.goalkeepers,
              [team === "A" ? "teamA" : "teamB"]: player,
            };
          } else {
            if (team === "A") {
              updatedGameData.teamA = [...updatedGameData.teamA, player];
            } else {
              updatedGameData.teamB = [...updatedGameData.teamB, player];
            }
          }

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: updatedGameData,
          });
        }
      }

      const result = await addPlayerToMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
        team,
        isGoalkeeper: showPlayerSelect.isGoalkeeper,
      });

      if (result.validationErrors) {
        // Invalid input data
        // Revert optimistic update
        if (originalGameData && gameState.currentGameContext) {
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: originalGameData,
          });
          if (gameState.currentGameContext?.type === "planned") {
            gameState.setLocalTeamA([...originalGameData.teamA]);
            gameState.setLocalTeamB([...originalGameData.teamB]);
          }
        }
        return;
      }

      if (result.serverError) {
        // Server error occurred
        // Revert optimistic update
        if (originalGameData && gameState.currentGameContext) {
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: originalGameData,
          });
          if (gameState.currentGameContext?.type === "planned") {
            gameState.setLocalTeamA([...originalGameData.teamA]);
            gameState.setLocalTeamB([...originalGameData.teamB]);
          }
        }
        return;
      }

      if (result.data) {
        setShowPlayerSelect({ team: null, isGoalkeeper: false });

        // Success - keep the optimistic update for planned games, refresh for active games
        if (gameState.currentGameContext?.type !== "planned") {
          gameState.refreshGameData();
        }
      }
    } catch (error) {
      console.error("Error adding player:", error);
      // Player addition failed

      // Revert optimistic update
      if (originalGameData && gameState.currentGameContext) {
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: originalGameData,
        });
        if (gameState.currentGameContext?.type === "planned") {
          gameState.setLocalTeamA([...originalGameData.teamA]);
          gameState.setLocalTeamB([...originalGameData.teamB]);
        }
      }
    }
  };

  const handleMultiPlayerSelect = async (
    players: Player[],
    team: "A" | "B",
  ) => {
    if (!ensureCorrectMatch("Multi-player select")) return;

    try {
      if (gameState.currentGameContext?.type === "planned") {
        // Get current state
        const currentTeam = team === "A"
          ? gameState.currentGameContext.gameData.teamA
          : gameState.currentGameContext.gameData.teamB;
        const currentGoalkeeper = team === "A"
          ? gameState.currentGameContext.gameData.goalkeepers.teamA
          : gameState.currentGameContext.gameData.goalkeepers.teamB;
        const otherTeam = team === "A"
          ? gameState.currentGameContext.gameData.teamB
          : gameState.currentGameContext.gameData.teamA;

        // Create sets for comparison
        const currentPlayerIds = new Set(currentTeam.map((p) => p.id));
        const newPlayerIds = new Set(players.map((p) => p.id));
        const otherTeamIds = new Set(otherTeam.map((p) => p.id));

        // Check for goalkeeper unassignment
        if (currentGoalkeeper && !newPlayerIds.has(currentGoalkeeper.id)) {
          // Update local state immediately to remove goalkeeper
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                [team === "A" ? "teamA" : "teamB"]: null,
              },
            },
            matchId: gameState.currentGameContext.matchId,
          });

          // Perform database operation asynchronously
          removeGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeper.id,
          }).then((removeResult) => {
            if (removeResult.validationErrors || removeResult.serverError) {
              // Goalkeeper removal failed
              // Revert local state on error
              if (gameState.currentGameContext) {
                gameState.setCurrentGameContext({
                  type: "planned",
                  gameData: {
                    ...gameState.currentGameContext.gameData,
                    goalkeepers: {
                      ...gameState.currentGameContext.gameData.goalkeepers,
                      [team === "A" ? "teamA" : "teamB"]: currentGoalkeeper,
                    },
                  },
                  matchId: gameState.currentGameContext.matchId,
                });
              }
            }
          }).catch((error) => {
            console.error("Error removing goalkeeper:", error);
            // Goalkeeper removal failed
            // Revert local state on error
            if (gameState.currentGameContext) {
              gameState.setCurrentGameContext({
                type: "planned",
                gameData: {
                  ...gameState.currentGameContext.gameData,
                  goalkeepers: {
                    ...gameState.currentGameContext.gameData.goalkeepers,
                    [team === "A" ? "teamA" : "teamB"]: currentGoalkeeper,
                  },
                },
                matchId: gameState.currentGameContext.matchId,
              });
            }
          });
        }

        // Handle cross-team player movement
        const playersFromOtherTeam = players.filter((p) =>
          otherTeamIds.has(p.id)
        );
        for (const player of playersFromOtherTeam) {
          // Update local state immediately to remove from other team
          if (team === "A") {
            const newTeamB = gameState.localTeamB.filter((p) =>
              p.id !== player.id
            );
            gameState.setLocalTeamB(newTeamB);
            gameState.setCurrentGameContext({
              type: "planned",
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamB: newTeamB,
              },
              matchId: gameState.currentGameContext.matchId,
            });
          } else {
            const newTeamA = gameState.localTeamA.filter((p) =>
              p.id !== player.id
            );
            gameState.setLocalTeamA(newTeamA);
            gameState.setCurrentGameContext({
              type: "planned",
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamA: newTeamA,
              },
              matchId: gameState.currentGameContext.matchId,
            });
          }

          // Update team for player in database asynchronously
          updatePlayerTeam({
            matchId: gameState.currentGameContext.matchId,
            playerId: player.id,
            newTeam: team,
          }).then((updateResult) => {
            if (updateResult.validationErrors || updateResult.serverError) {
              // Player move failed
              // Note: We could revert the state here, but since the target team update
              // will handle the final state, we'll let that handle any inconsistencies
            }
          }).catch((error) => {
            console.error(`Error moving player ${player.name}:`, error);
            // Player move failed
          });
        }

        // Update the target team
        if (team === "A") {
          gameState.setLocalTeamA(players);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamA: players,
            },
            matchId: gameState.currentGameContext.matchId,
          });
        } else {
          gameState.setLocalTeamB(players);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamB: players,
            },
            matchId: gameState.currentGameContext.matchId,
          });
        }

        // Handle database operations for the target team
        // Remove players that are no longer in the team
        for (const playerId of currentPlayerIds) {
          if (!newPlayerIds.has(playerId)) {
            await removePlayerFromMatch({
              matchId: gameState.currentGameContext.matchId,
              playerId,
            });
          }
        }

        // Add players that are newly added to the team (excluding those moved from other team)
        const newlyAddedPlayers = players.filter((p) =>
          !currentPlayerIds.has(p.id) && !otherTeamIds.has(p.id)
        );
        for (const player of newlyAddedPlayers) {
          const result = await addPlayerToMatch({
            matchId: gameState.currentGameContext.matchId,
            playerId: player.id,
            team,
            isGoalkeeper: false,
          });

          if (result.validationErrors || result.serverError) {
            // Some players failed to add
            return;
          }
        }
      }

      setShowPlayerSelect({ team: null, isGoalkeeper: false });

      if (gameState.currentGameContext?.type !== "planned") {
        gameState.refreshGameData();
      }
    } catch (error) {
      console.error("Error updating team players:", error);
      // Team player update failed

      if (gameState.currentGameContext?.type === "planned") {
        const revertedGameData = await convertPlannedGameToActiveGameData(
          gameState.currentGameContext.gameData.match,
        );
        gameState.setCurrentGameContext({
          type: "planned",
          gameData: revertedGameData,
          matchId: gameState.currentGameContext.matchId,
        });
        gameState.setLocalTeamA([...revertedGameData.teamA]);
        gameState.setLocalTeamB([...revertedGameData.teamB]);
      }
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    if (!ensureCorrectMatch("Remove player")) return;

    // Store original state for potential rollback
    const originalGameData = gameState.currentGameContext?.gameData;

    try {
      if (gameState.currentGameContext?.type === "planned") {
        const playerInTeamA = gameState.localTeamA.find((p) =>
          p.id === player.id
        );
        const playerInTeamB = gameState.localTeamB.find((p) =>
          p.id === player.id
        );
        const isGoalkeeperA =
          gameState.currentGameContext.gameData.goalkeepers.teamA?.id ===
            player.id;
        const isGoalkeeperB =
          gameState.currentGameContext.gameData.goalkeepers.teamB?.id ===
            player.id;

        if (isGoalkeeperA) {
          // Remove goalkeeper from team A and from field players
          const newTeamA = gameState.localTeamA.filter((p) =>
            p.id !== player.id
          );
          gameState.setLocalTeamA(newTeamA);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamA: newTeamA,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                teamA: null,
              },
            },
            matchId: gameState.currentGameContext.matchId,
          });
        } else if (isGoalkeeperB) {
          // Remove goalkeeper from team B and from field players
          const newTeamB = gameState.localTeamB.filter((p) =>
            p.id !== player.id
          );
          gameState.setLocalTeamB(newTeamB);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamB: newTeamB,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                teamB: null,
              },
            },
            matchId: gameState.currentGameContext.matchId,
          });
        } else if (playerInTeamA) {
          const newTeamA = gameState.localTeamA.filter((p) =>
            p.id !== player.id
          );
          gameState.setLocalTeamA(newTeamA);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamA: newTeamA,
            },
            matchId: gameState.currentGameContext.matchId,
          });
        } else if (playerInTeamB) {
          const newTeamB = gameState.localTeamB.filter((p) =>
            p.id !== player.id
          );
          gameState.setLocalTeamB(newTeamB);
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamB: newTeamB,
            },
            matchId: gameState.currentGameContext.matchId,
          });
        }
      } else {
        // Optimistic update for active games
        if (gameState.currentGameContext) {
          const isGoalkeeperA =
            gameState.currentGameContext.gameData.goalkeepers.teamA?.id ===
              player.id;
          const isGoalkeeperB =
            gameState.currentGameContext.gameData.goalkeepers.teamB?.id ===
              player.id;

          let updatedGameData = { ...gameState.currentGameContext.gameData };

          if (isGoalkeeperA) {
            updatedGameData.goalkeepers = {
              ...updatedGameData.goalkeepers,
              teamA: null,
            };
            // Also remove from field players to prevent showing as field player
            updatedGameData.teamA = updatedGameData.teamA.filter((p) =>
              p.id !== player.id
            );
          } else if (isGoalkeeperB) {
            updatedGameData.goalkeepers = {
              ...updatedGameData.goalkeepers,
              teamB: null,
            };
            // Also remove from field players to prevent showing as field player
            updatedGameData.teamB = updatedGameData.teamB.filter((p) =>
              p.id !== player.id
            );
          } else {
            // Remove from field players
            updatedGameData.teamA = updatedGameData.teamA.filter((p) =>
              p.id !== player.id
            );
            updatedGameData.teamB = updatedGameData.teamB.filter((p) =>
              p.id !== player.id
            );
          }

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: updatedGameData,
          });
        }
      }

      const result = await removePlayerFromMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
      });

      if (result.validationErrors) {
        // Invalid input data
        // Revert optimistic update
        if (originalGameData && gameState.currentGameContext) {
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: originalGameData,
          });
          if (gameState.currentGameContext?.type === "planned") {
            gameState.setLocalTeamA([...originalGameData.teamA]);
            gameState.setLocalTeamB([...originalGameData.teamB]);
          }
        }
        return;
      }

      if (result.serverError) {
        // Server error occurred
        // Revert optimistic update
        if (originalGameData && gameState.currentGameContext) {
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: originalGameData,
          });
          if (gameState.currentGameContext?.type === "planned") {
            gameState.setLocalTeamA([...originalGameData.teamA]);
            gameState.setLocalTeamB([...originalGameData.teamB]);
          }
        }
        return;
      }

      if (result.data) {
        // Success - keep the optimistic update for planned games, refresh for active games
        if (gameState.currentGameContext?.type !== "planned") {
          gameState.refreshGameData();
        }
      }
    } catch (error) {
      console.error("Error removing player:", error);
      // Player removal failed

      // Revert optimistic update
      if (originalGameData && gameState.currentGameContext) {
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: originalGameData,
        });
        if (gameState.currentGameContext?.type === "planned") {
          gameState.setLocalTeamA([...originalGameData.teamA]);
          gameState.setLocalTeamB([...originalGameData.teamB]);
        }
      }
    }
  };

  const handleSwitchPlayerTeam = async (
    player: Player,
    newTeam: "A" | "B",
    newIndex?: number,
  ) => {
    if (!ensureCorrectMatch("Switch player team")) return;

    try {
      const teamA = gameState.localTeamA.length > 0
        ? gameState.localTeamA
        : gameState.currentGameContext!.gameData.teamA;
      const teamB = gameState.localTeamB.length > 0
        ? gameState.localTeamB
        : gameState.currentGameContext!.gameData.teamB;

      const currentTeamA = teamA.find((p) => p.id === player.id);
      const currentTeamB = teamB.find((p) => p.id === player.id);

      const isGoalkeeperA =
        gameState.currentGameContext!.gameData.goalkeepers.teamA?.id ===
          player.id;
      const isGoalkeeperB =
        gameState.currentGameContext!.gameData.goalkeepers.teamB?.id ===
          player.id;

      let currentTeam: "A" | "B" | null = null;
      if (currentTeamA) currentTeam = "A";
      else if (currentTeamB) currentTeam = "B";
      else if (isGoalkeeperA) currentTeam = "A";
      else if (isGoalkeeperB) currentTeam = "B";

      if (!currentTeam) {
        console.error(
          `Player ${player.name} (${player.id}) not found in any team`,
        );
        // Player not found in any team
        return;
      }

      const isCurrentlyGoalkeeper = isGoalkeeperA || isGoalkeeperB;

      if (newIndex !== undefined) {
        // Handle goalkeeper to field movement
        if (isCurrentlyGoalkeeper && newIndex >= 0) {
          if (currentTeam === newTeam) {
            if (currentTeam === "A") {
              const newTeamA = gameState.localTeamA.filter((p) =>
                p.id !== player.id
              );
              const newTeamB = gameState.localTeamB.filter((p) =>
                p.id !== player.id
              );
              newTeamA.splice(newIndex, 0, player);
              updateTeamStateAndGoalkeeper(
                newTeamA,
                newTeamB,
                currentTeam,
                null,
              );
            } else {
              const newTeamA = gameState.localTeamA.filter((p) =>
                p.id !== player.id
              );
              const newTeamB = gameState.localTeamB.filter((p) =>
                p.id !== player.id
              );
              newTeamB.splice(newIndex, 0, player);
              updateTeamStateAndGoalkeeper(
                newTeamA,
                newTeamB,
                currentTeam,
                null,
              );
            }
          } else {
            if (newTeam === "A") {
              const newTeamA = gameState.localTeamA.filter((p) =>
                p.id !== player.id
              );
              const newTeamB = gameState.localTeamB.filter((p) =>
                p.id !== player.id
              );
              newTeamA.splice(newIndex, 0, player);
              updateTeamStateAndGoalkeeper(
                newTeamA,
                newTeamB,
                currentTeam,
                null,
              );
            } else {
              const newTeamA = gameState.localTeamA.filter((p) =>
                p.id !== player.id
              );
              const newTeamB = gameState.localTeamB.filter((p) =>
                p.id !== player.id
              );
              newTeamB.splice(newIndex, 0, player);
              updateTeamStateAndGoalkeeper(
                newTeamA,
                newTeamB,
                currentTeam,
                null,
              );
            }
          }

          Promise.all([
            removeGoalkeeper({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id,
            }),
            addPlayerToField({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam,
            }),
          ]).then(([removeResult, addResult]) => {
            if (
              removeResult.validationErrors || removeResult.serverError ||
              addResult.validationErrors || addResult.serverError
            ) {
              console.error("Failed to move goalkeeper to field");
              // Goalkeeper move failed - state will be reverted
            }
          }).catch((error) => {
            console.error("Error moving goalkeeper to field:", error);
            // Goalkeeper move to field failed
          });

          return;
        }

        // Handle goalkeeper assignment
        if (newIndex === -1) {
          const isGoalkeeperSwap = isCurrentlyGoalkeeper &&
            currentTeam !== newTeam;

          if (isGoalkeeperSwap) {
            const otherGoalkeeper = gameState.currentGameContext!.gameData
              .goalkeepers[newTeam === "A" ? "teamA" : "teamB"];

            let newTeamA = [...gameState.localTeamA];
            let newTeamB = [...gameState.localTeamB];

            newTeamA = newTeamA.filter((p) =>
              p.id !== player.id && p.id !== otherGoalkeeper?.id
            );
            newTeamB = newTeamB.filter((p) =>
              p.id !== player.id && p.id !== otherGoalkeeper?.id
            );

            updateTeamState(newTeamA, newTeamB);

            if (gameState.currentGameContext) {
              gameState.setCurrentGameContext({
                ...gameState.currentGameContext,
                gameData: {
                  ...gameState.currentGameContext.gameData,
                  goalkeepers: {
                    ...gameState.currentGameContext.gameData.goalkeepers,
                    [newTeam === "A" ? "teamA" : "teamB"]: player,
                    [currentTeam === "A" ? "teamA" : "teamB"]:
                      otherGoalkeeper || null,
                  },
                },
              });
            }

            Promise.all([
              assignGoalkeeper({
                matchId: gameState.currentGameContext!.matchId,
                playerId: player.id,
                team: newTeam,
              }),
              otherGoalkeeper
                ? assignGoalkeeper({
                  matchId: gameState.currentGameContext!.matchId,
                  playerId: otherGoalkeeper.id,
                  team: currentTeam,
                })
                : Promise.resolve({
                  validationErrors: null,
                  serverError: null,
                }),
            ]).then(([assignResult1, assignResult2]) => {
              if (
                assignResult1.validationErrors || assignResult1.serverError ||
                assignResult2.validationErrors || assignResult2.serverError
              ) {
                console.error("Failed to swap goalkeepers in database");
                // Goalkeeper swap failed - state will be reverted
              }
            }).catch((error) => {
              console.error("Error swapping goalkeepers:", error);
              // Goalkeeper swap failed
            });
          } else {
            const currentGoalkeeper = gameState.currentGameContext!.gameData
              .goalkeepers[newTeam === "A" ? "teamA" : "teamB"];

            let newTeamA = [...gameState.localTeamA];
            let newTeamB = [...gameState.localTeamB];

            if (currentTeam === "A") {
              newTeamA = newTeamA.filter((p) => p.id !== player.id);
            } else {
              newTeamB = newTeamB.filter((p) => p.id !== player.id);
            }

            if (currentGoalkeeper) {
              newTeamA = newTeamA.filter((p) => p.id !== currentGoalkeeper.id);
              newTeamB = newTeamB.filter((p) => p.id !== currentGoalkeeper.id);

              if (newTeam === "A") {
                newTeamA.push(currentGoalkeeper);
              } else {
                newTeamB.push(currentGoalkeeper);
              }
            }

            updateTeamStateAndGoalkeeper(newTeamA, newTeamB, newTeam, player);

            assignGoalkeeper({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam,
            }).then((assignResult) => {
              if (assignResult.validationErrors || assignResult.serverError) {
                console.error("Failed to assign goalkeeper to database");
                // Goalkeeper assignment failed - state will be reverted
              }
            }).catch((error) => {
              console.error("Error assigning goalkeeper:", error);
              // Goalkeeper assignment failed
            });
          }

          return;
        }

        // Handle field player movement
        if (currentTeam === newTeam) {
          if (currentTeam === "A") {
            const currentIndex = gameState.localTeamA.findIndex((p) =>
              p.id === player.id
            );
            if (currentIndex !== -1) {
              const newTeamA = [...gameState.localTeamA];
              const originalLength = newTeamA.length;
              newTeamA.splice(currentIndex, 1);

              let adjustedIndex = newIndex;
              if (currentIndex < newIndex) {
                if (newIndex === originalLength - 1) {
                  adjustedIndex = newTeamA.length;
                } else {
                  adjustedIndex = newIndex - 1;
                }
              }

              newTeamA.splice(adjustedIndex, 0, player);
              updateTeamState(newTeamA, gameState.localTeamB);
            }
          } else {
            const currentIndex = gameState.localTeamB.findIndex((p) =>
              p.id === player.id
            );
            if (currentIndex !== -1) {
              const newTeamB = [...gameState.localTeamB];
              const originalLength = newTeamB.length;
              newTeamB.splice(currentIndex, 1);

              let adjustedIndex = newIndex;
              if (currentIndex < newIndex) {
                if (newIndex === originalLength - 1) {
                  adjustedIndex = newTeamB.length;
                } else {
                  adjustedIndex = newIndex - 1;
                }
              }

              newTeamB.splice(adjustedIndex, 0, player);
              updateTeamState(gameState.localTeamA, newTeamB);
            }
          }
        } else {
          if (currentTeam === "A" && newTeam === "B") {
            const currentIndex = gameState.localTeamA.findIndex((p) =>
              p.id === player.id
            );
            if (currentIndex !== -1) {
              const newTeamA = [...gameState.localTeamA];
              newTeamA.splice(currentIndex, 1);

              const newTeamB = [...gameState.localTeamB];
              newTeamB.splice(newIndex, 0, player);

              updateTeamState(newTeamA, newTeamB);
            }
          } else if (currentTeam === "B" && newTeam === "A") {
            const currentIndex = gameState.localTeamB.findIndex((p) =>
              p.id === player.id
            );
            if (currentIndex !== -1) {
              const newTeamB = [...gameState.localTeamB];
              newTeamB.splice(currentIndex, 1);

              const newTeamA = [...gameState.localTeamA];
              newTeamA.splice(newIndex, 0, player);

              updateTeamState(newTeamA, newTeamB);
            }
          }

          updatePlayerTeam({
            matchId: gameState.currentGameContext!.matchId,
            playerId: player.id,
            newTeam: newTeam,
          }).then((result) => {
            if (result.validationErrors || result.serverError) {
              console.error("Failed to sync team change to database");
              // Team change failed - state will be reverted
            }
          }).catch((error) => {
            console.error("Error syncing team change to database:", error);
            // Team change failed - state will be reverted
          });
        }

        return;
      }

      // Fallback to server operations
      const removeResult = await removePlayerFromMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
      });

      if (removeResult.validationErrors || removeResult.serverError) {
        // Player removal from current team failed
        return;
      }

      const addResult = await addPlayerToMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
        team: newTeam,
        isGoalkeeper: false,
      });

      if (addResult.validationErrors) {
        // Invalid input data
        return;
      }

      if (addResult.serverError) {
        // Server error occurred
        return;
      }

      if (addResult.data) {
        if (gameState.currentGameContext?.type === "planned") {
          const updatedGameData = await convertPlannedGameToActiveGameData(
            gameState.currentGameContext.gameData.match,
          );
          gameState.setCurrentGameContext({
            type: "planned",
            gameData: updatedGameData,
            matchId: updatedGameData.match.id,
          });
        } else {
          gameState.refreshGameData();
        }
      }
    } catch (error) {
      console.error("Error in handleSwitchPlayerTeam:", error);
      // Player team switch failed
    }
  };

  const handleSwapGoalkeepers = async () => {
    if (!requireAuth("swap goalkeepers")) return;
    if (!ensureCorrectMatch("Swap goalkeepers")) return;

    try {
      const currentGoalkeeperA =
        gameState.currentGameContext!.gameData.goalkeepers.teamA;
      const currentGoalkeeperB =
        gameState.currentGameContext!.gameData.goalkeepers.teamB;

      // Check if at least one team has a goalkeeper
      if (!currentGoalkeeperA && !currentGoalkeeperB) {
        // No goalkeeper to swap
        return;
      }

      let newGoalkeeperA: Player | null = null;
      let newGoalkeeperB: Player | null = null;
      let assignResultA: any = null;
      let assignResultB: any = null;

      if (currentGoalkeeperA && currentGoalkeeperB) {
        // Both teams have goalkeepers - swap them
        newGoalkeeperA = currentGoalkeeperB;
        newGoalkeeperB = currentGoalkeeperA;

        // Update local state immediately for better UX
        if (gameState.currentGameContext) {
          const updatedGameData = {
            ...gameState.currentGameContext.gameData,
            goalkeepers: {
              teamA: newGoalkeeperA,
              teamB: newGoalkeeperB,
            },
          };

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: updatedGameData,
          });
        }

        // Perform database operations in parallel
        const [resultA, resultB] = await Promise.all([
          assignGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperB.id,
            team: "A",
          }),
          assignGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperA.id,
            team: "B",
          }),
        ]);
        assignResultA = resultA;
        assignResultB = resultB;
      } else if (currentGoalkeeperA) {
        // Only team A has a goalkeeper - move to team B
        newGoalkeeperA = null;
        newGoalkeeperB = currentGoalkeeperA;

        // Update local state immediately for better UX
        if (gameState.currentGameContext) {
          const updatedGameData = {
            ...gameState.currentGameContext.gameData,
            goalkeepers: {
              teamA: null,
              teamB: currentGoalkeeperA,
            },
          };

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: updatedGameData,
          });
        }

        // Remove from team A and assign to team B
        const [removeResult, assignResult] = await Promise.all([
          removeGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperA.id,
          }),
          assignGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperA.id,
            team: "B",
          }),
        ]);
        assignResultA = removeResult;
        assignResultB = assignResult;
      } else if (currentGoalkeeperB) {
        // Only team B has a goalkeeper - move to team A
        newGoalkeeperA = currentGoalkeeperB;
        newGoalkeeperB = null;

        // Update local state immediately for better UX
        if (gameState.currentGameContext) {
          const updatedGameData = {
            ...gameState.currentGameContext.gameData,
            goalkeepers: {
              teamA: currentGoalkeeperB,
              teamB: null,
            },
          };

          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: updatedGameData,
          });
        }

        // Remove from team B and assign to team A
        const [removeResult, assignResult] = await Promise.all([
          removeGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperB.id,
          }),
          assignGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeperB.id,
            team: "A",
          }),
        ]);
        assignResultA = assignResult;
        assignResultB = removeResult;
      }

      if (
        assignResultA.validationErrors || assignResultA.serverError ||
        assignResultB.validationErrors || assignResultB.serverError
      ) {
        console.error("Failed to swap goalkeepers in database");
        // Goalkeeper swap may not have been saved correctly

        // Revert local state on error
        if (gameState.currentGameContext) {
          const revertedGameData = {
            ...gameState.currentGameContext.gameData,
            goalkeepers: {
              teamA: currentGoalkeeperA,
              teamB: currentGoalkeeperB,
            },
          };
          gameState.setCurrentGameContext({
            ...gameState.currentGameContext,
            gameData: revertedGameData,
          });
        }
        return;
      }

      // For active games, refresh to sync with server
      if (gameState.currentGameContext?.type !== "planned") {
        gameState.refreshGameData();
      }
    } catch (error) {
      console.error("Error swapping goalkeepers:", error);
      // Goalkeeper swap failed

      // Revert local state on error
      if (gameState.currentGameContext) {
        const currentGoalkeeperA =
          gameState.currentGameContext.gameData.goalkeepers.teamA;
        const currentGoalkeeperB =
          gameState.currentGameContext.gameData.goalkeepers.teamB;
        const revertedGameData = {
          ...gameState.currentGameContext.gameData,
          goalkeepers: {
            teamA: currentGoalkeeperA,
            teamB: currentGoalkeeperB,
          },
        };
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: revertedGameData,
        });
      }
    }
  };

  const handleSwapFieldPlayers = async () => {
    if (!requireAuth("swap field players")) return;
    if (!ensureCorrectMatch("Swap field players")) return;

    try {
      const currentGameData = gameState.currentGameContext!.gameData;
      const currentGoalkeeperA = currentGameData.goalkeepers.teamA;
      const currentGoalkeeperB = currentGameData.goalkeepers.teamB;

      // Get current field players (excluding goalkeepers)
      const teamAFieldPlayers = gameState.localTeamA.filter((p) =>
        !currentGoalkeeperA || p.id !== currentGoalkeeperA.id
      );
      const teamBFieldPlayers = gameState.localTeamB.filter((p) =>
        !currentGoalkeeperB || p.id !== currentGoalkeeperB.id
      );

      // Check if there are field players to swap
      if (teamAFieldPlayers.length === 0 && teamBFieldPlayers.length === 0) {
        // No field players available
        return;
      }

      // Create new teams with swapped field players but same goalkeepers
      const newTeamA = [...teamBFieldPlayers];
      const newTeamB = [...teamAFieldPlayers];

      // Add goalkeepers back to their original teams
      if (currentGoalkeeperA) {
        newTeamA.push(currentGoalkeeperA);
      }
      if (currentGoalkeeperB) {
        newTeamB.push(currentGoalkeeperB);
      }

      // Update local state immediately for better UX
      updateTeamState(newTeamA, newTeamB);

      // Update database - move all field players to opposite teams
      const updatePromises: Promise<any>[] = [];

      // Move team A field players to team B
      teamAFieldPlayers.forEach((player) => {
        updatePromises.push(
          updatePlayerTeam({
            matchId: gameState.currentGameContext!.matchId,
            playerId: player.id,
            newTeam: "B",
          }),
        );
      });

      // Move team B field players to team A
      teamBFieldPlayers.forEach((player) => {
        updatePromises.push(
          updatePlayerTeam({
            matchId: gameState.currentGameContext!.matchId,
            playerId: player.id,
            newTeam: "A",
          }),
        );
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);

      // Check if any updates failed
      const failedUpdates = results.filter((result) =>
        result.validationErrors || result.serverError
      );

      if (failedUpdates.length > 0) {
        // Revert local state on failure
        updateTeamState(gameState.localTeamA, gameState.localTeamB);
        // Team swap failed
        return;
      }
    } catch (error) {
      console.error("Error swapping field players:", error);
      // Team swap failed
    }
  };

  const handleClosePlayerSelect = () => {
    setShowPlayerSelect({ team: null, isGoalkeeper: false });
  };

  const handleSelectPlannedGame = async (game: Match) => {
    try {
      const gameData = await convertPlannedGameToActiveGameData(game);
      gameState.setCurrentGameContext({
        type: "planned",
        gameData: gameData,
        matchId: game.id,
      });
    } catch (error) {
      console.error("Error loading planned game:", error);
      // Planned game load failed
    }
  };

  const handleStartPlannedGame = async () => {
    if (!ensureCorrectMatch("Start planned game")) return;

    gameState.setIsStartingGame(true);
    gameState.setStartingGameId(gameState.currentGameContext!.matchId);

    const updatedGameData = {
      ...gameState.currentGameContext!.gameData,
      match: {
        ...gameState.currentGameContext!.gameData.match,
        match_status: "active" as const,
        start_time: new Date().toISOString(),
      },
    };
    gameState.setCurrentGameContext({
      type: "active",
      gameData: updatedGameData,
      matchId: gameState.currentGameContext!.matchId,
    });

    // Update URL to reflect the game is now active
    updateURLForGame(gameState.currentGameContext!.matchId);

    gameState.setIsStartingGame(false);
    gameState.setStartingGameId(null);

    controlMatch({
      matchId: gameState.currentGameContext!.gameData.match.id,
      action: "start",
    }).then((result) => {
      if (result.validationErrors || result.serverError) {
        console.error(
          "Database update failed:",
          result.validationErrors || result.serverError,
        );
        // Game start failed - state will be reverted
      } else {
      }
    }).catch((error) => {
      console.error("Error starting game:", error);
      // Game start failed - state will be reverted
    });
  };

  const handleBackToMatchesList = () => {
    gameState.setCurrentGameContext(null);
    gameState.setUserRequestedMatchesList(true);
    gameState.setShowMatchesList(true);
    updateURLForGame(null);
    gameState.refreshGameData();
  };

  const handleSelectGame = async (game: Match) => {
    try {
      gameState.setUserRequestedMatchesList(false);

      if (gameState.isEndingGame) {
        gameState.setIsEndingGame(false);
      }

      gameState.setSelectedGameId(game.id);

      const gameData = await convertPlannedGameToActiveGameData(game);

      const contextType =
        (game.match_status === "active" || game.match_status === "paused")
          ? "active"
          : "planned";

      gameState.setCurrentGameContext({
        type: contextType,
        gameData: gameData,
        matchId: game.id,
      });
      gameState.setShowMatchesList(false);
      updateURLForGame(game.id);
    } catch (error) {
      console.error("Error loading game:", error);
      // Game load failed
    }
  };

  const handleCreateNewGame = async () => {
    if (!requireAuth("create new game")) return;
    gameState.setIsCreatingGame(true);
    try {
      if (gameState.isEndingGame) {
        gameState.setIsEndingGame(false);
      }

      const result = await createMatch({
        teamWithVests: null,
        teamAPlayerIds: undefined,
        teamBPlayerIds: undefined,
        teamAGoalkeeperId: null,
        teamBGoalkeeperId: null,
      });

      if (result.validationErrors) {
        // Invalid input data
        return;
      }

      if (result.serverError) {
        if (result.serverError.includes("Authentication required")) {
          // Authentication required
        } else {
          // Server error occurred
        }
        return;
      }

      if (result.data) {
        // Clear any current game context and show matches list
        gameState.setCurrentGameContext(null);
        gameState.setShowMatchesList(true);
        gameState.setUserRequestedMatchesList(true);
        // Invalidate and refetch all game-related queries
        queryClient.invalidateQueries({ queryKey: ["allGames"] });
        queryClient.invalidateQueries({ queryKey: ["activeGame"] });
        queryClient.refetchQueries({ queryKey: ["allGames"] });
        queryClient.refetchQueries({ queryKey: ["activeGame"] });
      }
    } catch (error) {
      // Game creation failed
    } finally {
      gameState.setIsCreatingGame(false);
    }
  };

  // Fill match from attendees
  const handleFillFromAttendees = async () => {
    if (!ensureCorrectMatch("Fill from attendees")) return;
    if (!requireAuth("Fill from attendees")) return;

    try {
      const matchId = gameState.currentGameContext!.matchId;

      // Set loading state instead of showing progress snackbar
      gameState.setIsFillFromAttendeesLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fill_game_from_attendees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization":
              `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            matchId,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Refresh game data with correct query keys
        queryClient.invalidateQueries({ queryKey: ["activeGame"] });
        queryClient.invalidateQueries({ queryKey: ["allGames"] });
        queryClient.invalidateQueries({ queryKey: ["availablePlayers"] });

        // Refresh current game context to update UI immediately
        await refreshCurrentGameContext();

        // Brief delay to ensure UI has updated before clearing loading state
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        // Fill from attendees failed with validation errors
      }
    } catch (error) {
      console.error("Fill from attendees error:", error);
      // Fill from Bokat.se failed
    } finally {
      // Always clear loading state
      gameState.setIsFillFromAttendeesLoading(false);
    }
  };

  // Randomize teams
  const handleRandomizeTeams = async () => {
    if (!ensureCorrectMatch("Randomize teams")) return;
    if (!requireAuth("Randomize teams")) return;

    try {
      const matchId = gameState.currentGameContext!.matchId;

      // Set loading state instead of showing progress snackbar
      gameState.setIsRandomizeTeamsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/randomize_teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization":
              `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            matchId,
            mode: "random",
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Refresh game data with correct query keys
        queryClient.invalidateQueries({ queryKey: ["activeGame"] });
        queryClient.invalidateQueries({ queryKey: ["allGames"] });

        // Refresh current game context to update UI immediately
        await refreshCurrentGameContext();

        // Brief delay to ensure UI has updated before clearing loading state
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        // Fill from attendees failed with validation errors
      }
    } catch (error) {
      console.error("Randomize teams error:", error);
      // Team randomization failed
    } finally {
      // Always clear loading state
      gameState.setIsRandomizeTeamsLoading(false);
    }
  };

  // Get available players for selection
  const availablePlayersForSelection = gameState.currentGameContext
    ? (gameState.currentGameContext.type === "planned" &&
        showPlayerSelect.isMultiSelect)
      ? gameState.availablePlayers // For planned games with multi-selection, show all players
      : getAvailablePlayersForSelection(
        gameState.availablePlayers,
        gameState.currentGameContext.gameData.teamA,
        gameState.currentGameContext.gameData.teamB,
        gameState.currentGameContext.gameData.goalkeepers,
      )
    : gameState.availablePlayers;

  return {
    // Dialog states
    showPlayerSelect,
    goalDialog,

    // Actions
    handleScoreIncrement,
    handleGoalDialogPlayerClick,
    handleGoalDialogSubmit,
    handleGoalDialogCancel,
    removeSelectedPlayer,
    handlePauseToggle,
    handleEndMatch,
    handleEndMatchAndCreateNew,
    handleDeleteGame,
    handleResetGame,
    handleSwapSides,
    handleVestToggle,
    handleAddPlayer,
    handlePlayerSelect,
    handleMultiPlayerSelect,
    handleClosePlayerSelect,
    handleSelectPlannedGame,
    handleStartPlannedGame,
    handleBackToMatchesList,
    handleSelectGame,
    handleCreateNewGame,
    handleSwitchPlayerTeam,
    handleRemovePlayer,
    handleSwapGoalkeepers,
    handleSwapFieldPlayers,

    // New actions
    handleFillFromAttendees,
    handleRandomizeTeams,

    // Helper functions
    updateTeamState,
    updateTeamStateAndGoalkeeper,
    ensureCorrectMatch,

    // Computed values
    availablePlayersForSelection,

    // Authentication status
    isAuthenticated,

    // State
    isPauseToggleBusy,
    isFillFromAttendeesLoading: gameState.isFillFromAttendeesLoading,
    isRandomizeTeamsLoading: gameState.isRandomizeTeamsLoading,
  };
}
