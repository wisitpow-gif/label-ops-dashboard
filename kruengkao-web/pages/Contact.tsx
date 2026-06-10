
import React from 'react';
import Section from '../components/Section';
import { Mail, MapPin, Instagram, Youtube, Linkedin, ArrowRight } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="pt-20">
      <Section className="py-40 border-b border-black/10">
        <h1 className="text-7xl md:text-[12rem] font-display tracking-tighter uppercase mb-12">Let's <br/> Create</h1>
        <p className="text-xl md:text-4xl text-gray-600 max-w-3xl leading-tight font-light italic">
          "The biggest cultural shifts start with a single conversation. Whether you’re a brand, an artist, or a visionary, we’re ready to talk."
        </p>
      </Section>

      <Section className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div className="space-y-12">
          <h2 className="text-xs uppercase tracking-[0.5em] text-gray-600 font-bold">CONTACT PATHS</h2>
          
          <div className="group cursor-pointer border-b border-black/10 pb-8">
            <h3 className="text-3xl font-display mb-2 flex items-center justify-between group-hover:text-gray-600 transition-colors">
              Business & Partnerships <ArrowRight className="group-hover:translate-x-4 transition-transform"/>
            </h3>
            <p className="text-gray-600 text-sm">Collaborate on large-scale creative projects or brand activations.</p>
          </div>

          <div className="group cursor-pointer border-b border-black/10 pb-8">
            <h3 className="text-3xl font-display mb-2 flex items-center justify-between group-hover:text-gray-600 transition-colors">
              Event & Production <ArrowRight className="group-hover:translate-x-4 transition-transform"/>
            </h3>
            <p className="text-gray-600 text-sm">Inquiry for live organization, booking, and technical support.</p>
          </div>

          <div className="group cursor-pointer border-b border-black/10 pb-8">
            <h3 className="text-3xl font-display mb-2 flex items-center justify-between group-hover:text-gray-600 transition-colors">
              Artist Demo Submission <ArrowRight className="group-hover:translate-x-4 transition-transform"/>
            </h3>
            <p className="text-gray-600 text-sm">Send us your sound. We are always looking for authentic voices.</p>
          </div>

          <div className="group cursor-pointer border-b border-black/10 pb-8">
            <h3 className="text-3xl font-display mb-2 flex items-center justify-between group-hover:text-gray-600 transition-colors">
              Media & Press <ArrowRight className="group-hover:translate-x-4 transition-transform"/>
            </h3>
            <p className="text-gray-600 text-sm">Official statements, press kits, and media interviews.</p>
          </div>
        </div>

        <div className="bg-gray-100 p-12 md:p-20 border border-black/5">
           <h2 className="text-3xl font-display mb-12 uppercase">Send a Message</h2>
           <form className="space-y-8">
             <div className="grid grid-cols-2 gap-8">
               <input type="text" placeholder="Full Name" className="w-full bg-transparent border-b border-black/20 pb-4 outline-none focus:border-black transition-colors text-sm font-semibold uppercase tracking-widest" />
               <input type="email" placeholder="Email Address" className="w-full bg-transparent border-b border-black/20 pb-4 outline-none focus:border-black transition-colors text-sm font-semibold uppercase tracking-widest" />
             </div>
             <input type="text" placeholder="Subject" className="w-full bg-transparent border-b border-black/20 pb-4 outline-none focus:border-black transition-colors text-sm font-semibold uppercase tracking-widest" />
             <textarea placeholder="Tell us about your project..." rows={6} className="w-full bg-transparent border-b border-black/20 pb-4 outline-none focus:border-black transition-colors text-sm font-semibold uppercase tracking-widest resize-none" />
             <button type="button" className="w-full py-6 bg-white text-black font-bold uppercase tracking-[0.3em] hover:bg-gray-200 transition-all">
               Dispatch Inquiry
             </button>
           </form>
        </div>
      </Section>

      <Section className="bg-gray-50 py-20 border-t border-black/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
           <div>
             <div className="flex items-center justify-center md:justify-start gap-4 mb-6 text-gray-600 uppercase tracking-widest text-xs font-bold">
               <MapPin size={16}/> Headquarters
             </div>
             <p className="text-xl font-display text-gray-600">
               19th Floor, Creative Tower,<br/>
               Sukhumvit, Bangkok, Thailand
             </p>
           </div>
           <div>
             <div className="flex items-center justify-center md:justify-start gap-4 mb-6 text-gray-600 uppercase tracking-widest text-xs font-bold">
               <Mail size={16}/> Direct Contact
             </div>
             <p className="text-xl font-display text-gray-600">
               hello@kruengkao.com<br/>
               +66 2 345 6789
             </p>
           </div>
           <div>
             <div className="flex items-center justify-center md:justify-start gap-4 mb-6 text-gray-600 uppercase tracking-widest text-xs font-bold">
               Digital Network
             </div>
             <div className="flex justify-center md:justify-start gap-6 text-gray-600">
                <Instagram size={24} className="hover:text-black transition-colors cursor-pointer"/>
                <Youtube size={24} className="hover:text-black transition-colors cursor-pointer"/>
                <Linkedin size={24} className="hover:text-black transition-colors cursor-pointer"/>
             </div>
           </div>
        </div>
      </Section>
    </div>
  );
};

export default Contact;
