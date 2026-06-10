
import React, { useState, useEffect } from 'react';
import logo from '../images/Kruengkao_Logo_Black.png';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', path: '/about' },
    { name: 'Labels', path: '/labels' },
    { name: 'Services', path: '/services' },
    { name: 'Works', path: '/works' },
    { name: 'News', path: '/news' },
    { name: 'Contact', path: '/contact' },
  ];


  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md py-4 shadow-lg border-b border-black/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 group">
          {/* Logo container using the actual image provided */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
              <img
                src={logo}
                alt="Krueng Kao Logo"
                className="w-full h-full object-contain filter brightness-100"
              />
            </div>
            
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[11px] uppercase tracking-[0.2em] font-bold hover:text-black transition-all duration-300 relative group/link ${location.pathname === link.path ? 'text-black' : 'text-gray-600'}`}
            >
              {link.name}
              <span className={`absolute -bottom-2 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover/link:w-full ${location.pathname === link.path ? 'w-full' : ''}`}></span>
            </Link>
          ))}
        </div>

        {/* Mobile Nav Button */}
        <button className="md:hidden text-black p-2 hover:bg-black/10 rounded-full transition-colors" aria-label="Toggle Menu" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 w-full h-screen bg-white flex flex-col items-center justify-center space-y-10 z-40">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-5xl font-display tracking-[0.1em] text-black hover:text-gray-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <button className="absolute top-8 right-8 text-black p-2 hover:bg-black/10 rounded-full transition-colors" aria-label="Close Menu" onClick={() => setIsOpen(false)}>
            <X size={36} />
          </button>
          
          <div className="absolute bottom-12 flex flex-col items-center gap-4">
             <div className="w-12 h-[1px] bg-black/20"></div>
             <span className="text-[10px] tracking-[0.5em] text-gray-400 uppercase font-bold">KRUENG KΛO CREATIVE TEΛM</span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
