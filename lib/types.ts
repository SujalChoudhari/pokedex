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
  current: EvolutionForm
  nextEvolution: EvolutionNextForm
  finalEvolution: EvolutionNextForm
}

export interface PokemonStats {
  currentForm: CurrentForm
  evolutionChain: EvolutionChain
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
