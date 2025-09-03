import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg' 
        : 'bg-white/60 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Happy Heads
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a 
                href="#home" 
                className="text-gray-800 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/50 rounded-lg"
              >
                Home
              </a>
              <a 
                href="#about" 
                className="text-gray-800 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/50 rounded-lg"
              >
                About
              </a>
              <a 
                href="#services" 
                className="text-gray-800 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/50 rounded-lg"
              >
                Services
              </a>
              <a 
                href="#contact" 
                className="text-gray-800 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/50 rounded-lg"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/50 rounded-lg border border-transparent hover:border-blue-200">
              <LogIn size={16} />
              <span>Login</span>
            </button>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <User size={16} />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-lg rounded-lg mt-2 border border-white/20 shadow-lg">
            <a 
              href="#home" 
              className="block text-gray-800 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/70 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a 
              href="#about" 
              className="block text-gray-800 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/70 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a 
              href="#services" 
              className="block text-gray-800 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/70 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a 
              href="#contact" 
              className="block text-gray-800 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/70 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            
            {/* Mobile Auth Buttons */}
            <div className="pt-4 space-y-2">
              <button className="w-full flex items-center justify-center space-x-2 text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/70 rounded-lg border border-gray-200">
                <LogIn size={16} />
                <span>Login</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
                <User size={16} />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;