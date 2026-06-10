
import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { LABELS } from '../constants';
import { ArrowRight } from 'lucide-react';

const Labels: React.FC = () => {
  return (
    <div className="pt-20">
      <Section className="py-40 border-b border-black/10">
        <h1 className="text-6xl md:text-9xl font-display tracking-tighter uppercase mb-12">The <br/> Ecosystem</h1>
        <p className="text-xl md:text-3xl text-gray-400 max-w-2xl leading-relaxed">
          Three unique labels. Three distinct identities. 
          One unified ecosystem built to empower artistry across all genres.
        </p>
      </Section>

      <div className="divide-y divide-black/10">
        {LABELS.map((label) => (
          <div key={label.id} className="relative group overflow-hidden py-40 hover:bg-gray-50 transition-colors">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="text-xs uppercase tracking-[0.5em] text-gray-600 font-bold mb-4 block">{label.genre}</span>
                <h2 className="text-7xl md:text-9xl font-display tracking-tighter mb-8 group-hover:translate-x-4 transition-transform duration-500">{label.name}</h2>
                <p className="text-xl text-gray-600 mb-12 max-w-md leading-relaxed">{label.concept}</p>
                <Link to={`/labels/${label.id}`} className="inline-flex items-center gap-4 text-sm font-bold uppercase tracking-[0.3em] hover:text-black transition-colors group">
                  View Label Profile <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
              <div className="relative">
                <img 
                  src={label.heroImage} 
                  className="w-full aspect-[4/3] object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                  alt={label.name} 
                />
              </div>
            </div>
            {/* Background Text Effect */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[20vw] font-display text-black/5 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-700 whitespace-nowrap overflow-hidden w-full select-none">
              {label.name} {label.name} {label.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Labels;
