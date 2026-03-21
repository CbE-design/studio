import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nedbank Money',
    short_name: 'MoneyGO',
    description: 'Nedbank Digital Banking for Trusts',
    start_url: '/',
    display: 'standalone',
    background_color: '#008243',
    theme_color: '#008243',
    icons: [
      {
        src: 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}