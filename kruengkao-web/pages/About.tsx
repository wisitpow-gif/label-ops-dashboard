
import React from 'react';
import Section from '../components/Section';

const About: React.FC = () => {
  return (
    <div className="pt-20">
      <Section className="py-40">
        <h1 className="text-7xl md:text-[12rem] font-display tracking-tighter leading-[0.85] uppercase mb-20">
          Philosophy <br/> Over <br/> Profit
        </h1>
        <div className="max-w-2xl ml-auto">
          <p className="text-2xl md:text-3xl text-gray-400 leading-relaxed font-light italic">
            "In an industry that moves at light speed, we choose depth. We choose intention. We choose the artists who have something real to say."
          </p>
        </div>
      </Section>

      <Section className="bg-gray-100 grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { title: "Authenticity", desc: "No filters, just the raw essence of creativity." },
          { title: "Resilience", desc: "Building careers that withstand cultural shifts." },
          { title: "Precision", desc: "Every detail matters in the pursuit of perfection." },
          { title: "Legacy", desc: "Crafting music that lives beyond the moment." }
        ].map((belief, idx) => (
            <div key={idx} className="p-12 border border-black/5 bg-white hover:border-black/20 transition-all">
            <span className="text-xs font-bold text-black/30 mb-8 block">0{idx + 1}</span>
            <h3 className="text-3xl font-display mb-4">{belief.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{belief.desc}</p>
          </div>
        ))}
      </Section>

      <Section className="py-40">
        <div className="text-center mb-32">
          <h2 className="text-5xl font-display tracking-widest mb-4">HOW WE WORK</h2>
          <p className="text-gray-500 uppercase tracking-widest text-xs">A systemic approach to creative excellence</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/10 -translate-y-1/2 hidden md:block"></div>
          {['Discover', 'Develop', 'Amplify', 'Sustain'].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-white border border-black/20 flex items-center justify-center text-2xl font-display mb-8 group-hover:bg-black group-hover:text-white transition-all">
                {idx + 1}
              </div>
              <h4 className="text-2xl font-display uppercase tracking-widest mb-4">{step}</h4>
              <p className="text-center text-gray-600 text-xs px-12 leading-relaxed">Finding unique voices and providing the infrastructure to grow.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white text-black py-32">
        <h2 className="text-5xl font-display tracking-tight mb-20 text-center">OUR ECOSYSTEM</h2>
        <div className="flex flex-col items-center space-y-8">
           <div className="px-12 py-6 border-2 border-black font-display text-4xl uppercase">Company Holding</div>
           <div className="w-[2px] h-12 bg-gray-300"></div>
           <div className="flex gap-8 flex-wrap justify-center">
              <div className="px-8 py-4 border border-black font-display text-2xl uppercase">Labels</div>
              <div className="px-8 py-4 border border-black font-display text-2xl uppercase">Events</div>
              <div className="px-8 py-4 border border-black font-display text-2xl uppercase">Creative Studio</div>
           </div>
           <div className="w-[2px] h-12 bg-gray-300"></div>
           <div className="px-12 py-4 bg-white text-black font-display text-xl uppercase tracking-widest">Artists & Communities</div>
        </div>
      </Section>

      <Section>
        <h2 className="text-5xl font-display tracking-tight mb-20 text-center">LEADERSHIP</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { name: "Puntawan B.", role: "CEO / Founder", img: "https://picsum.photos/seed/ceo/400/500" },
            { name: "Sarin K.", role: "Chief Creative Officer", img: "https://picsum.photos/seed/cco/400/500" },
            { name: "Marisa L.", role: "Head of Operations", img: "https://picsum.photos/seed/coo/400/500" }
          ].map((leader, idx) => (
            <div key={idx} className="group overflow-hidden">
               <img src={leader.img} className="w-full aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 mb-6" alt={leader.name} />
               <h4 className="text-3xl font-display tracking-wide">{leader.name}</h4>
               <p className="text-sm text-gray-600 uppercase tracking-widest font-semibold">{leader.role}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default About;
