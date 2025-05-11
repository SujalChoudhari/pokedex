import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pokédex',
    short_name: 'Pokédex',
    description: 'Your personal Pokémon tracking companion',
    start_url: '/',
    display: 'standalone',
    background_color: '#dc2626',
    theme_color: '#dc2626',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
