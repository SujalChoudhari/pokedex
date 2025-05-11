"use client"

import { useState, useEffect } from 'react';
import { PokemonStats, BattleMove, TypeAnimation, AnimationVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';

interface BattleArenaProps {
  playerPokemon: PokemonStats;
  wildPokemon: PokemonStats;
  wildPokemonImage: string;
  onBattleEnd: (result: 'won' | 'lost' | 'fled') => void;
  playerTeam?: PokemonStats[]; // Add player's team
  onPokemonSwap?: (newPokemon: PokemonStats) => void; // Callback for swapping
}

interface TeamMemberState {
  stats: PokemonStats;
  currentHP: number;
  fainted: boolean;
}

// Type-based animation effects
const TYPE_ANIMATIONS: Record<string, TypeAnimation> = {
  normal: { 
    emoji: "💫",
    animation: {
      initial: { opacity: 0, scale: 0 },
      animate: { 
        scale: [1, 1.2, 1],
        rotate: [0, 360, 0],
        transition: { duration: 0.5 }
      },
      exit: { opacity: 0, scale: 0 }
    }
  },
  fire: { 
    emoji: "🔥",
    animation: {
      initial: { opacity: 0, scale: 0 },
      animate: { 
        scale: [1, 1.5, 1],
        y: [0, -20, 0],
        filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
        transition: { duration: 0.5 }
      },
      exit: { opacity: 0, scale: 0 }
    }
  },
  water: { 
    emoji: "💧",
    animation: {
      animate: { 
        y: [0, -30, 0],
        scale: [1, 1.2, 1],
        rotate: [0, 45, -45, 0],
        transition: { duration: 0.7 }
      }
    }
  },
  electric: { 
    emoji: "⚡",
    animation: {
      animate: { 
        x: [-10, 10, -10, 10, 0],
        opacity: [0, 1, 0, 1, 0],
        scale: [0.8, 1.2, 0.8, 1.2, 1],
        transition: { duration: 0.3, times: [0, 0.25, 0.5, 0.75, 1] }
      }
    }
  },
  grass: { 
    emoji: "🌿",
    animation: {
      animate: { 
        scale: [1, 1.3, 1],
        rotate: [0, 15, -15, 0],
        y: [0, -10, 0],
        transition: { duration: 0.6, ease: "easeInOut" }
      }
    }
  },
  ice: { 
    emoji: "❄️",
    animation: {
      animate: { 
        scale: [1, 0.8, 1],
        opacity: [1, 0.7, 1],
        filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
        transition: { duration: 0.5 }
      }
    }
  },
  fighting: { 
    emoji: "👊",
    animation: {
      animate: { 
        x: [0, -20, 20, 0],
        y: [0, -10, 10, 0],
        scale: [1, 1.2, 1.2, 1],
        transition: { duration: 0.3, ease: "easeOut" }
      }
    }
  },
  poison: { 
    emoji: "☠️",
    animation: {
      animate: { 
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, 10, -10, 5, 0],
        filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
        transition: { duration: 0.6 }
      }
    }
  },
  ground: { 
    emoji: "🌋",
    animation: {
      animate: { 
        y: [0, 10, -10, 5, 0],
        scale: [1, 1.1, 0.9, 1.05, 1],
        transition: { duration: 0.5, ease: "easeInOut" }
      }
    }
  },
  flying: { 
    emoji: "🌪️",
    animation: {
      animate: { 
        y: [0, -30, -15, -30, 0],
        rotate: [0, 360, 720],
        transition: { duration: 0.7 }
      }
    }
  },
  psychic: { 
    emoji: "🔮",
    animation: {
      animate: { 
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"],
        transition: { duration: 0.8 }
      }
    }
  },
  bug: { 
    emoji: "🐛",
    animation: {
      animate: { 
        x: [0, 10, -10, 10, 0],
        y: [0, -5, 5, -5, 0],
        transition: { duration: 0.4, ease: "linear" }
      }
    }
  },
  rock: { 
    emoji: "🪨",
    animation: {
      animate: { 
        scale: [1, 1.4, 1],
        rotate: [0, 45, 0],
        transition: { duration: 0.4, ease: "backOut" }
      }
    }
  },
  ghost: { 
    emoji: "👻",
    animation: {
      animate: { 
        opacity: [1, 0.3, 1],
        scale: [1, 1.2, 1],
        y: [0, -10, 0],
        filter: ["blur(0px)", "blur(4px)", "blur(0px)"],
        transition: { duration: 0.6 }
      }
    }
  },
  dragon: { 
    emoji: "🐲",
    animation: {
      animate: { 
        scale: [1, 1.5, 1],
        rotate: [0, 20, -20, 0],
        filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
        transition: { duration: 0.5 }
      }
    }
  },
  dark: { 
    emoji: "🌑",
    animation: {
      animate: { 
        scale: [1, 1.2, 1],
        opacity: [1, 0.2, 1],
        filter: ["brightness(1)", "brightness(0.5)", "brightness(1)"],
        transition: { duration: 0.6 }
      }
    }
  },
  steel: { 
    emoji: "⚔️",
    animation: {
      animate: { 
        scale: [1, 1.2, 1],
        rotate: [0, 180, 0],
        filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
        transition: { duration: 0.4 }
      }
    }
  },
  fairy: { 
    emoji: "✨",
    animation: {
      animate: { 
        scale: [1, 1.3, 0.8, 1.2, 1],
        rotate: [0, 45, -45, 20, 0],
        opacity: [1, 0.7, 1, 0.7, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"],
        transition: { duration: 0.7 }
      }
    }
  }
};

// Add type for Pokemon types
type PokemonType = 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

// Update type effectiveness mapping
const TYPE_EFFECTIVENESS: Record<PokemonType, {
    weak: PokemonType[];
    resistant: PokemonType[];
    immune: PokemonType[];
}> = {
    normal: {
        weak: ['fighting'],
        resistant: ['ghost'],
        immune: []
    },
    fire: {
        weak: ['water', 'ground', 'rock'],
        resistant: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
        immune: []
    },
    water: {
        weak: ['electric', 'grass'],
        resistant: ['fire', 'water', 'ice', 'steel'],
        immune: []
    },
    electric: {
        weak: ['ground'],
        resistant: ['electric', 'flying', 'steel'],
        immune: []
    },
    grass: {
        weak: ['fire', 'ice', 'poison', 'flying', 'bug'],
        resistant: ['water', 'electric', 'grass', 'ground'],
        immune: []
    },
    ice: {
        weak: ['fire', 'fighting', 'rock', 'steel'],
        resistant: ['ice'],
        immune: []
    },
    fighting: {
        weak: ['flying', 'psychic', 'fairy'],
        resistant: ['bug', 'rock', 'dark'],
        immune: []
    },
    poison: {
        weak: ['ground', 'psychic'],
        resistant: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
        immune: []
    },
    ground: {
        weak: ['water', 'grass', 'ice'],
        resistant: ['poison', 'rock'],
        immune: ['electric']
    },
    flying: {
        weak: ['electric', 'ice', 'rock'],
        resistant: ['grass', 'fighting', 'bug'],
        immune: ['ground']
    },
    psychic: {
        weak: ['bug', 'ghost', 'dark'],
        resistant: ['fighting', 'psychic'],
        immune: []
    },
    bug: {
        weak: ['fire', 'flying', 'rock'],
        resistant: ['grass', 'fighting', 'ground'],
        immune: []
    },
    rock: {
        weak: ['water', 'grass', 'fighting', 'ground', 'steel'],
        resistant: ['normal', 'fire', 'poison', 'flying'],
        immune: []
    },
    ghost: {
        weak: ['ghost', 'dark'],
        resistant: ['poison', 'bug'],
        immune: ['normal', 'fighting']
    },
    dragon: {
        weak: ['ice', 'dragon', 'fairy'],
        resistant: ['fire', 'water', 'electric', 'grass'],
        immune: []
    },
    dark: {
        weak: ['fighting', 'bug', 'fairy'],
        resistant: ['ghost', 'dark'],
        immune: ['psychic']
    },
    steel: {
        weak: ['fire', 'fighting', 'ground'],
        resistant: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
        immune: ['poison']
    },
    fairy: {
        weak: ['poison', 'steel'],
        resistant: ['fighting', 'bug', 'dark'],
        immune: ['dragon']
    }
};

// Update the effectiveness calculation function
function calculateMoveEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
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

export function BattleArena({ 
  playerPokemon, 
  wildPokemon, 
  wildPokemonImage, 
  onBattleEnd,
  playerTeam = [],
  onPokemonSwap 
}: BattleArenaProps) {
  // Initialize team state with health
  const initialTeamState = playerTeam.map(pokemon => ({
    stats: pokemon,
    currentHP: calculateMaxHP(pokemon.currentForm.baseStats.hp),
    fainted: false
  }));

  const [battleState, setBattleState] = useState<{
    playerPokemon: TeamMemberState;
    wildPokemon: TeamMemberState;
    teamState: TeamMemberState[];
    turn: 'player' | 'wild';
    isPlayerTurn: boolean;
    battleLog: string[];
    canFlee: boolean;
    battleStatus: 'ongoing' | 'won' | 'lost' | 'fled';
  }>({
    playerPokemon: {
      stats: playerPokemon,
      currentHP: calculateMaxHP(playerPokemon.currentForm.baseStats.hp),
      fainted: false
    },
    wildPokemon: {
      stats: wildPokemon,
      currentHP: calculateMaxHP(wildPokemon.currentForm.baseStats.hp),
      fainted: false
    },
    teamState: initialTeamState,
    turn: 'player',
    isPlayerTurn: true,
    battleLog: [`A wild ${wildPokemon.currentForm.name} appeared!`],
    canFlee: true,
    battleStatus: 'ongoing',
  });

  const [attackAnimation, setAttackAnimation] = useState<{
    isAnimating: boolean;
    attacker: 'player' | 'wild';
    type?: string;
  }>({ isAnimating: false, attacker: 'player' });


  function calculateMaxHP(baseHP: number): number {
    return Math.floor((2 * baseHP * 50) / 100 + 50 + 10);
  }

  function calculateDamage(move: BattleMove, attacker: PokemonStats, defender: PokemonStats): number {
    const power = move.power;
    const attack = move.category === 'physical' ? attacker.currentForm.baseStats.attack : attacker.currentForm.baseStats.specialAttack;
    const defense = move.category === 'physical' ? defender.currentForm.baseStats.defense : defender.currentForm.baseStats.specialDefense;
    
    const damage = Math.floor(((2 * 50 / 5 + 2) * power * attack / defense) / 50 + 2);
    return Math.max(1, damage);
  }

  // Function to check if all team members have fainted
  const checkTeamWipeout = (teamState: TeamMemberState[]): boolean => {
    return teamState.every(member => member.fainted);
  };

  // Function to find next available Pokemon
  const findNextAvailablePokemon = (teamState: TeamMemberState[]): TeamMemberState | null => {
    return teamState.find(member => !member.fainted && member.stats !== battleState.playerPokemon.stats) || null;
  };

  // Modified handleSwap to wait for state update before wild turn
  const handleSwap = (newPokemon: PokemonStats) => {
    if (!battleState.isPlayerTurn || battleState.battleStatus !== 'ongoing') return;
    
    const newTeamState = battleState.teamState.map(member => 
      member.stats === newPokemon ? member : member
    );

    const newPokemonState = newTeamState.find(member => member.stats === newPokemon);
    if (!newPokemonState || newPokemonState.fainted) return;

    setBattleState(prev => {
      const updatedState = {
        ...prev,
        playerPokemon: newPokemonState,
        teamState: newTeamState,
        isPlayerTurn: false,
        battleLog: [...prev.battleLog, `Go! ${newPokemon.currentForm.name}!`],
      };
      
      // Schedule wild Pokemon's turn after state update
      setTimeout(() => handleWildPokemonTurn(updatedState), 1000);
      
      return updatedState;
    });

    onPokemonSwap?.(newPokemon);
  };

  // Modified handleWildPokemonTurn to accept current state
  const handleWildPokemonTurn = async (currentState = battleState) => {
    const wildMoves = wildPokemon.currentForm.moves;
    const randomMove = wildMoves[Math.floor(Math.random() * wildMoves.length)];

    setAttackAnimation({ 
      isAnimating: true, 
      attacker: 'wild',
      type: wildPokemon.currentForm.types[0].toLowerCase()
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const wildDamage = calculateDamage(
      { name: randomMove, power: 50, accuracy: 95, type: wildPokemon.currentForm.types[0], category: 'physical' },
      wildPokemon,
      currentState.playerPokemon.stats // Use the current active Pokemon's stats
    );

    const newPlayerHP = Math.max(0, currentState.playerPokemon.currentHP - wildDamage);
    const newTeamState = currentState.teamState.map(member =>
      member.stats === currentState.playerPokemon.stats
        ? { ...member, currentHP: newPlayerHP, fainted: newPlayerHP <= 0 }
        : member
    );

    setBattleState(prev => {
      const updatedState = {
        ...prev,
        playerPokemon: {
          ...currentState.playerPokemon,
          currentHP: newPlayerHP,
          fainted: newPlayerHP <= 0
        },
        teamState: newTeamState,
        isPlayerTurn: true,
        battleLog: [...prev.battleLog, `${wildPokemon.currentForm.name} used ${randomMove}!`],
      };

      if (newPlayerHP <= 0) {
        const nextPokemon = findNextAvailablePokemon(newTeamState);
        
        if (nextPokemon) {
          // Automatically swap to next available Pokemon
          setTimeout(() => {
            setBattleState(prevState => ({
              ...prevState,
              playerPokemon: nextPokemon,
              battleLog: [
                ...prevState.battleLog,
                `${currentState.playerPokemon.stats.currentForm.name} fainted!`,
                `Go! ${nextPokemon.stats.currentForm.name}!`
              ],
            }));
          }, 1000);
        } else if (checkTeamWipeout(newTeamState)) {
          // All Pokemon have fainted
          return {
            ...updatedState,
            battleStatus: 'lost',
            battleLog: [
              ...prev.battleLog,
              `${currentState.playerPokemon.stats.currentForm.name} fainted!`,
              'All your Pokémon have fainted!'
            ],
          };
        }
      }

      return updatedState;
    });

    setAttackAnimation({ isAnimating: false, attacker: 'wild' });

    if (newPlayerHP <= 0 && checkTeamWipeout(newTeamState)) {
      onBattleEnd('lost');
    }
  };

  async function handleMove(moveName: string) {
    if (!battleState.isPlayerTurn || battleState.battleStatus !== 'ongoing') return;

    const move: BattleMove = {
      name: moveName,
      power: 50,
      accuracy: 95,
      type: playerPokemon.currentForm.types[0],
      category: 'physical',
    };

    setAttackAnimation({ 
      isAnimating: true, 
      attacker: 'player',
      type: playerPokemon.currentForm.types[0].toLowerCase()
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const damage = calculateDamage(move, playerPokemon, wildPokemon);
    const newWildHP = Math.max(0, battleState.wildPokemon.currentHP - damage);

    setBattleState(prev => ({
      ...prev,
      wildPokemon: {
        ...prev.wildPokemon,
        currentHP: newWildHP,
      },
      isPlayerTurn: false,
      battleLog: [...prev.battleLog, `${playerPokemon.currentForm.name} used ${moveName}!`],
    }));

    setAttackAnimation({ isAnimating: false, attacker: 'player' });

    if (newWildHP <= 0) {
      setBattleState(prev => ({
        ...prev,
        battleStatus: 'won',
        battleLog: [...prev.battleLog, `${wildPokemon.currentForm.name} fainted!`],
      }));
      onBattleEnd('won');
      return;
    }

    // Wild Pokemon's turn
    setTimeout(() => handleWildPokemonTurn(), 1000);
  }

  function handleFlee() {
    if (!battleState.canFlee) {
      toast.error("Can't escape!");
      return;
    }
    setBattleState(prev => ({
      ...prev,
      battleStatus: 'fled',
      battleLog: [...prev.battleLog, 'Got away safely!'],
    }));
    onBattleEnd('fled');
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 p-4 font-mono text-white">
      {/* Battle Arena */}
      <div className="relative w-full h-[55vh] bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg border-4 border-gray-600 overflow-hidden">
        {/* Wild Pokemon */}
        <div className="absolute top-10 right-4 w-48 h-48">
          <motion.div
            className="relative w-full h-full"
            animate={{
              x: attackAnimation.isAnimating && attackAnimation.attacker === 'player' ? [0, -10, 10, -10, 0] : 0,
              opacity: battleState.wildPokemon.currentHP <= 0 ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <img
                src={wildPokemonImage}
                alt={wildPokemon.currentForm.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -top-8 left-0 right-0 bg-white/10 rounded-lg backdrop-blur-sm p-2">
              <div className="text-sm font-bold mb-1">{wildPokemon.currentForm.name}</div>
              <div className="flex gap-1 mb-1">
                {wildPokemon.currentForm.types.map((type) => (
                  <span
                    key={type}
                    className={`text-xs px-1.5 py-0.5 rounded-sm uppercase
                      ${type.toLowerCase() === 'fire' ? 'bg-red-500' :
                      type.toLowerCase() === 'water' ? 'bg-blue-500' :
                      type.toLowerCase() === 'grass' ? 'bg-green-500' :
                      type.toLowerCase() === 'electric' ? 'bg-yellow-500' :
                      type.toLowerCase() === 'ice' ? 'bg-cyan-400' :
                      type.toLowerCase() === 'fighting' ? 'bg-orange-700' :
                      type.toLowerCase() === 'poison' ? 'bg-purple-500' :
                      type.toLowerCase() === 'ground' ? 'bg-amber-800' :
                      type.toLowerCase() === 'flying' ? 'bg-indigo-400' :
                      type.toLowerCase() === 'psychic' ? 'bg-pink-500' :
                      type.toLowerCase() === 'bug' ? 'bg-lime-500' :
                      type.toLowerCase() === 'rock' ? 'bg-stone-500' :
                      type.toLowerCase() === 'ghost' ? 'bg-violet-700' :
                      type.toLowerCase() === 'dragon' ? 'bg-violet-500' :
                      type.toLowerCase() === 'dark' ? 'bg-gray-800' :
                      type.toLowerCase() === 'steel' ? 'bg-slate-400' :
                      type.toLowerCase() === 'fairy' ? 'bg-pink-300' :
                      'bg-gray-500'}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="h-2 bg-gray-700 rounded">
                <motion.div
                  className="h-full bg-green-500 rounded"
                  initial={{ width: '100%' }}
                  animate={{
                    width: `${(battleState.wildPokemon.currentHP / calculateMaxHP(wildPokemon.currentForm.baseStats.hp)) * 100}%`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs mt-1">
                {battleState.wildPokemon.currentHP} / {calculateMaxHP(wildPokemon.currentForm.baseStats.hp)}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Player Pokemon */}
        <div className="absolute bottom-4 left-4 w-48 h-48">
          <motion.div
            className="relative w-full h-full"
            animate={{
              x: attackAnimation.isAnimating && attackAnimation.attacker === 'wild' ? [0, 10, -10, 10, 0] : 0,
              opacity: battleState.playerPokemon.currentHP <= 0 ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {battleState.playerPokemon.stats.image_path ? (
                <img
                  src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${battleState.playerPokemon.stats.image_path}`}
                  alt={battleState.playerPokemon.stats.currentForm.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
              )}
            </div>
            <div className="absolute -top-8 left-0 right-0 bg-white/10 rounded-lg backdrop-blur-sm p-2">
              <div className="text-sm font-bold mb-1">{battleState.playerPokemon.stats.currentForm.name}</div>
              <div className="flex gap-1 mb-1">
                {battleState.playerPokemon.stats.currentForm.types.map((type) => (
                  <span
                    key={type}
                    className={`text-xs px-1.5 py-0.5 rounded-sm uppercase
                      ${type.toLowerCase() === 'fire' ? 'bg-red-500' :
                      type.toLowerCase() === 'water' ? 'bg-blue-500' :
                      type.toLowerCase() === 'grass' ? 'bg-green-500' :
                      type.toLowerCase() === 'electric' ? 'bg-yellow-500' :
                      type.toLowerCase() === 'ice' ? 'bg-cyan-400' :
                      type.toLowerCase() === 'fighting' ? 'bg-orange-700' :
                      type.toLowerCase() === 'poison' ? 'bg-purple-500' :
                      type.toLowerCase() === 'ground' ? 'bg-amber-800' :
                      type.toLowerCase() === 'flying' ? 'bg-indigo-400' :
                      type.toLowerCase() === 'psychic' ? 'bg-pink-500' :
                      type.toLowerCase() === 'bug' ? 'bg-lime-500' :
                      type.toLowerCase() === 'rock' ? 'bg-stone-500' :
                      type.toLowerCase() === 'ghost' ? 'bg-violet-700' :
                      type.toLowerCase() === 'dragon' ? 'bg-violet-500' :
                      type.toLowerCase() === 'dark' ? 'bg-gray-800' :
                      type.toLowerCase() === 'steel' ? 'bg-slate-400' :
                      type.toLowerCase() === 'fairy' ? 'bg-pink-300' :
                      'bg-gray-500'}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="h-2 bg-gray-700 rounded">
                <motion.div
                  className="h-full bg-green-500 rounded"
                  initial={{ width: '100%' }}
                  animate={{
                    width: `${(battleState.playerPokemon.currentHP / calculateMaxHP(battleState.playerPokemon.stats.currentForm.baseStats.hp)) * 100}%`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs mt-1">
                {battleState.playerPokemon.currentHP} / {calculateMaxHP(battleState.playerPokemon.stats.currentForm.baseStats.hp)}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Attack Effects */}
        <AnimatePresence>
          {attackAnimation.isAnimating && attackAnimation.type && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              variants={TYPE_ANIMATIONS[attackAnimation.type]?.animation || TYPE_ANIMATIONS.normal.animation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="text-6xl">
                {TYPE_ANIMATIONS[attackAnimation.type]?.emoji || TYPE_ANIMATIONS.normal.emoji}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Battle Controls */}
      <div className="mt-4 space-y-4">
        {/* Updated Team Selection Bar */}
        {playerTeam && playerTeam.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-2 overflow-x-auto">
            <div className="flex gap-2">
              {battleState.teamState.map((pokemon, index) => (
                <button
                  key={index}
                  onClick={() => !pokemon.fainted && handleSwap(pokemon.stats)}
                  disabled={
                    pokemon.stats === battleState.playerPokemon.stats || 
                    !battleState.isPlayerTurn || 
                    battleState.battleStatus !== 'ongoing' || 
                    attackAnimation.isAnimating ||
                    pokemon.fainted
                  }
                  className={`
                    relative flex flex-col items-center p-2 rounded-lg min-w-[80px]
                    ${pokemon.stats === battleState.playerPokemon.stats 
                      ? 'bg-blue-600 border-2 border-blue-400' 
                      : pokemon.fainted
                      ? 'bg-gray-800 opacity-50'
                      : 'bg-gray-700 hover:bg-gray-600'}
                    ${!battleState.isPlayerTurn || battleState.battleStatus !== 'ongoing' || attackAnimation.isAnimating 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer transform hover:scale-105 transition-transform'}
                  `}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-600">
                    {pokemon.stats.image_path ? (
                      <img
                        src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${pokemon.stats.image_path}`}
                        alt={pokemon.stats.currentForm.name}
                        className={`w-full h-full object-cover ${pokemon.fainted ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                    )}
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
                        width: `${(pokemon.currentHP / calculateMaxHP(pokemon.stats.currentForm.baseStats.hp)) * 100}%` 
                      }}
                    />
                  </div>
                  {pokemon.stats === battleState.playerPokemon.stats && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Battle Log */}
        <div className="bg-gray-700 rounded-lg p-2 h-20 overflow-y-auto">
            {battleState.battleLog.map((log, index) => (
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm mb-1"
                >
                    {">"} {log}
                </motion.p>
            ))}
        </div>

        {/* Moves and Actions */}
        <div className="grid  gap-4">
            <div className="grid grid-cols-2 gap-2">
                {battleState.playerPokemon.stats.currentForm.moves.slice(0, 4).map((move) => {
                    // Get move type from the move name (you might want to update this with actual move types)
                    const moveType = battleState.playerPokemon.stats.currentForm.types[0].toLowerCase() as PokemonType;
                    const defenderTypes = wildPokemon.currentForm.types.map(t => t.toLowerCase() as PokemonType);
                    const effectiveness = calculateMoveEffectiveness(moveType, defenderTypes);
                    
                    let effectivenessLabel = '';
                    let effectivenessColor = '';
                    
                    if (effectiveness >= 2) {
                        effectivenessLabel = 'Super Effective';
                        effectivenessColor = 'bg-gray-100 hover:bg-gray-200 border-2 border-green-500';
                    } else if (effectiveness > 1) {
                        effectivenessLabel = 'Effective';
                        effectivenessColor = 'bg-gray-100 hover:bg-gray-200 border-2 border-blue-500';
                    } else if (effectiveness === 0) {
                        effectivenessLabel = 'No Effect';
                        effectivenessColor = 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-500';
                    } else if (effectiveness < 1) {
                        effectivenessLabel = 'Not Very Effective';
                        effectivenessColor = 'bg-gray-100 hover:bg-gray-200 border-2 border-red-500';
                    }

                    return (
                        <Button
                            key={move}
                            title={effectivenessLabel}
                            onClick={() => handleMove(move)}
                            disabled={!battleState.isPlayerTurn || battleState.battleStatus !== 'ongoing' || attackAnimation.isAnimating}
                            className={`relative font-bold py-2 px-4 rounded ${effectivenessColor} text-black`}
                        >
                            {move}
                            
                        </Button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2">
                <Button
                    onClick={handleFlee}
                    disabled={!battleState.canFlee || battleState.battleStatus !== 'ongoing' || attackAnimation.isAnimating}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                    Flee
                </Button>

            </div>
           
        </div>
      </div>

      
    </div>
  );
} 