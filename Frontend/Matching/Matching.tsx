import React, { useState, useEffect } from 'react';
import { Heart, Star, MapPin, GraduationCap, Calendar, User, Eye, EyeOff, ArrowLeft, Settings } from 'lucide-react';

// Types and Interfaces (move these to the top)
interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  college: string;
  major: string;
  year: number;
  bio: string;
  avatar: string;
  location: { latitude: number; longitude: number } | null;
  interests: string[];
}

interface MatchResult {
  user: UserProfile;
  score: number;
  breakdown: {
    ageCompatibility: number;
    distanceScore: number;
    interestSimilarity: number;
    collegeCompatibility: number;
    majorCompatibility: number;
    yearCompatibility: number;
    personalityCompatibility: number;
    totalScore: number;
  };
}

interface UserPreferences {
  minAge: number;
  maxAge: number;
  preferredGenders: string[];
  maxDistance: number;
  collegePreference: string;
  majorPreference: string;
  minYear: number;
  maxYear: number;
  ageWeight: number;
  distanceWeight: number;
  interestsWeight: number;
  collegeWeight: number;
  majorWeight: number;
  yearWeight: number;
  personalityWeight: number;
}

const Matching: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<{ [key: string]: boolean }>({});
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    minAge: 18,
    maxAge: 35,
    preferredGenders: ['male', 'female'],
    maxDistance: 50,
    collegePreference: 'any',
    majorPreference: 'any',
    minYear: 1,
    maxYear: 4,
    ageWeight: 0.15,
    distanceWeight: 0.10,
    interestsWeight: 0.25,
    collegeWeight: 0.10,
    majorWeight: 0.15,
    yearWeight: 0.10,
    personalityWeight: 0.15
  });

  // Check authentication and load user data
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          loadUserPreferences();
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/matching/preferences', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleFindMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/matching/matches?limit=10', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to find matches');
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeUser = async (targetUserId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/matching/like', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isMatch) {
          alert("🎉 It's a Match! You can now start chatting!");
        } else {
          alert("Like sent! 💖");
        }
        
        // Remove the liked user from matches
        setMatches(prev => prev.filter(match => match.user.id !== targetUserId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to like user');
      }
    } catch (error) {
      console.error('Error liking user:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/matching/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        alert('Preferences updated successfully!');
        setShowPreferences(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Network error. Please try again.');
    }
  };

  const toggleBreakdown = (userId: string) => {
    setShowBreakdown(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    if (score >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-pink-500';
  };

  const renderScoreBreakdown = (breakdown: MatchResult['breakdown']) => (
    <div className="mt-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
      <h4 className="font-semibold text-white mb-4 flex items-center">
        <Star className="h-5 w-5 mr-2 text-violet-400" />
        Compatibility Breakdown
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Age</div>
          <div className="text-lg font-bold text-white">{breakdown.ageCompatibility.toFixed(1)}%</div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Distance</div>
          <div className="text-lg font-bold text-white">{breakdown.distanceScore.toFixed(1)}%</div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Interests</div>
          <div className="text-lg font-bold text-white">{breakdown.interestSimilarity.toFixed(1)}%</div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Personality</div>
          <div className="text-lg font-bold text-white">{breakdown.personalityCompatibility.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to find matches</h2>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="inline-block bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full px-6 py-2 text-sm font-medium text-pink-300">
              💕 Smart Matching Algorithm
            </span>
            <button
              onClick={() => setShowPreferences(true)}
              className="inline-flex items-center px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </button>
          </div>
          
          <h1 className="font-poppins text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Your Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              College Matches
            </span>
          </h1>

          <p className="text-lg sm:text-xl leading-8 mb-8 text-white/70 max-w-3xl mx-auto">
            Discover meaningful connections with our advanced compatibility algorithm.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent font-semibold">
              Where campus hearts find their perfect match.
            </span>
          </p>
        </div>

        {/* Find Matches Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleFindMatches}
            disabled={loading}
            className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:from-violet-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg shadow-violet-500/25"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding Your Perfect Matches...
              </span>
            ) : (
              <>
                <Heart className="inline h-5 w-5 mr-2" />
                Find My Matches
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center mb-8">
            <div className="inline-block bg-red-500/20 border border-red-500/30 rounded-xl px-6 py-4 text-red-200">
              {error}
            </div>
          </div>
        )}

        {/* Matches Results */}
        {matches.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Your Top Matches ✨
              </span>
            </h2>
            
            <div className="space-y-8">
              {matches.map((match, index) => (
                <div
                  key={match.user.id}
                  className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-8">
                    {/* Match Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden">
                            {match.user.avatar ? (
                              <img 
                                src={match.user.avatar} 
                                alt={match.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl text-white font-bold">
                                {match.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            #{index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">{match.user.name}</h3>
                          <div className="flex flex-wrap gap-4 text-white/60 mb-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {match.user.age} years old
                            </div>
                            <div className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1" />
                              {match.user.college}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {match.user.major} • Year {match.user.year}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center px-6 py-3 rounded-full text-white font-bold text-xl bg-gradient-to-r ${getScoreColor(match.score)} shadow-lg`}>
                          {match.score.toFixed(1)}%
                        </div>
                        <p className="text-sm text-white/60 mt-2">Match Score</p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-white/80 leading-relaxed text-lg">{match.user.bio}</p>
                    </div>

                    {/* Interests */}
                    <div className="mb-6">
                      <span className="text-white/60 font-medium mb-3 block">Interests:</span>
                      <div className="flex flex-wrap gap-3">
                        {match.user.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 text-sm rounded-full border transition-all duration-200 backdrop-blur-md bg-white/5 border-white/20 text-white/60"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => toggleBreakdown(match.user.id)}
                        className="text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200 flex items-center backdrop-blur-md bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-lg"
                      >
                        {showBreakdown[match.user.id] ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </>
                        )}
                      </button>
                      
                      <div className="space-x-4">
                        <button className="px-6 py-3 backdrop-blur-md bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 shadow-lg shadow-red-500/10">
                          ❌ Pass
                        </button>
                        <button 
                          onClick={() => handleLikeUser(match.user.id)}
                          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:scale-105"
                        >
                          💕 Like
                        </button>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {showBreakdown[match.user.id] && renderScoreBreakdown(match.breakdown)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Modal */}
        {showPreferences && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Matching Preferences</h3>
              
              {/* Age Range */}
              <div className="mb-6">
                <label className="block text-white/80 font-medium mb-2">Age Range</label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={preferences.minAge}
                    onChange={(e) => setPreferences(prev => ({ ...prev, minAge: parseInt(e.target.value) }))}
                    className="flex-1 px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
                    min="18"
                    max="100"
                  />
                  <span className="text-white/60 py-2">to</span>
                  <input
                    type="number"
                    value={preferences.maxAge}
                    onChange={(e) => setPreferences(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))}
                    className="flex-1 px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
                    min="18"
                    max="100"
                  />
                </div>
              </div>

              {/* Gender Preferences */}
              <div className="mb-6">
                <label className="block text-white/80 font-medium mb-2">Interested in</label>
                <div className="flex gap-4">
                  {['male', 'female', 'other'].map(gender => (
                    <label key={gender} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.preferredGenders.includes(gender)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences(prev => ({ 
                              ...prev, 
                              preferredGenders: [...prev.preferredGenders, gender] 
                            }));
                          } else {
                            setPreferences(prev => ({ 
                              ...prev, 
                              preferredGenders: prev.preferredGenders.filter(g => g !== gender) 
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-white capitalize">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Distance */}
              <div className="mb-6">
                <label className="block text-white/80 font-medium mb-2">
                  Maximum Distance: {preferences.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={preferences.maxDistance}
                  onChange={(e) => setPreferences(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* College Preference */}
              <div className="mb-6">
                <label className="block text-white/80 font-medium mb-2">College Preference</label>
                <select
                  value={preferences.collegePreference}
                  onChange={(e) => setPreferences(prev => ({ ...prev, collegePreference: e.target.value }))}
                  className="w-full px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="any" className="bg-gray-800">Any College</option>
                  <option value="same" className="bg-gray-800">Same College</option>
                  <option value="different" className="bg-gray-800">Different College</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-6 py-3 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePreferences}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matching;