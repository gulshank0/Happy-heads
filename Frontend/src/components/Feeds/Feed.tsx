import React, { useState } from 'react';
import { Heart, X, Filter } from 'lucide-react';





export default function Feed() {
    const mockProfiles = [
        {
            name: 'Alice Johnson',
            age: 28,
            location: 'New York, NY',
            bio: 'Lover of art, music, and outdoor adventures. Always up for trying new things!',
            interests: ['Hiking', 'Photography', 'Traveling', 'Cooking'],
            photo: 'https://randomuser.me/api/portraits/women/1.jpg' // Complete the photo URL
        },
        {
            id: "2",
            name: "James Rodriguez",
            age: 29,
            photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
            interests: ["Music", "Travel", "Cooking"],
            bio: "Musician who loves to explore new places",
            location: "3 miles away"
          },
          {
            id: "3",
            name: "Sophia Kim",
            age: 24,
            photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
            interests: ["Art", "Yoga", "Reading"],
            bio: "Artist finding beauty in everyday moments",
            location: "1 mile away"
          },
          {
            id: "4",
            name: "Michael Torres",
            age: 31,
            photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
            interests: ["Fitness", "Movies", "Dogs"],
            bio: "Fitness enthusiast and dog lover",
            location: "4 miles away"
          }
    
    ];  
    const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
    
    const currentProfile = mockProfiles[currentProfileIndex];
    
    const handleLike = () => {
        if (currentProfileIndex < mockProfiles.length - 1) {
            setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
            alert('No more profiles to show!');
        }
    };
    
    const handlePass = () => {
        if (currentProfileIndex < mockProfiles.length - 1) {
            setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
            alert('No more profiles to show!');
        }
    };
    return (
        <div className="p-4">
        
        <div className="max-w-md mx-auto">
              
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Discover People
                  </span>
                </h1>
                <button className="p-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                  <Filter className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              <div className="relative">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 shadow-2xl">
                  <div className="relative">
                    <img
                      src={currentProfile.photo}
                      alt={currentProfile.name}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">
                          {currentProfile.name}
                          {currentProfile.age && <span className="text-white/80">, {currentProfile.age}</span>}
                        </h2>
                        {currentProfile.location && (
                          <span className="text-sm text-white/60 bg-white/20 px-2 py-1 rounded-full">
                            {currentProfile.location}
                          </span>
                        )}
                      </div>
                      <p className="text-white/90 mb-3">{currentProfile.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-white text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
 
                <div className="flex justify-center space-x-6 mt-8">
                  <button
                    onClick={handlePass}
                    className="w-16 h-16 backdrop-blur-md bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group"
                  >
                    <X className="w-8 h-8 text-white/70 group-hover:text-red-400 transition-colors" />
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-16 h-16 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </button>
                </div>
 
                <div className="text-center mt-6">
                  <p className="text-white/60 text-sm">
                    {mockProfiles.length - currentProfileIndex - 1} more profiles to discover
                  </p>
                </div>
              </div>
            </div>




        </div>
    );
    }