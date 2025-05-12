"use client";

import { Button } from "@/components/ui/button";
import { BattleMove, PokemonStats } from "@/lib/types";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface MatchArenaProps {
  player1Team: PokemonStats[];
  player2Team: PokemonStats[];
  player1Name: string;
  player2Name: string;
  onMatchEnd: (result: "player1Won" | "player2Won" | "draw") => void;
}

interface TeamMemberState {
  stats: PokemonStats;
  currentHP: number;
  fainted: boolean;
}

interface StatusEffect {
  type: "burn" | "poison" | "paralyze" | "sleep" | "freeze";
  duration: number;
  damagePerTurn?: number;
  skipTurnChance?: number;
}

interface BattleState {
  player1Pokemon: TeamMemberState;
  player2Pokemon: TeamMemberState;
  player1Team: TeamMemberState[];
  player2Team: TeamMemberState[];
  currentPlayer: "player1" | "player2";
  latestLog: string;
  battleStatus: "ongoing" | "player1Won" | "player2Won" | "draw";
  player1Status?: StatusEffect;
  player2Status?: StatusEffect;
}

interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
}

// Add type for Pokemon types
type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

// Update type effectiveness mapping
const TYPE_EFFECTIVENESS: Record<
  PokemonType,
  {
    weak: PokemonType[];
    resistant: PokemonType[];
    immune: PokemonType[];
  }
> = {
  normal: {
    weak: ["fighting"],
    resistant: ["ghost"],
    immune: [],
  },
  fire: {
    weak: ["water", "ground", "rock"],
    resistant: ["fire", "grass", "ice", "bug", "steel", "fairy"],
    immune: [],
  },
  water: {
    weak: ["electric", "grass"],
    resistant: ["fire", "water", "ice", "steel"],
    immune: [],
  },
  electric: {
    weak: ["ground"],
    resistant: ["electric", "flying", "steel"],
    immune: [],
  },
  grass: {
    weak: ["fire", "ice", "poison", "flying", "bug"],
    resistant: ["water", "electric", "grass", "ground"],
    immune: [],
  },
  ice: {
    weak: ["fire", "fighting", "rock", "steel"],
    resistant: ["ice"],
    immune: [],
  },
  fighting: {
    weak: ["flying", "psychic", "fairy"],
    resistant: ["bug", "rock", "dark"],
    immune: [],
  },
  poison: {
    weak: ["ground", "psychic"],
    resistant: ["grass", "fighting", "poison", "bug", "fairy"],
    immune: [],
  },
  ground: {
    weak: ["water", "grass", "ice"],
    resistant: ["poison", "rock"],
    immune: ["electric"],
  },
  flying: {
    weak: ["electric", "ice", "rock"],
    resistant: ["grass", "fighting", "bug"],
    immune: ["ground"],
  },
  psychic: {
    weak: ["bug", "ghost", "dark"],
    resistant: ["fighting", "psychic"],
    immune: [],
  },
  bug: {
    weak: ["fire", "flying", "rock"],
    resistant: ["grass", "fighting", "ground"],
    immune: [],
  },
  rock: {
    weak: ["water", "grass", "fighting", "ground", "steel"],
    resistant: ["normal", "fire", "poison", "flying"],
    immune: [],
  },
  ghost: {
    weak: ["ghost", "dark"],
    resistant: ["poison", "bug"],
    immune: ["normal", "fighting"],
  },
  dragon: {
    weak: ["ice", "dragon", "fairy"],
    resistant: ["fire", "water", "electric", "grass"],
    immune: [],
  },
  dark: {
    weak: ["fighting", "bug", "fairy"],
    resistant: ["ghost", "dark"],
    immune: ["psychic"],
  },
  steel: {
    weak: ["fire", "fighting", "ground"],
    resistant: [
      "normal",
      "grass",
      "ice",
      "flying",
      "psychic",
      "bug",
      "rock",
      "dragon",
      "steel",
      "fairy",
    ],
    immune: ["poison"],
  },
  fairy: {
    weak: ["poison", "steel"],
    resistant: ["fighting", "bug", "dark"],
    immune: ["dragon"],
  },
};

// Add move type to status effect mapping
const MOVE_STATUS_EFFECTS: Record<
  string,
  {
    type: "burn" | "poison" | "paralyze" | "sleep" | "freeze";
    chance: number;
  }
> = {
  fire: { type: "burn", chance: 0.3 },
  poison: { type: "poison", chance: 0.4 },
  electric: { type: "paralyze", chance: 0.3 },
  psychic: { type: "sleep", chance: 0.25 },
  ice: { type: "freeze", chance: 0.2 },
};

