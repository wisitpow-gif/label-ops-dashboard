
import React from 'react';
import Section from '../components/Section';
import { NEWS } from '../constants';

const News: React.FC = () => {
  return (
    <div className="pt-20">
      <Section className="py-40">
        <h1 className="text-7xl md:text-9xl font-display tracking-tighter uppercase mb-20">Pulse & <br/> Perspective</h1>
        
        {/* Featured Story */}
        <div className="group cursor-pointer relative overflow-hidden border border-black/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="aspect-video lg:aspect-auto overflow-hidden">
               <img src={NEWS[0].image} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-all duration-1000" alt="Featured" />
            </div>
            <div className="p-12 md:p-24 flex flex-col justify-center bg-gray-100">
               <span className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-4">{NEWS[0].category} — {NEWS[0].date}</span>
               <h2 className="text-4xl md:text-6xl font-display tracking-tight mb-8 leading-none">{NEWS[0].title}</h2>
               <p className="text-gray-600 text-lg mb-12 leading-relaxed">{NEWS[0].summary}</p>
               <span className="inline-block border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:border-gray-700 transition-colors">Read Article</span>
            </div>
          </div>
        </div>
      </Section>

      <Section className="py-20">
        <h2 className="text-xs uppercase tracking-[0.5em] text-gray-600 font-bold mb-16 text-center">LATEST UPDATES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {NEWS.slice(1).map(item => (
            <div key={item.id} className="group flex gap-8 flex-col sm:flex-row items-start border-b border-black/5 pb-12">
              <img src={item.image} className="w-full sm:w-48 aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={item.title} />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2 block">{item.category} / {item.date}</span>
                <h3 className="text-3xl font-display mb-4 group-hover:text-gray-700 transition-colors leading-tight">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{item.summary}</p>
                <span className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 cursor-pointer">Read More</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white text-black py-40">
        <h2 className="text-5xl font-display tracking-tight mb-20">INSIGHTS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "The Future of Digital Labels", author: "Puntawan B." },
            { title: "Reshaping Live Experience", author: "Sarin K." },
            { title: "Building Fan Ecosystems", author: "Marisa L." }
          ].map((insight, idx) => (
            <div key={idx} className="p-8 border-l border-black/10 hover:border-black transition-colors cursor-pointer group">
               <h4 className="text-2xl font-display uppercase tracking-wider mb-4 group-hover:translate-x-2 transition-transform duration-300">{insight.title}</h4>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">By {insight.author}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default News;
