export interface BaseStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface CurrentForm {
  name: string
  types: string[]
  level: number
  description: string
  baseStats: BaseStats
  abilities: string[]
  moves: string[]
  colorScheme: string[]
}

export interface EvolutionForm {
  name: string
  level: number
  moves: string[]
  description: string
}

export interface EvolutionNextForm {
  name: string
  evolutionLevel: number
  moves: string[]
  description: string
}

export interface EvolutionChain {
  current: {
    name: string;
    level: number;
  };
  nextEvolution?: {
    name: string;
    evolutionLevel: number;
    moves: string[];
    description: string;
  };
  finalEvolution?: {
    name: string;
    evolutionLevel: number;
    moves: string[];
    description: string;
  };
}

export interface AnimationVariant {
  initial?: {
    opacity?: number;
    scale?: number;
  };
  animate: {
    scale?: number[] | number;
    rotate?: number[] | number;
    opacity?: number[] | number;
    x?: number[] | number;
    y?: number[] | number;
    filter?: string[] | string;
    transition: {
      duration: number;
      ease?: string;
      times?: number[];
    };
  };
  exit?: {
    opacity?: number;
    scale?: number;
  };
  [key: string]: any; // Add index signature for Framer Motion compatibility
}

export interface TypeAnimation {
  emoji: string;
  animation: AnimationVariant;
}

export interface PokemonStats {
  id?: string;
  currentForm: {
    name: string;
    description: string;
    types: string[];
    abilities: string[];
    moves: string[];
    level: number;
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  };
  evolutionChain: {
    current: {
      name: string;
      level: number;
      moves: string[];
      description: string;
    };
    nextEvolution: {
      name: string;
      evolutionLevel: number;
      moves: string[];
      description: string;
    };
    finalEvolution: {
      name: string;
      evolutionLevel: number;
      moves: string[];
      description: string;
    }
  };
  image_path?: string;
  height: string
  weight: string
}

export interface CapturedPokemon {
  id: string
  user_id: string
  image_path: string
  stats: PokemonStats
  captured_at: string
  created_at: string

}

export type Database = {
  public: {
    Tables: {
      captured_pokemon: {
        Row: CapturedPokemon
        Insert: Omit<CapturedPokemon, 'id' | 'created_at'>
        Update: Partial<CapturedPokemon>
      }
    }
  }
}

export interface BattleState {
  playerPokemon: {
    stats: PokemonStats;
    currentHP: number;
  };
  wildPokemon: {
    stats: PokemonStats;
    currentHP: number;
  };
  turn: 'player' | 'wild';
  isPlayerTurn: boolean;
  battleLog: string[];
  canFlee: boolean;
  battleStatus: 'ongoing' | 'won' | 'lost' | 'fled';
}

export interface BattleMove {
  name: string;
  power: number;
  accuracy: number;
  type: string;
  category: 'physical' | 'special';
}