// Add type immunity to status effects
const STATUS_IMMUNITIES: Record<string, string[]> = {
  burn: ["fire", "water"],
  poison: ["poison", "steel"],
  paralyze: ["electric", "ground"],
  freeze: ["ice", "fire"],
  sleep: ["psychic", "dark"],
};

// Function to check if a Pokémon can be affected by a status
function canBeAffectedByStatus(
  pokemon: PokemonStats,
  statusType: string
): boolean {
  const pokemonTypes = pokemon.currentForm.types.map((t) => t.toLowerCase());
  const immuneTypes = STATUS_IMMUNITIES[statusType] || [];
  return !pokemonTypes.some((type) => immuneTypes.includes(type));
}

// Function to determine status effect based on move type
function determineStatusEffect(
  moveType: string,
  targetPokemon: PokemonStats
): StatusEffect | null {
  const statusEffect = MOVE_STATUS_EFFECTS[moveType.toLowerCase()];

  if (!statusEffect) return null;

  // Check if the Pokémon can be affected by this status
  if (!canBeAffectedByStatus(targetPokemon, statusEffect.type)) {
    return null;
  }

  // Apply chance check
  if (Math.random() < statusEffect.chance) {
    return {
      type: statusEffect.type,
      duration: 3,
      damagePerTurn:
        statusEffect.type === "burn"
          ? 10
          : statusEffect.type === "poison"
            ? 8
            : undefined,
      skipTurnChance: statusEffect.type === "paralyze" ? 0.25 : undefined,
    };
  }

  return null;
}

