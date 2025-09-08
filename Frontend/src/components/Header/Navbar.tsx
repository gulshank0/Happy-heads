import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const useGoogleCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        // Store token in localStorage or context
        localStorage.setItem("authToken", token);

        // Clear URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        // Redirect to dashboard or home
        navigate("/dashboard");
      }
    }, [navigate]);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };
  useGoogleCallback();
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b backdrop-blur-md ${
        scrolled
          ? "bg-black/70 border-white/10 shadow-lg"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Happy Heads
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#home"
                className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                About
              </a>
              <a
                href="#services"
                className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                Services
              </a>
              <a
                href="#contact"
                className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              className="flex items-center space-x-2 text-white/70 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/20 backdrop-blur-md"
              onClick={handleGoogleLogin}
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 py-2 text-sm font-medium rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:scale-105" onClick={useGoogleCallback}>
              <User size={16} />
              <span>Sign Up</span>
            </button> </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-lg mt-2 shadow-lg">
            <a
              href="#home"
              className="block text-white/70 hover:text-white px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#about"
              className="block text-white/70 hover:text-white px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a
              href="#services"
              className="block text-white/70 hover:text-white px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#contact"
              className="block text-white/70 hover:text-white px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 space-y-2">
              <button
                className="w-full flex items-center justify-center space-x-2 text-white/70 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/20"
                onClick={handleGoogleLogin}
              >
                <LogIn size={16} />
                <span>Login</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 py-2 text-sm font-medium rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-pink-500/25">
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

