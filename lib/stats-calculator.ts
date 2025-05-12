import type { CapturedPokemon, TrainerStats } from './trainer-types';
export function calculateTrainerStats(pokemon: CapturedPokemon[]): TrainerStats {
    if (pokemon.length === 0) {
        return {
            totalPokemonCaught: 0,
            uniquePokemonTypes: 0,
            highestLevelPokemon: 0,
            favoritePokemonType: '',
            winRate: 0 // Placeholder for future battle system
        };
    }

    // Total Pokémon caught
    const totalPokemonCaught = pokemon.length;

    // Unique types
    console.log(pokemon)
    const allTypes = pokemon.flatMap(p => p.stats.currentForm.types);
    const uniqueTypes = new Set(allTypes);
    const uniquePokemonTypes = uniqueTypes.size;

    // Highest level Pokémon
    const highestLevelPokemon = Math.max(
        ...pokemon.map(p => p.stats.currentForm.level),
        0
    );

    // Favorite type (most common)
    const typeCounts = allTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const favoritePokemonType = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([type]) => type)[0] || '';

    return {
        totalPokemonCaught,
        uniquePokemonTypes,
        highestLevelPokemon,
        favoritePokemonType,
        winRate: 0 // Placeholder for future battle system
    };
}
