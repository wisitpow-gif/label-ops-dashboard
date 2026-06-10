
import React, { useState } from 'react';
import Section from '../components/Section';
import { WORKS } from '../constants';

const Works: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Live', 'Music', 'Creative', 'Collaboration'];

  const filteredWorks = filter === 'All' 
    ? WORKS 
    : WORKS.filter(w => w.category === filter);

  return (
    <div className="pt-20">
      <Section className="py-40 text-center">
        <h1 className="text-7xl md:text-9xl font-display tracking-tighter uppercase mb-8">Curated <br/> Impact</h1>
        <p className="text-xl md:text-3xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          A visual archive of our proudest moments, from sold-out arena tours to groundbreaking digital campaigns.
        </p>
      </Section>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-wrap justify-center gap-4 md:gap-12 sticky top-24 z-30 bg-white/50 backdrop-blur-md py-4 rounded-full border border-black/5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs uppercase tracking-widest font-bold transition-all px-4 py-2 rounded-full ${filter === cat ? 'bg-white text-black' : 'text-gray-600 hover:text-black'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <Section className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWorks.map((work) => (
            <div key={work.id} className="group cursor-pointer">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 border border-black/5 mb-6">
                 <img src={work.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={work.title} />
                 <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-black">
                   {work.category}
                 </div>
              </div>
              <h3 className="text-2xl font-display uppercase tracking-wider mb-2 group-hover:text-gray-600 transition-colors">{work.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{work.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Featured Case */}
      <Section className="bg-white text-black py-40">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
           <div>
             <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Case Study / 2024</span>
             <h2 className="text-6xl font-display tracking-tighter mb-8 leading-none">THE GENELAB <br/> REVOLUTION</h2>
             <p className="text-lg text-gray-600 leading-relaxed mb-12">
               How we built a niche alternative rock label into a mainstream cultural powerhouse through strategic touring, authentic artist branding, and fan-first digital ecosystems.
             </p>
             <button className="px-12 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
               Read Full Story
             </button>
           </div>
           <div className="relative">
             <img src="https://picsum.photos/seed/case1/800/1000" className="w-full grayscale shadow-2xl" alt="Featured Case" />
           </div>
         </div>
      </Section>
    </div>
  );
};

export default Works;
