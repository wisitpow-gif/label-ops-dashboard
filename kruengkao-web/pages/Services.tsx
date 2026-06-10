
import React from 'react';
import Section from '../components/Section';
import { Mic2, Music, Target, Globe, Radio, Star } from 'lucide-react';

const Services: React.FC = () => {
  return (
    <div className="pt-20">
      <Section className="py-40 text-center">
        <h1 className="text-7xl md:text-9xl font-display tracking-tighter uppercase mb-8">System of <br/> Success</h1>
        <p className="text-xl md:text-3xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          From the first demo to a global stage performance, 
          we provide the infrastructure to turn creativity into a world-class experience.
        </p>
      </Section>

      {/* Service Block 1 */}
      <div className="bg-gray-100 border-y border-black/5 py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <span className="p-3 bg-white text-black inline-block mb-8">
              <Music size={24} />
            </span>
            <h2 className="text-5xl font-display mb-8">MUSIC & LABEL<br/>MANAGEMENT</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              We provide 360-degree artist management solutions, including branding, distribution, music production, and legal support. Our goal is to let artists focus on their craft while we handle the business.
            </p>
            <ul className="space-y-4 text-gray-600 font-semibold uppercase tracking-widest text-xs">
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> A&R and Talent Discovery</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Global Distribution & Publishing</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> PR & Marketing Strategies</li>
            </ul>
          </div>
          <img src="https://picsum.photos/seed/serv1/800/800" className="w-full grayscale" alt="Service 1" />
        </div>
      </div>

      {/* Service Block 2 */}
      <div className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <img src="https://picsum.photos/seed/serv2/800/800" className="w-full grayscale order-2 md:order-1" alt="Service 2" />
          <div className="order-1 md:order-2">
            <span className="p-3 bg-white text-black inline-block mb-8">
              <Mic2 size={24} />
            </span>
            <h2 className="text-5xl font-display mb-8">LIVE & EVENT<br/>ORGANIZATION</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Immersive, high-production events that leave lasting impressions. From stadium tours to underground pop-up shows, our production team handles everything from staging to safety.
            </p>
            <ul className="space-y-4 text-gray-600 font-semibold uppercase tracking-widest text-xs">
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Stage & Lighting Design</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Tour Booking & Management</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Technical Production Logistics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Service Block 3 */}
      <div className="bg-gray-100 border-y border-black/5 py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <span className="p-3 bg-white text-black inline-block mb-8">
              <Target size={24} />
            </span>
            <h2 className="text-5xl font-display mb-8">CREATIVE & BRAND<br/>ACTIVATION</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Bridging the gap between corporate brands and artistic integrity. We develop custom campaigns, collaborations, and partnerships that feel authentic and drive engagement.
            </p>
            <ul className="space-y-4 text-gray-600 font-semibold uppercase tracking-widest text-xs">
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Cross-Industry Partnerships</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Content Production & Storytelling</li>
              <li className="flex items-center gap-3"><Star size={14} className="text-black"/> Brand Identity & Positioning</li>
            </ul>
          </div>
          <img src="https://picsum.photos/seed/serv3/800/800" className="w-full grayscale" alt="Service 3" />
        </div>
      </div>

      <Section className="py-40">
        <h2 className="text-xs uppercase tracking-[0.5em] text-gray-600 font-bold mb-16 text-center">WHO WE COLLABORATE WITH</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-gray-600 font-display text-4xl">
           <span className="hover:text-black transition-colors cursor-default">ARTISTS</span>
           <span className="hover:text-black transition-colors cursor-default">BRANDS</span>
           <span className="hover:text-black transition-colors cursor-default">MEDIA</span>
           <span className="hover:text-black transition-colors cursor-default">VENUES</span>
        </div>
      </Section>
    </div>
  );
};

export default Services;
