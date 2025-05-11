import type { PokemonStats } from './types';

export interface TrainerStats {
  totalPokemonCaught: number;
  uniquePokemonTypes: number;
  highestLevelPokemon: number;
  favoritePokemonType: string;
  winRate: number;
}

export interface Trainer {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  avatar_url: string | null;
  region: string;
  stats: TrainerStats;
  created_at: string;
  updated_at: string;
}

export interface CapturedPokemon {
  id: string;
  stats: PokemonStats;
  imagePath: string;
  captured_at: string;
}

export interface TrainerProfile extends Trainer {
  team: string[]; // Array of captured pokemon IDs
  captured_pokemon: CapturedPokemon[];
}
