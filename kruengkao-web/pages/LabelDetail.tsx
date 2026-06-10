
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Section from '../components/Section';
import { LABELS } from '../constants';
import { Instagram, Youtube, Facebook, Music, ArrowLeft } from 'lucide-react';

const LabelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const label = LABELS.find(l => l.id === id);

  if (!label) return <div className="pt-40 text-center font-display text-4xl">Label Not Found</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative h-screen w-full flex items-end pb-24 px-6 overflow-hidden">
        <img src={label.heroImage} className="absolute inset-0 w-full h-full object-cover grayscale" alt={label.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <Link to="/labels" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-black/50 hover:text-black mb-12 transition-colors">
            <ArrowLeft size={16} /> All Labels
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-8xl md:text-[12rem] font-display tracking-tighter leading-none">{label.name}</h1>
              <p className="text-xl md:text-3xl uppercase tracking-widest font-light text-gray-700">{label.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      {/* DNA */}
      <Section className="bg-white text-black">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Concept', value: label.concept },
            { label: 'Genre', value: label.genre },
            { label: 'Audience', value: label.audience },
            { label: 'Tone', value: label.tone }
          ].map((item, idx) => (
            <div key={idx}>
              <h5 className="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-2">{item.label}</h5>
              <p className="text-lg md:text-2xl font-display uppercase tracking-tight">{item.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Artists */}
      <Section>
        <div className="mb-20">
          <h2 className="text-5xl font-display tracking-tight mb-4">THE ARTISTS</h2>
          <p className="text-gray-600 uppercase tracking-widest text-xs">Curated roster for {label.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {label.artists.map((artist) => (
            <div key={artist.id} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-6">
                <img src={artist.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={artist.name} />
              </div>
              <h4 className="text-3xl font-display tracking-wide mb-1">{artist.name}</h4>
              <p className="text-sm text-gray-600 uppercase tracking-widest font-semibold">{artist.genre}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Signature Works */}
      <Section className="bg-gray-100">
        <h2 className="text-5xl font-display tracking-tight mb-20">SIGNATURE WORKS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <img src="https://picsum.photos/seed/work1/1000/600" className="w-full grayscale hover:grayscale-0 transition-all duration-700" alt="Work 1" />
          <img src="https://picsum.photos/seed/work2/1000/600" className="w-full grayscale hover:grayscale-0 transition-all duration-700" alt="Work 2" />
        </div>
      </Section>

      {/* Connect */}
      <Section className="py-32 text-center">
        <h2 className="text-4xl font-display tracking-tight mb-12 uppercase">Connect with {label.name}</h2>
        <div className="flex justify-center gap-12 text-gray-600">
           <Instagram size={32} className="cursor-pointer hover:text-black transition-colors" />
           <Youtube size={32} className="cursor-pointer hover:text-black transition-colors" />
           <Facebook size={32} className="cursor-pointer hover:text-black transition-colors" />
           <Music size={32} className="cursor-pointer hover:text-black transition-colors" />
        </div>
      </Section>
    </div>
  );
};

export default LabelDetail;
