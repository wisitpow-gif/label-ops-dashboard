
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Facebook, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-black/10 py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="mb-6">
            <h2 className="text-3xl font-display tracking-tighter text-black">ครึ่งเก้า (Krueng Kao)</h2>
            <p className="text-[10px] tracking-[0.3em] text-gray-600 font-bold uppercase mt-1">HOLDING GROUP</p>
          </div>
          <p className="text-gray-600 max-w-sm leading-relaxed">
            We shape music and culture through strategic artist development, high-end live experiences, and creative brand storytelling.
          </p>
          <div className="flex space-x-6 mt-8">
            <Instagram className="cursor-pointer hover:text-gray-600 transition-colors" />
            <Youtube className="cursor-pointer hover:text-gray-600 transition-colors" />
            <Facebook className="cursor-pointer hover:text-gray-600 transition-colors" />
            <Twitter className="cursor-pointer hover:text-gray-600 transition-colors" />
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-gray-600">Navigation</h3>
          <ul className="space-y-4 text-sm font-semibold">
            <li><Link to="/about" className="hover:text-gray-600">About Us</Link></li>
            <li><Link to="/labels" className="hover:text-gray-600">Our Labels</Link></li>
            <li><Link to="/services" className="hover:text-gray-600">Services</Link></li>
            <li><Link to="/works" className="hover:text-gray-600">Selected Works</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-gray-600">Get in Touch</h3>
          <ul className="space-y-4 text-sm font-semibold">
            <li className="text-gray-600">General Inquiry: hello@kruengkao.com</li>
            <li className="text-gray-600">Artist Demo: demo@kruengkao.com</li>
            <li className="text-gray-600">Media: pr@kruengkao.com</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-black/5 flex flex-col md:row items-center justify-between text-xs text-gray-600 uppercase tracking-widest">
        <p>&copy; 2024 ครึ่งเก้า (Krueng Kao). All rights reserved.</p>
        <div className="flex space-x-8 mt-4 md:mt-0">
          <span className="cursor-pointer hover:text-black">Privacy Policy</span>
          <span className="cursor-pointer hover:text-black">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
