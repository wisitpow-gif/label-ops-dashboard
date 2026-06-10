
import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { LABELS, WORKS } from '../constants';
import { ArrowUpRight, PlayCircle } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-white/40 z-10"></div>
        <video 
          autoPlay 
          loop 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://player.vimeo.com/external/464878484.sd.mp4?s=330c90419a4e3b7b43f1b4636d141e6e9b46903f&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
        </video>
        
        <div className="relative z-20 text-center max-w-4xl px-6">
          <h1 className="text-6xl md:text-9xl font-display tracking-tighter leading-none mb-6 animate-pulse text-black">
            WE SHAPE MUSIC & CULTURE
          </h1>
          <p className="text-lg md:text-2xl uppercase tracking-[0.3em] font-light mb-12 text-black">
            Labels / Live / Creative
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/contact" className="px-12 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
              Work with us <ArrowUpRight size={18} />
            </Link>
            <Link to="/labels" className="px-12 py-4 border border-black text-black font-bold uppercase tracking-widest hover:bg-black/10 transition-all">
              Explore our labels
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20">
          <div className="w-[1px] h-12 bg-black"></div>
        </div>
      </section>

      {/* Who We Are */}
      <Section className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-xs uppercase tracking-[0.5em] text-gray-500 mb-8 font-bold">Who We Are</h2>
            <p className="text-3xl md:text-5xl font-display leading-tight">
              We are a creative holding at the intersection of sound, strategy, and legacy. 
              We don't just manage artists; we architect cultural movements that resonate through generations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://picsum.photos/seed/home1/400/600" className="w-full grayscale hover:grayscale-0 transition-all duration-700" alt="Collage 1" />
            <img src="https://picsum.photos/seed/home2/400/600" className="w-full mt-12 grayscale hover:grayscale-0 transition-all duration-700" alt="Collage 2" />
          </div>
        </div>
      </Section>

      {/* Our Labels */}
      <Section className="bg-[#050505]">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-display tracking-tighter mb-4">THREE LABELS. ONE VISION.</h2>
          <p className="text-gray-400 tracking-widest">A DIVERSE ECOSYSTEM OF ARTISTIC VOICES</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LABELS.map((label) => (
            <div key={label.id} className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/5">
              <img src={label.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt={label.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <h3 className="text-4xl font-display tracking-tight mb-2">{label.name}</h3>
                <p className="text-sm text-gray-300 mb-6 font-semibold uppercase tracking-wider">{label.tagline}</p>
                <Link to={`/labels/${label.id}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-white pb-1 group-hover:gap-4 transition-all">
                  Explore <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3 Pillars */}
      <Section className="bg-white text-black py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div>
            <h3 className="text-2xl font-display tracking-widest mb-4">LABEL & ARTIST<br/>MANAGEMENT</h3>
            <p className="text-gray-600 text-sm leading-relaxed px-8">Building sustainable careers through strategic planning, production, and global distribution.</p>
          </div>
          <div className="border-x border-gray-200">
            <h3 className="text-2xl font-display tracking-widest mb-4">LIVE & EVENT<br/>PRODUCTION</h3>
            <p className="text-gray-600 text-sm leading-relaxed px-8">Crafting immersive experiences from high-energy festivals to intimate showcase events.</p>
          </div>
          <div>
            <h3 className="text-2xl font-display tracking-widest mb-4">CREATIVE &<br/>BRAND COLLAB</h3>
            <p className="text-gray-600 text-sm leading-relaxed px-8">Fusing music with brands to create authentic stories and impactful market presence.</p>
          </div>
        </div>
      </Section>

      {/* Selected Highlights */}
      <Section className="bg-white">
        <div className="flex justify-between items-end mb-16">
          <h2 className="text-6xl font-display tracking-tighter">SELECTED IMPACT</h2>
          <Link to="/works" className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:gap-4 transition-all">View All Works <ArrowUpRight size={16}/></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKS.slice(0, 3).map(work => (
            <div key={work.id} className="relative group overflow-hidden bg-gray-100 border border-black/5">
               <img src={work.image} className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" alt={work.title} />
               <div className="p-8">
                 <span className="text-[10px] uppercase tracking-widest font-bold text-black/50 mb-2 block">{work.category}</span>
                 <h4 className="text-2xl font-display tracking-wide mb-4">{work.title}</h4>
                 <p className="text-sm text-gray-600">{work.description}</p>
               </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Trusted By */}
      <Section className="bg-zinc-950 text-center py-20 border-y border-white/5">
        <h3 className="text-[10px] uppercase tracking-[0.5em] text-gray-600 font-bold mb-16">TRUSTED BY INDUSTRY LEADERS</h3>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
          <span className="text-2xl font-display tracking-widest">SONY MUSIC</span>
          <span className="text-2xl font-display tracking-widest">WARNER BROS</span>
          <span className="text-2xl font-display tracking-widest">NIKE</span>
          <span className="text-2xl font-display tracking-widest">ADIDAS</span>
          <span className="text-2xl font-display tracking-widest">VOGUE</span>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-white text-black py-40 text-center">
        <h2 className="text-6xl md:text-9xl font-display tracking-tighter mb-12">READY TO CREATE?</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <Link to="/contact?type=business" className="px-16 py-6 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
            Business Partnerships
          </Link>
          <Link to="/contact?type=artist" className="px-16 py-6 border-2 border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Artists & Creators
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default Home;
