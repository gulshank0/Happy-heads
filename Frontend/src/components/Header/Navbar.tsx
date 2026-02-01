import { BACKEND_URL } from '../../config/env';

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, LogOut } from "lucide-react";
import OptimizedAvatar from '../ui/OptimizedAvatar';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            // Store user data in localStorage for persistence
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            setUser(null);
            localStorage.removeItem("user");
          }
        } else {
          // Response is not JSON, likely an HTML error page
          console.warn('Backend returned non-JSON response. Server might not be running or endpoint not found.');
          console.warn('Response status:', response.status);
          console.warn('Content-Type:', contentType);
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        console.warn(`Auth check failed with status: ${response.status}`);
        // Try to read the response as text to see what we got
        try {
          const text = await response.text();
          if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            console.warn('Received HTML response instead of JSON. Backend server may not be running properly.');
          } else {
            console.warn('Response body:', text.substring(0, 200));
          }
        } catch (textError) {
          console.warn('Could not read response body');
        }
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      
      // More specific error messaging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error: Unable to connect to backend server.');
        console.warn('Make sure the backend server is running at:', BACKEND_URL);
      } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.warn('Received invalid JSON response. Backend may be returning HTML error page.');
        console.warn('This usually means the backend server is not running or the endpoint is not found.');
      }
      
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on component mount and after login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");

    if (success === "true") {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Check auth status after successful login
      setTimeout(() => {
        checkAuthStatus();
      }, 500);
      
      // Navigate to profile
      navigate("/home");
    } else {
      // Check auth status on component mount
      checkAuthStatus();
    }
  }, [navigate]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGoogleLogin = () => {
    console.log('Backend URL:', BACKEND_URL); // Add this line for debugging
    window.location.href = `${BACKEND_URL}/auth/google`;
  };
  
  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      const response = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Server logout successful');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear client-side data
    localStorage.removeItem("user");
    setUser(null);
    
    // Navigate to home
    navigate("/");
    
    // Optional: reload to clear any cached data
    window.location.reload();
  };

  const isLoggedIn = user !== null;

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
            <h1 className="text-2xl font-bold text-blue-400 font-bold hover:cursor-pointer" onClick={() => navigate('/')}>
              Happy Heads
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="/home"
                className="text-white/70 hover:text-white px-3 py-2 text-xl font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                Home
              </a>
              
                           <a
                href="#contact"
                className="text-white/70 hover:text-white px-3 py-2 text-xl font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                Contact
              </a>
              {isLoggedIn && (
                <a
                  href="/profile"
                  className="text-white/70 hover:text-white px-3 py-2 text-xl font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                >
                  Profile
                </a>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="text-white/70 text-sm">Loading...</div>
            ) : isLoggedIn ? (
              <>
                <div className="flex items-center space-x-3 text-white/70 text-xl">
                  <span>Hi, {user?.name || user?.email?.split('@')[0] || "User"}</span>
                  <OptimizedAvatar 
                    src={user?.avatar} 
                    alt="User Avatar" 
                    fallbackText={user?.name || user?.email?.split('@')[0] || "U"}
                    size="sm"
                    className="cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all duration-200"
                    lazy={false}
                  />
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white/70 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/20"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 text-sm font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <LogIn size={16} />
                <span>Login with Google</span>
              </button>
            )}
          </div>

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
              href="/"
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
            {isLoggedIn && (
              <a
                href="/profile"
                className="block text-white/70 hover:text-white px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </a>
            )}

            {/* Mobile Auth Buttons */}
            <div className="pt-4 space-y-2">
              {isLoading ? (
                <div className="text-white/70 text-sm text-center">Loading...</div>
              ) : isLoggedIn ? (
                <>
                  <div className="text-white/70 text-sm text-center pb-2">
                    Hi, {user?.name || user?.email?.split('@')[0] || "User"}!
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 text-white/70 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/20"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-6 py-2 text-sm font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/25"
                  onClick={handleGoogleLogin}
                >
                  <LogIn size={16} />
                  <span>Login with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

