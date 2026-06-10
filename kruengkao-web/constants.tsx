
import { Label, Work, NewsItem } from './types';

export const LABELS: Label[] = [
  {
    id: 'genelab',
    name: 'GeneLab',
    tagline: 'Alternative Rock & Creative Soundscapes',
    concept: 'Exploration and Innovation in Music',
    genre: 'Alt Rock / Indie / Experimental',
    audience: 'Music enthusiasts & Risk takers',
    tone: 'Raw, Honest, Edge',
    logo: 'https://picsum.photos/seed/gene1/200/200',
    heroImage: 'https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=1920',
    artists: [
      { id: 'a1', name: 'Three Man Down', image: 'https://picsum.photos/seed/tmd/400/500', genre: 'Pop Rock' },
      { id: 'a2', name: 'Tilly Birds', image: 'https://picsum.photos/seed/tb/400/500', genre: 'Alternative' },
      { id: 'a3', name: 'The Darkest Romance', image: 'https://picsum.photos/seed/tdr/400/500', genre: 'Metal/Prog' },
    ]
  },
  {
    id: '19',
    name: '19',
    tagline: 'The Modern Pop Wave',
    concept: 'Connecting the youth through melody',
    genre: 'Pop / Modern Pop / R&B',
    audience: 'Gen Z / Social Trendsetters',
    tone: 'Vibrant, Contemporary, Aesthetic',
    logo: 'https://picsum.photos/seed/19logo/200/200',
    heroImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1920',
    artists: [
      { id: 'a4', name: 'Nanon Korapat', image: 'https://picsum.photos/seed/nanon/400/500', genre: 'Pop' },
      { id: 'a5', name: 'Perspective', image: 'https://picsum.photos/seed/persp/400/500', genre: 'R&B' },
    ]
  },
  {
    id: '9-arkkhan',
    name: '9 Arkkhan',
    tagline: 'Thai Neo-Traditionalism',
    concept: 'Reimagining heritage through modern art',
    genre: 'World / Traditional Fusion / Art Music',
    audience: 'Art collectors / Intellectuals',
    tone: 'Sophisticated, Deep, Ethereal',
    logo: 'https://picsum.photos/seed/9ark/200/200',
    heroImage: 'https://images.unsplash.com/photo-1465821508027-561b82d5faee?auto=format&fit=crop&q=80&w=1920',
    artists: [
      { id: 'a6', name: 'Thai Modern Collective', image: 'https://picsum.photos/seed/tmc/400/500', genre: 'Fusion' },
      { id: 'a7', name: 'Ethereal Voice', image: 'https://picsum.photos/seed/ethv/400/500', genre: 'Traditional' },
    ]
  }
];

export const WORKS: Work[] = [
  { id: 'w1', title: 'GeneLab Con 2024', category: 'Live', image: 'https://picsum.photos/seed/live1/800/600', description: 'A massive gathering of alternative rock bands.' },
  { id: 'w2', title: '19 World Tour', category: 'Music', image: 'https://picsum.photos/seed/music1/800/600', description: 'Expanding the reach of Thai pop globally.' },
  { id: 'w3', title: 'Nike x GeneLab Collab', category: 'Collaboration', image: 'https://picsum.photos/seed/collab1/800/600', description: 'Exclusive sneakers inspired by music culture.' },
  { id: 'w4', title: 'Arkkhan Art Exhibition', category: 'Creative', image: 'https://picsum.photos/seed/creative1/800/600', description: 'Blending visual arts with sound performance.' },
  { id: 'w5', title: 'Sound of Siam', category: 'Collaboration', image: 'https://picsum.photos/seed/collab2/800/600', description: 'Brand activation for luxury travel.' },
  { id: 'w6', title: 'Neon Night Festival', category: 'Live', image: 'https://picsum.photos/seed/live2/800/600', description: 'Electronic music festival in the heart of Bangkok.' },
];

export const NEWS: NewsItem[] = [
  { id: 'n1', title: 'Creative Music Holding Wins Industry Award', date: 'Oct 12, 2024', category: 'Company', image: 'https://picsum.photos/seed/news1/600/400', summary: 'Recognized for innovation in artist management.' },
  { id: 'n2', title: 'Three Man Down New Album "Gravity"', date: 'Oct 08, 2024', category: 'Labels', image: 'https://picsum.photos/seed/news2/600/400', summary: 'The highly anticipated album drops today.' },
  { id: 'n3', title: 'GeneLab Con Tickets Sold Out in 5 Minutes', date: 'Oct 01, 2024', category: 'Events', image: 'https://picsum.photos/seed/news3/600/400', summary: 'Historic record for local music festivals.' },
];