// Update status effect animations with keyframes
const STATUS_ANIMATIONS: Record<string, Variants> = {
  burn: {
    animate: {
      opacity: [0, 1, 0],
      backgroundColor: "rgba(255,0,0,0.2)",
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  poison: {
    animate: {
      opacity: [0, 1, 0],
      backgroundColor: "rgba(128,0,128,0.2)",
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  paralyze: {
    animate: {
      opacity: [0, 1, 0],
      backgroundColor: "rgba(255,255,0,0.2)",
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  sleep: {
    animate: {
      opacity: 0.5,
      scale: 0.95,
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  },
  freeze: {
    animate: {
      opacity: [0.5, 1, 0.5],
      filter: "brightness(1.5)",
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};

// Add status effect emojis
const STATUS_EMOJIS = {
  burn: "🔥",
  poison: "☠️",
  paralyze: "⚡",
  sleep: "💤",
  freeze: "❄️",
};

// Type-based animation effects (reused from BattleArena)
const TYPE_ANIMATIONS: Record<string, any> = {
  normal: {
    emoji: "💫",
    animation: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        scale: [1, 1.2, 1],
        rotate: [0, 360, 0],
        transition: { duration: 0.5 },
      },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fire: {
    emoji: "🔥",
    animation: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        scale: [1, 1.5, 1],
        y: [0, -20, 0],
        filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
        transition: { duration: 0.5 },
      },
      exit: { opacity: 0, scale: 0 },
    },
  },
  water: {
    emoji: "💧",
    animation: {
      animate: {
        y: [0, -30, 0],
        scale: [1, 1.2, 1],
        rotate: [0, 45, -45, 0],
        transition: { duration: 0.7 },
      },
    },
  },
  electric: {
    emoji: "⚡",
    animation: {
      animate: {
        x: [-10, 10, -10, 10, 0],
        opacity: [0, 1, 0, 1, 0],
        scale: [0.8, 1.2, 0.8, 1.2, 1],
        transition: { duration: 0.3, times: [0, 0.25, 0.5, 0.75, 1] },
      },
    },
  },
  grass: {
    emoji: "🌿",
    animation: {
      animate: {
        scale: [1, 1.3, 1],
        rotate: [0, 15, -15, 0],
        y: [0, -10, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      },
    },
  },
  ice: {
    emoji: "❄️",
    animation: {
      animate: {
        scale: [1, 0.8, 1],
        opacity: [1, 0.7, 1],
        filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
        transition: { duration: 0.5 },
      },
    },
  },
  fighting: {
    emoji: "👊",
    animation: {
      animate: {
        x: [0, -20, 20, 0],
        y: [0, -10, 10, 0],
        scale: [1, 1.2, 1.2, 1],
        transition: { duration: 0.3, ease: "easeOut" },
      },
    },
  },
  poison: {
    emoji: "☠️",
    animation: {
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, 10, -10, 5, 0],
        filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
        transition: { duration: 0.6 },
      },
    },
  },
  ground: {
    emoji: "🌋",
    animation: {
      animate: {
        y: [0, 10, -10, 5, 0],
        scale: [1, 1.1, 0.9, 1.05, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
      },
    },
  },
  flying: {
    emoji: "🌪️",
    animation: {
      animate: {
        y: [0, -30, -15, -30, 0],
        rotate: [0, 360, 720],
        transition: { duration: 0.7 },
      },
    },
  },
  psychic: {
    emoji: "🔮",
    animation: {
      animate: {
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"],
        transition: { duration: 0.8 },
      },
    },
  },
  bug: {
    emoji: "🐛",
    animation: {
      animate: {
        x: [0, 10, -10, 10, 0],
        y: [0, -5, 5, -5, 0],
        transition: { duration: 0.4, ease: "linear" },
      },
    },
  },
  rock: {
    emoji: "🪨",
    animation: {
      animate: {
        scale: [1, 1.4, 1],
        rotate: [0, 45, 0],
        transition: { duration: 0.4, ease: "backOut" },
      },
    },
  },
  ghost: {
    emoji: "👻",
    animation: {
      animate: {
        opacity: [1, 0.3, 1],
        scale: [1, 1.2, 1],
        y: [0, -10, 0],
        filter: ["blur(0px)", "blur(4px)", "blur(0px)"],
        transition: { duration: 0.6 },
      },
    },
  },
  dragon: {
    emoji: "🐲",
    animation: {
      animate: {
        scale: [1, 1.5, 1],
        rotate: [0, 20, -20, 0],
        filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
        transition: { duration: 0.5 },
      },
    },
  },
  dark: {
    emoji: "🌑",
    animation: {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.2, 1],
        filter: ["brightness(1)", "brightness(0.5)", "brightness(1)"],
        transition: { duration: 0.6 },
      },
    },
  },
  steel: {
    emoji: "⚔️",
    animation: {
      animate: {
        scale: [1, 1.2, 1],
        rotate: [0, 180, 0],
        filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
        transition: { duration: 0.4 },
      },
    },
  },
  fairy: {
    emoji: "✨",
    animation: {
      animate: {
        scale: [1, 1.3, 0.8, 1.2, 1],
        rotate: [0, 45, -45, 20, 0],
        opacity: [1, 0.7, 1, 0.7, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"],
        transition: { duration: 0.7 },
      },
    },
  },
};

// Update type effectiveness calculation
function calculateMoveEffectiveness(
  moveType: PokemonType,
  defenderTypes: PokemonType[]
): number {
  let effectiveness = 1;

  for (const defenderType of defenderTypes) {
    const typeInfo = TYPE_EFFECTIVENESS[defenderType];
    if (!typeInfo) continue;

    if (typeInfo.immune.includes(moveType)) {
      return 0;
    }
    if (typeInfo.weak.includes(moveType)) {
      effectiveness *= 2;
    }
    if (typeInfo.resistant.includes(moveType)) {
      effectiveness *= 0.5;
    }
  }

  return effectiveness;
}

export function MatchArena({
  player1Team: initialPlayer1Team,
  player2Team: initialPlayer2Team,
  player1Name,
  player2Name,
  onMatchEnd,
}: MatchArenaProps) {
  const initialPlayer1TeamState = initialPlayer1Team.map((pokemon) => ({
    stats: pokemon,
    currentHP: calculateMaxHP(pokemon.currentForm.baseStats.hp),
    fainted: false,
  }));

  const initialPlayer2TeamState = initialPlayer2Team.map((pokemon) => ({
    stats: pokemon,
    currentHP: calculateMaxHP(pokemon.currentForm.baseStats.hp),
    fainted: false,
  }));

  const [battleState, setBattleState] = useState<BattleState>({
    player1Pokemon: initialPlayer1TeamState[0],
    player2Pokemon: initialPlayer2TeamState[0],
    player1Team: initialPlayer1TeamState,
    player2Team: initialPlayer2TeamState,
    currentPlayer: "player1",
    latestLog: `Match started between ${player1Name} and ${player2Name}!`,
    battleStatus: "ongoing",
    player1Status: undefined,
    player2Status: undefined,
  });

  const [attackAnimation, setAttackAnimation] = useState<{
    isAnimating: boolean;
    attacker: "player1" | "player2";
    type?: string;
  }>({ isAnimating: false, attacker: "player1" });

  useEffect(() => {
    if (battleState.battleStatus !== "ongoing") {
      onMatchEnd(battleState.battleStatus);
    }
  }, [battleState.battleStatus, onMatchEnd]);

  function calculateMaxHP(baseHP: number): number {
    return Math.floor((2 * baseHP * 50) / 100 + 50 + 10);
  }

  function calculateDamage(
    move: BattleMove,
    attacker: PokemonStats,
    defender: PokemonStats,
    attackerStatus?: StatusEffect,
    defenderStatus?: StatusEffect
  ): DamageResult {
    const power = move.power;
    let attack =
      move.category === "physical"
        ? attacker.currentForm.baseStats.attack
        : attacker.currentForm.baseStats.specialAttack;
    let defense =
      move.category === "physical"
        ? defender.currentForm.baseStats.defense
        : defender.currentForm.baseStats.specialDefense;

    // Status effect modifiers
    if (attackerStatus) {
      if (attackerStatus.type === "burn" && move.category === "physical") {
        attack = Math.floor(attack * 0.5); // Burn halves physical attack
      }
    }

    // Calculate base damage
    let damage = Math.floor(
      ((2 * 50) / 5 + 2) * power * attack / defense / 50 + 2
    );

    // Calculate type effectiveness
    const moveType = move.type.toLowerCase() as PokemonType;
    const defenderTypes = defender.currentForm.types.map(
      (t) => t.toLowerCase() as PokemonType
    );
    const effectiveness = calculateMoveEffectiveness(moveType, defenderTypes);

    // Apply effectiveness multiplier
    damage = Math.floor(damage * effectiveness);

    // Critical hit chance (6.25%)
    const isCritical = Math.random() < 0.0625;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }

    // Random factor (85-100%)
    const randomFactor = 0.85 + Math.random() * 0.15;
    damage = Math.floor(damage * randomFactor);

    return {
      damage: Math.max(1, damage),
      effectiveness,
      isCritical,
    };
  }

  const checkTeamWipeout = (teamState: TeamMemberState[]): boolean => {
    return teamState.every((member) => member.fainted);
  };

  const findNextAvailablePokemon = (
    teamState: TeamMemberState[]
  ): TeamMemberState | null => {
    return teamState.find((member) => !member.fainted) || null;
  };

  const handleSwap = (
    newPokemon: TeamMemberState,
    player: "player1" | "player2"
  ) => {
    if (attackAnimation.isAnimating || battleState.battleStatus !== "ongoing")
      return;

    if (player === "player1" && battleState.currentPlayer !== "player1") return;
    if (player === "player2" && battleState.currentPlayer !== "player2") return;

    if (newPokemon.fainted) {
      toast.error(`${newPokemon.stats.currentForm.name} has fainted!`);
      return;
    }

    setBattleState((prev) => {
      const updatedPlayer = player === "player1" ? "player1Pokemon" : "player2Pokemon";
      const updatedTeam = player === "player1" ? "player1Team" : "player2Team";

      const newTeamState = prev[updatedTeam].map((member) =>
        member.stats === newPokemon.stats ? newPokemon : member
      );

      return {
        ...prev,
        [updatedPlayer]: newPokemon,
        [updatedTeam]: newTeamState,
        latestLog: `${player === "player1" ? player1Name : player2Name} sends out ${newPokemon.stats.currentForm.name}!`,
        currentPlayer: player === "player1" ? "player2" : "player1", // Switch turns after swapping
      };
    });
  };

  async function handleMove(moveName: string) {
    if (attackAnimation.isAnimating || battleState.battleStatus !== "ongoing")
      return;

    const currentPlayer = battleState.currentPlayer;
    const attackerPokemon =
      currentPlayer === "player1"
        ? battleState.player1Pokemon
        : battleState.player2Pokemon;
    const defenderPokemon =
      currentPlayer === "player1"
        ? battleState.player2Pokemon
        : battleState.player1Pokemon;
    const attackerName = currentPlayer === "player1" ? player1Name : player2Name;
    const defenderName = currentPlayer === "player1" ? player2Name : player1Name;

    // Check for status effects that prevent movement
    const attackerStatus =
      currentPlayer === "player1"
        ? battleState.player1Status
        : battleState.player2Status;
    if (attackerStatus) {
      if (attackerStatus.type === "sleep" || attackerStatus.type === "freeze") {
        setBattleState((prev) => ({
          ...prev,
          latestLog: `${attackerPokemon.stats.currentForm.name} is ${attackerStatus.type}ing!`,
          currentPlayer: currentPlayer === "player1" ? "player2" : "player1", // Switch turns
        }));
        return;
      }
      if (attackerStatus.type === "paralyze" && Math.random() < 0.25) {
        setBattleState((prev) => ({
          ...prev,
          latestLog: `${attackerPokemon.stats.currentForm.name} is paralyzed and can't move!`,
          currentPlayer: currentPlayer === "player1" ? "player2" : "player1", // Switch turns
        }));
        return;
      }
    }

    const moveType = attackerPokemon.stats.currentForm.types[0];
    const move: BattleMove = {
      name: moveName,
      power: 50,
      accuracy: 95,
      type: moveType,
      category: "physical",
    };

    setAttackAnimation({
      isAnimating: true,
      attacker: currentPlayer,
      type: moveType.toLowerCase(),
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const defenderStatus =
      currentPlayer === "player1"
        ? battleState.player2Status
        : battleState.player1Status;

    const { damage, effectiveness, isCritical } = calculateDamage(
      move,
      attackerPokemon.stats,
      defenderPokemon.stats,
      attackerStatus,
      defenderStatus
    );

    // Generate battle message based on effectiveness and critical hit
    let battleMessage = `${attackerName}'s ${attackerPokemon.stats.currentForm.name} used ${moveName}!`;
    if (isCritical) battleMessage += " A critical hit!";
    if (effectiveness > 1) battleMessage += " It's super effective!";
    else if (effectiveness < 1 && effectiveness > 0)
      battleMessage += " It's not very effective...";
    else if (effectiveness === 0) battleMessage += " It had no effect...";

    // Check for status effect based on move type
    const newStatus = determineStatusEffect(moveType, defenderPokemon.stats);
    if (newStatus) {
      const targetStatus =
        currentPlayer === "player1"
          ? battleState.player2Status
          : battleState.player1Status;
      if (!targetStatus) {
        battleMessage += ` ${defenderPokemon.stats.currentForm.name} was ${newStatus.type}ed!`;
      }
    }

    setBattleState((prev) => {
      let newDefenderHP:any;
      let nextPlayerStatus = prev.player1Status;
      let nextWildStatus = prev.player2Status;

      if (currentPlayer === "player1") {
        newDefenderHP = Math.max(0, prev.player2Pokemon.currentHP - damage);
        if (newStatus && !prev.player2Status) {
          nextWildStatus = newStatus;
        }
        const updatedPlayer2Team = prev.player2Team.map((member) =>
          member.stats === prev.player2Pokemon.stats
            ? { ...member, currentHP: newDefenderHP, fainted: newDefenderHP <= 0 }
            : member
        );
        return {
          ...prev,
          player2Pokemon: {
            ...prev.player2Pokemon,
            currentHP: newDefenderHP,
            fainted: newDefenderHP <= 0,
          },
          player2Team: updatedPlayer2Team,
          player2Status: nextWildStatus,
          currentPlayer: "player2",
          latestLog: battleMessage,
        };
      } else {
        newDefenderHP = Math.max(0, prev.player1Pokemon.currentHP - damage);
        if (newStatus && !prev.player1Status) {
          nextPlayerStatus = newStatus;
        }
        const updatedPlayer1Team = prev.player1Team.map((member) =>
          member.stats === prev.player1Pokemon.stats
            ? { ...member, currentHP: newDefenderHP, fainted: newDefenderHP <= 0 }
            : member
        );
        return {
          ...prev,
          player1Pokemon: {
            ...prev.player1Pokemon,
            currentHP: newDefenderHP,
            fainted: newDefenderHP <= 0,
          },
          player1Team: updatedPlayer1Team,
          player1Status: nextPlayerStatus,
          currentPlayer: "player1",
          latestLog: battleMessage,
        };
      }
    });

    setAttackAnimation({ isAnimating: false, attacker: currentPlayer });
  }

  // Check for fainted Pokemon and swap if necessary
  useEffect(() => {
    setBattleState((prev) => {
      let updatedState = { ...prev };
      let actionNeeded = false;

      // Check player 1's Pokemon
      if (updatedState.player1Pokemon.fainted) {
        const nextPokemon = findNextAvailablePokemon(updatedState.player1Team);
        if (nextPokemon) {
          updatedState.player1Pokemon = nextPokemon;
          updatedState.latestLog = `${player1Name}'s ${prev.player1Pokemon.stats.currentForm.name} fainted! ${player1Name} sends out ${nextPokemon.stats.currentForm.name}!`;
          actionNeeded = true;
        } else {
          updatedState.battleStatus = "player2Won";
          updatedState.latestLog = `${player1Name}'s team was defeated! ${player2Name} wins!`;
          actionNeeded = true;
        }
      }

      // Check player 2's Pokemon
      if (updatedState.player2Pokemon.fainted) {
        const nextPokemon = findNextAvailablePokemon(updatedState.player2Team);
        if (nextPokemon) {
          updatedState.player2Pokemon = nextPokemon;
          updatedState.latestLog = `${player2Name}'s ${prev.player2Pokemon.stats.currentForm.name} fainted! ${player2Name} sends out ${nextPokemon.stats.currentForm.name}!`;
          actionNeeded = true;
        } else {
          updatedState.battleStatus = "player1Won";
          updatedState.latestLog = `${player2Name}'s team was defeated! ${player1Name} wins!`;
          actionNeeded = true;
        }
      }

      // If no swaps are needed and a team is wiped out, determine winner
      if (!actionNeeded && updatedState.battleStatus === "ongoing") {
        if (checkTeamWipeout(updatedState.player1Team)) {
          updatedState.battleStatus = "player2Won";
          updatedState.latestLog = `${player1Name}'s team was defeated! ${player2Name} wins!`;
        } else if (checkTeamWipeout(updatedState.player2Team)) {
          updatedState.battleStatus = "player1Won";
          updatedState.latestLog = `${player2Name}'s team was defeated! ${player1Name} wins!`;
        }
      }

      return updatedState;
    });
  }, [battleState.player1Pokemon.fainted, battleState.player2Pokemon.fainted]);

  // Handle status effects at the start of a turn
  useEffect(() => {
    if (battleState.battleStatus !== "ongoing" || attackAnimation.isAnimating)
      return;

    const currentPlayer = battleState.currentPlayer;
    const currentPokemonState =
      currentPlayer === "player1"
        ? battleState.player1Pokemon
        : battleState.player2Pokemon;
    const currentStatus =
      currentPlayer === "player1"
        ? battleState.player1Status
        : battleState.player2Status;

    if (currentStatus) {
      let statusMessage = `${currentPokemonState.stats.currentForm.name} is ${currentStatus.type}!`;
      let skipTurn = false;
      let statusDamage = 0;
      let newStatus: StatusEffect | undefined = currentStatus;

      // Apply status effects
      if (currentStatus.type === "burn" || currentStatus.type === "poison") {
        statusDamage = currentStatus.damagePerTurn || 0;
        statusMessage += ` It took ${statusDamage} damage!`;
      } else if (currentStatus.type === "paralyze") {
        if (Math.random() < (currentStatus.skipTurnChance || 0)) {
          statusMessage += ` It couldn't move!`;
          skipTurn = true;
        }
      } else if (currentStatus.type === "sleep" || currentStatus.type === "freeze") {
        statusMessage += ` It's immobilized!`;
        skipTurn = true;
      }

      // Decrease status duration
      if (newStatus && newStatus.duration > 0) {
        newStatus = { ...newStatus, duration: newStatus.duration - 1 };
        if (newStatus.duration === 0) {
          statusMessage += ` ${currentPokemonState.stats.currentForm.name} recovered from ${currentStatus.type}!`;
          newStatus = undefined;
        }
      }

      const newHP = Math.max(0, currentPokemonState.currentHP - statusDamage);

      setBattleState((prev) => {
        const updatedPokemonState = {
          ...currentPokemonState,
          currentHP: newHP,
          fainted: newHP <= 0,
        };

        return {
          ...prev,
          player1Pokemon:
            currentPlayer === "player1" ? updatedPokemonState : prev.player1Pokemon,
          player2Pokemon:
            currentPlayer === "player2" ? updatedPokemonState : prev.player2Pokemon,
          player1Status: currentPlayer === "player1" ? newStatus : prev.player1Status,
          player2Status: currentPlayer === "player2" ? newStatus : prev.player2Status,
          latestLog: statusMessage,
          currentPlayer: skipTurn
            ? currentPlayer // Stay on current player's turn if turn is skipped
            : currentPlayer === "player1"
              ? "player2"
              : "player1", // Switch turns if turn was not skipped
        };
      });
    }
  }, [battleState.currentPlayer, battleState.battleStatus, battleState.player1Status, battleState.player2Status, attackAnimation.isAnimating
  ]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 p-4 font-mono text-white flex flex-col">
      {/* Exit Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => onMatchEnd("draw")}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Player 2 Move Selection (Rotated) */}
      <div className={`grid grid-cols-2 gap-2 rotate-180 ${battleState.currentPlayer === 'player2' && battleState.battleStatus === 'ongoing' ? 'visible' : 'invisible'}`}>
        {battleState.player2Pokemon.stats.currentForm.moves.map((move) => (
          <Button
            key={move}
            onClick={() => handleMove(move)}
            disabled={attackAnimation.isAnimating || battleState.currentPlayer !== 'player2' || battleState.player2Pokemon.fainted || !!battleState.player2Status?.type && (battleState.player2Status.type === 'sleep' || battleState.player2Status.type === 'freeze' || (battleState.player2Status.type === 'paralyze' && Math.random() < (battleState.player2Status.skipTurnChance || 0)))}
            className="font-bold py-2 px-4 rounded text-black bg-gray-200 hover:bg-gray-300"
          >
            {move}
          </Button>
        ))}
      </div>


      {/* Player 2 Team Selection (Rotated) */}
      <div className="bg-gray-800 rounded-lg p-2 overflow-x-auto rotate-180">
        <div className="flex gap-2">
          {battleState.player2Team.map((pokemon, index) => (
            <button
              key={index}
              onClick={() => handleSwap(pokemon, 'player2')}
              disabled={attackAnimation.isAnimating || battleState.currentPlayer !== 'player2' || pokemon.fainted}
              className={`
                relative flex flex-col items-center p-2 rounded-lg min-w-[80px]
                ${pokemon === battleState.player2Pokemon
                  ? 'bg-blue-600 border-2 border-blue-400'
                  : pokemon.fainted
                    ? 'bg-gray-800 opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600'}
                ${!attackAnimation.isAnimating && battleState.currentPlayer === 'player2' && !pokemon.fainted
                  ? 'cursor-pointer transform hover:scale-105 transition-transform'
                  : 'opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-600">
                <img
                  src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${pokemon.stats.image_path}`}
                  alt={pokemon.stats.currentForm.name}
                  className={`w-full h-full object-cover ${pokemon.fainted ? 'grayscale' : ''}`}
                />
              </div>
              <span className="text-sm font-bold mt-1 text-white">
                {pokemon.stats.currentForm.name}
                {pokemon.fainted && ' (Fainted)'}
              </span>
              <div className="w-full bg-gray-900 h-2 rounded-full mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pokemon.fainted ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${(pokemon.currentHP / calculateMaxHP(pokemon.stats.currentForm.baseStats.hp)) * 100}%`,
                  }}
                />
              </div>
              {pokemon === battleState.player2Pokemon && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Battle Arena */}
      <div className={`w-full h-[55vh] flex-grow bg-gradient-to-b ${battleState.currentPlayer === 'player1' ? 'from-blue-950 to-blue-900' : 'from-red-900 to-red-950'} rounded-lg border-4 border-gray-600 overflow-hidden flex flex-col justify-between p-4 relative`}>
        {/* Player 2 Pokemon Section */}
        <div className="flex justify-end items-start gap-4">
          {/* Stats Card */}
          <div className="bg-white/10 w-full rounded-lg backdrop-blur-sm p-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">
                {battleState.player2Pokemon.stats.currentForm.name}
              </div>
              <div className="text-xs bg-blue-500 px-1.5 rounded">
                Lv.{battleState.player2Pokemon.stats.currentForm.level}
              </div>
              {battleState.player2Status && (
                <div
                  className="text-lg"
                  title={battleState.player2Status.type}
                >
                  {STATUS_EMOJIS[battleState.player2Status.type]}
                </div>
              )}
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <motion.div
                className="h-full bg-green-500 rounded"
                initial={{ width: "100%" }}
                animate={{
                  width: `${(battleState.player2Pokemon.currentHP / calculateMaxHP(battleState.player2Pokemon.stats.currentForm.baseStats.hp)) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-xs mt-1">
              {battleState.player2Pokemon.currentHP} /{" "}
              {calculateMaxHP(battleState.player2Pokemon.stats.currentForm.baseStats.hp)}
            </div>
          </div>

          {/* Pokemon Image */}
          <motion.div
            className="relative w-48 h-48"
            animate={{
              x:
                attackAnimation.isAnimating &&
                battleState.currentPlayer === "player1" &&
                attackAnimation.attacker === "player1"
                  ? [0, -10, 10, -10, 0]
                  : 0,
              opacity: battleState.player2Pokemon.fainted ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${battleState.player2Pokemon.stats.image_path}`}
                alt={battleState.player2Pokemon.stats.currentForm.name}
                className={`w-full h-full rounded-3xl object-cover border-yellow-300 ${
                  battleState.currentPlayer === "player2"
                    ? "border-2 rotate-180"
                    : ""
                }`}
              />
            </div>
            {battleState.player2Status && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                variants={STATUS_ANIMATIONS[battleState.player2Status.type]}
                animate="animate"
              />
            )}
          </motion.div>
        </div>

        {/* Battle Log */}
        <AnimatePresence mode="wait">
          <motion.div
            key={battleState.latestLog}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="self-center bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-md font-bold text-center min-w-[300px]"
          >
            {battleState.latestLog}
          </motion.div>
        </AnimatePresence>

        {/* Player 1 Pokemon Section */}
        <div className="flex justify-start items-start gap-4">
          {/* Pokemon Image */}
          <motion.div
            className="relative w-48 h-48"
            animate={{
              x:
                attackAnimation.isAnimating &&
                battleState.currentPlayer === "player2" &&
                attackAnimation.attacker === "player2"
                  ? [0, -10, 10, -10, 0]
                  : 0,
              opacity: battleState.player1Pokemon.fainted ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${battleState.player1Pokemon.stats.image_path}`}
                alt={battleState.player1Pokemon.stats.currentForm.name}
                className={`w-full h-full rounded-3xl object-cover border-yellow-300 ${
                  battleState.currentPlayer === "player1" ? "border-2" : "rotate-180"
                }`}
              />
            </div>
            {battleState.player1Status && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                variants={STATUS_ANIMATIONS[battleState.player1Status.type]}
                animate="animate"
              />
            )}
          </motion.div>

          {/* Stats Card */}
          <div className="bg-white/10 w-full rounded-lg backdrop-blur-sm p-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">
                {battleState.player1Pokemon.stats.currentForm.name}
              </div>
              <div className="text-xs bg-blue-500 px-1.5 rounded">
                Lv.{battleState.player1Pokemon.stats.currentForm.level}
              </div>
              {battleState.player1Status && (
                <div
                  className="text-lg"
                  title={battleState.player1Status.type}
                >
                  {STATUS_EMOJIS[battleState.player1Status.type]}
                </div>
              )}
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <motion.div
                className="h-full bg-green-500 rounded"
                initial={{ width: "100%" }}
                animate={{
                  width: `${(battleState.player1Pokemon.currentHP / calculateMaxHP(battleState.player1Pokemon.stats.currentForm.baseStats.hp)) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-xs mt-1">
              {battleState.player1Pokemon.currentHP} /{" "}
              {calculateMaxHP(battleState.player1Pokemon.stats.currentForm.baseStats.hp)}
            </div>
          </div>
        </div>
      </div>

      {/* Player 1 Team Selection */}
      <div className="bg-gray-800 rounded-lg p-2 overflow-x-auto">
        <div className="flex gap-2">
          {battleState.player1Team.map((pokemon, index) => (
            <button
              key={index}
              onClick={() => handleSwap(pokemon, 'player1')}
              disabled={attackAnimation.isAnimating || battleState.currentPlayer !== 'player1' || pokemon.fainted}
              className={`
                relative flex flex-col items-center p-2 rounded-lg min-w-[80px]
                ${pokemon === battleState.player1Pokemon
                  ? 'bg-blue-600 border-2 border-blue-400'
                  : pokemon.fainted
                    ? 'bg-gray-800 opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600'}
                  ${!attackAnimation.isAnimating && battleState.currentPlayer === 'player1' && !pokemon.fainted
                  ? 'cursor-pointer transform hover:scale-105 transition-transform'
                  : 'opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-600">
                <img
                  src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${pokemon.stats.image_path}`}
                  alt={pokemon.stats.currentForm.name}
                  className={`w-full h-full object-cover ${pokemon.fainted ? 'grayscale' : ''}`}
                />
              </div>
              <span className="text-sm font-bold mt-1 text-white">
                {pokemon.stats.currentForm.name}
                {pokemon.fainted && ' (Fainted)'}
              </span>
              <div className="w-full bg-gray-900 h-2 rounded-full mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pokemon.fainted ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${(pokemon.currentHP / calculateMaxHP(pokemon.stats.currentForm.baseStats.hp)) * 100}%`,
                  }}
                />
              </div>
              {pokemon === battleState.player1Pokemon && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Player 1 Move Selection */}
      <div className={`grid grid-cols-2 gap-2 ${battleState.currentPlayer === 'player1' && battleState.battleStatus === 'ongoing' ? 'visible' : 'invisible'}`}>
        {battleState.player1Pokemon.stats.currentForm.moves.map((move) => (
          <Button
            key={move}
            onClick={() => handleMove(move)}
            disabled={attackAnimation.isAnimating || battleState.currentPlayer !== 'player1' || battleState.player1Pokemon.fainted || !!battleState.player1Status?.type && (battleState.player1Status.type === 'sleep' || battleState.player1Status.type === 'freeze' || (battleState.player1Status.type === 'paralyze' && Math.random() < (battleState.player1Status.skipTurnChance || 0)))}
            className="font-bold py-2 px-4 rounded text-black bg-gray-200 hover:bg-gray-300"
          >
            {move}
          </Button>
        ))}
      </div>
    </div>
  );
}
