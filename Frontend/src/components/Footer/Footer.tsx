import React from 'react';
import { Heart, Instagram, Linkedin, Twitter, Shield, Star, Users ,Lock,Verified,FocusIcon} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white relative">
        <br/>
      {/* Decorative Emojis */}
      <div className="absolute left-10 top-10 text-4xl opacity-20 transform skew-y-12">
        💕
      </div>
      <div className="absolute right-10 top-20 text-2xl opacity-20 transform -skew-y-12">
        ✨
      </div>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Top Section with Stats */}
        <div className="text-center mb-16">
          <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              The premier college dating platform
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              connecting students across India
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-12 max-w-3xl mx-auto">
            Find your perfect study partner, best friend, or soulmate.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-400">
              <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
                1.6K+
              </div>
              <div className="text-white/60 text-sm">
                Students
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-400">
              <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
                32+
              </div>
              <div className="text-white/60 text-sm">
                Colleges
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-400">
              <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
                643+
              </div>
              <div className="text-white/60 text-sm">
                Matches Made
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-400">
              <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
                4.9/5
              </div>
              <div className="text-white/60 text-sm">
                Rating
              </div>
            </div>
          </div>
        </div>
        {/* Links Grid */}

        {/* White thin horizontal line */}
        <div className="w-full h-px bg-white/20 mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Platform */}
          <div className="backdrop-blur-md ">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Platform</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">How it Works</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Safety</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Success Stories</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="backdrop-blur-md ">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact Us</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>

          {/* Community */}
          <div className="backdrop-blur-md ">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Community</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">College Partners</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Campus Events</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Student Discounts</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Referral Program</a></li>
            </ul>
          </div>

          {/* Follow Our Journey */}
          <div className="backdrop-blur-md ">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Follow Our Journey</h3>
            <p className="text-white/60 mb-4 text-sm">
              Stay updated with the latest features, success stories, and college events
            </p>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2 text-white/60 hover:text-pink-400 hover:bg-white/20 transition-all">
                <Instagram size={16} />
              </a>
              <a href="#" className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2 text-white/60 hover:text-blue-400 hover:bg-white/20 transition-all">
                <Linkedin size={16} />
              </a>
              <a href="#" className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2 text-white/60 hover:text-blue-400 hover:bg-white/20 transition-all">
                <Twitter size={16} />
              </a>
            </div>
            <div className="text-sm text-white/40">
              <div>@happyheads</div>
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 mb-12">
          <div className="flex flex-wrap justify-center items-center gap-6">
            <div className="flex items-center space-x-2">
              <div><Verified/></div>

              <span className="text-sm text-white/60">Verified Profiles</span>
            </div>
            <div className="flex items-center space-x-2">
              <div><Lock/></div>
              <span className="text-sm text-white/60">Secure Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <FocusIcon/>
              <span className="text-sm text-white/60">College Focused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex justify-between items-center mb-6">
 <div className="text-center pb-10">
            <p className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent font-medium text-lg">
              Matches are meant to meet. ✨
            </p>
          </div>
            <div className="text-white/40 text-sm">
              © 2024 HappyHeads. All rights reserved.
          </div>
          </div>
         
        </div>
      </div>
      <br />
    </footer>
  );
};

export default Footer;