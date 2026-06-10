
export interface Artist {
  id: string;
  name: string;
  image: string;
  genre: string;
}

export interface Label {
  id: string;
  name: string;
  tagline: string;
  concept: string;
  genre: string;
  audience: string;
  tone: string;
  logo: string;
  heroImage: string;
  artists: Artist[];
}

export interface Work {
  id: string;
  title: string;
  category: 'Live' | 'Music' | 'Creative' | 'Collaboration';
  image: string;
  description: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: 'Company' | 'Labels' | 'Events';
  image: string;
  summary: string;
}
