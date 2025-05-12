"use client"

import { useState, useEffect } from 'react';
import { MatchArena } from '@/components/match/MatchArena';
import { MatchSetup } from '@/components/match/MatchSetup';
import { supabase } from '@/lib/supabase';
import type { PokemonStats } from '@/lib/types';

export default function MatchPage() {
    const [matchStarted, setMatchStarted] = useState(false);
    const [player1Team, setPlayer1Team] = useState<PokemonStats[] | null>(null);
    const [player2Name, setPlayer2Name] = useState('');
    const [player2Team, setPlayer2Team] = useState<PokemonStats[] | null>(null);
    const [player1Id, setPlayer1Id] = useState('');

    useEffect(() => {
        const getUserId = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user.id;
            setPlayer1Id(userId || '');

            // Fetch Player 1's team
            if (userId) {
                const { data: trainerData, error: trainerError } = await supabase
                    .from('trainers')
                    .select('team')
                    .eq('user_id', userId)
                    .single();

                if (trainerError) {
                    console.error('Error fetching trainer data:', trainerError);
                    return;
                }

                if (trainerData?.team) {
                    // Fetch Pokemon data for Player 1's team
                    const { data: pokemonData, error: pokemonError } = await supabase
                        .from('captured_pokemon')
                        .select('id, stats, image_path')
                        .in('id', trainerData.team);

                    if (pokemonError) {
                        console.error('Error fetching Pokemon data:', pokemonError);
                        return;
                    }

                    setPlayer1Team(pokemonData?.map(p => ({ image_path: p.image_path, ...p.stats })) || null);
                }
            }
        }
        getUserId();
    }, []);

    const handleMatchStart = async (p2Name: string) => {
        setPlayer2Name(p2Name);

        // Fetch Player 2's user_id from the trainers table
        const { data: trainerData, error: trainerError } = await supabase
            .from('trainers')
            .select('user_id, team')
            .eq('name', p2Name)
            .single();

        if (trainerError) {
            console.error('Error fetching Player 2 trainer data:', trainerError);
            return;
        }

        if (trainerData?.team) {
            // Fetch Pokemon data for Player 2's team
            const { data: pokemonData, error: pokemonError } = await supabase
                .from('captured_pokemon')
                .select('id, stats, image_path')
                .in('id', trainerData.team);

            if (pokemonError) {
                console.error('Error fetching Player 2 Pokemon data:', pokemonError);
                return;
            }

            setPlayer2Team(pokemonData?.map(p => ({ image_path: p.image_path, ...p.stats })) || null);
            console.log('Player 2 Team:', pokemonData);
        }

        setMatchStarted(true);
    };

    return (
        <>
            {!matchStarted ? (
                <MatchSetup player1Team={player1Team} onMatchStart={handleMatchStart} />
            ) : (
                <MatchArena 
                    key={player2Name}
                    onMatchEnd={()=>{
                        setMatchStarted(false);
                        setPlayer2Name('');
                        setPlayer2Team(null);

                    }} player1Name='You' player1Team={player1Team as PokemonStats[]} player2Name={player2Name} player2Team={player2Team as PokemonStats[]} />
            )}
        </>
    );
}
