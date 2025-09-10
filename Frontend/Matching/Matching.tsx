import React, { useState, useEffect } from 'react';
import { Heart, Star, MapPin, GraduationCap, Calendar, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

// Types and Interfaces (move these to the top)
interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  college: string;
  major: string;
  year: number;
  bio: string;
  profilePicture: string;
  location: {
    latitude: number;
    longitude: number;
  };
  interests: string[];
  preferences: UserPreferences;
  personality: PersonalityTraits;
}

interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  preferredGenders: ('male' | 'female' | 'other')[];
  maxDistance: number; // in kilometers
  collegePreference: 'same' | 'different' | 'any';
  majorPreference: 'same' | 'different' | 'any';
  yearPreference: {
    min: number;
    max: number;
  };
  importanceWeights: {
    age: number;
    distance: number;
    interests: number;
    college: number;
    major: number;
    year: number;
    personality: number;
  };
}

interface PersonalityTraits {
  extroversion: number; // 1-10
  openness: number;     // 1-10
  conscientiousness: number; // 1-10
  agreeableness: number;     // 1-10
  neuroticism: number;       // 1-10
}

interface MatchResult {
  user: UserProfile;
  score: number;
  breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  ageCompatibility: number;
  distanceScore: number;
  interestSimilarity: number;
  collegeCompatibility: number;
  majorCompatibility: number;
  yearCompatibility: number;
  personalityCompatibility: number;
  totalScore: number;
}

// Matching Algorithm Class (keep this outside the component)
class MatchingAlgorithm {
  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate age compatibility score
  private calculateAgeCompatibility(userAge: number, candidateAge: number, preferences: UserPreferences): number {
    if (candidateAge < preferences.ageRange.min || candidateAge > preferences.ageRange.max) {
      return 0;
    }
    
    const idealAge = (preferences.ageRange.min + preferences.ageRange.max) / 2;
    const ageDifference = Math.abs(candidateAge - idealAge);
    const maxDifference = Math.max(
      Math.abs(preferences.ageRange.min - idealAge),
      Math.abs(preferences.ageRange.max - idealAge)
    );
    
    return Math.max(0, 100 - (ageDifference / maxDifference) * 100);
  }

  // Calculate distance compatibility score
  private calculateDistanceScore(user: UserProfile, candidate: UserProfile): number {
    const distance = this.calculateDistance(
      user.location.latitude,
      user.location.longitude,
      candidate.location.latitude,
      candidate.location.longitude
    );

    if (distance > user.preferences.maxDistance) {
      return 0;
    }

    return Math.max(0, 100 - (distance / user.preferences.maxDistance) * 100);
  }

  // Calculate interest similarity using Jaccard similarity
  private calculateInterestSimilarity(userInterests: string[], candidateInterests: string[]): number {
    const userSet = new Set(userInterests.map(interest => interest.toLowerCase()));
    const candidateSet = new Set(candidateInterests.map(interest => interest.toLowerCase()));
    
    const intersection = new Set([...userSet].filter(x => candidateSet.has(x)));
    const union = new Set([...userSet, ...candidateSet]);
    
    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100;
  }

  // Calculate college compatibility
  private calculateCollegeCompatibility(user: UserProfile, candidate: UserProfile): number {
    const preference = user.preferences.collegePreference;
    const sameCollege = user.college === candidate.college;

    switch (preference) {
      case 'same':
        return sameCollege ? 100 : 0;
      case 'different':
        return sameCollege ? 0 : 100;
      case 'any':
        return sameCollege ? 100 : 80; // Slight preference for same college
      default:
        return 50;
    }
  }

  // Calculate major compatibility
  private calculateMajorCompatibility(user: UserProfile, candidate: UserProfile): number {
    const preference = user.preferences.majorPreference;
    const sameMajor = user.major === candidate.major;

    switch (preference) {
      case 'same':
        return sameMajor ? 100 : 0;
      case 'different':
        return sameMajor ? 0 : 100;
      case 'any':
        return sameMajor ? 100 : 85; // Slight preference for same major
      default:
        return 50;
    }
  }

  // Calculate year compatibility
  private calculateYearCompatibility(user: UserProfile, candidate: UserProfile): number {
    const candidateYear = candidate.year;
    const preferences = user.preferences.yearPreference;

    if (candidateYear < preferences.min || candidateYear > preferences.max) {
      return 0;
    }

    const yearDifference = Math.abs(user.year - candidateYear);
    return Math.max(0, 100 - (yearDifference * 20)); // 20 points deduction per year difference
  }

  // Calculate personality compatibility using Euclidean distance
  private calculatePersonalityCompatibility(userPersonality: PersonalityTraits, candidatePersonality: PersonalityTraits): number {
    const traits = ['extroversion', 'openness', 'conscientiousness', 'agreeableness', 'neuroticism'] as const;
    
    let sumSquaredDifferences = 0;
    traits.forEach(trait => {
      const difference = userPersonality[trait] - candidatePersonality[trait];
      sumSquaredDifferences += difference * difference;
    });

    const euclideanDistance = Math.sqrt(sumSquaredDifferences);
    const maxDistance = Math.sqrt(5 * 81); // Maximum possible distance (9^2 * 5 traits)
    
    return Math.max(0, 100 - (euclideanDistance / maxDistance) * 100);
  }

  // Main matching function
  public findMatches(user: UserProfile, candidates: UserProfile[], limit: number = 10): MatchResult[] {
    const matches: MatchResult[] = [];

    candidates.forEach(candidate => {
      // Skip if same user or gender preference doesn't match
      if (candidate.id === user.id || !user.preferences.preferredGenders.includes(candidate.gender)) {
        return;
      }

      // Calculate individual scores
      const ageCompatibility = this.calculateAgeCompatibility(user.age, candidate.age, user.preferences);
      const distanceScore = this.calculateDistanceScore(user, candidate);
      const interestSimilarity = this.calculateInterestSimilarity(user.interests, candidate.interests);
      const collegeCompatibility = this.calculateCollegeCompatibility(user, candidate);
      const majorCompatibility = this.calculateMajorCompatibility(user, candidate);
      const yearCompatibility = this.calculateYearCompatibility(user, candidate);
      const personalityCompatibility = this.calculatePersonalityCompatibility(user.personality, candidate.personality);

      // Apply weights and calculate total score
      const weights = user.preferences.importanceWeights;
      const totalScore = (
        (ageCompatibility * weights.age) +
        (distanceScore * weights.distance) +
        (interestSimilarity * weights.interests) +
        (collegeCompatibility * weights.college) +
        (majorCompatibility * weights.major) +
        (yearCompatibility * weights.year) +
        (personalityCompatibility * weights.personality)
      ) / (weights.age + weights.distance + weights.interests + weights.college + weights.major + weights.year + weights.personality);

      const breakdown: ScoreBreakdown = {
        ageCompatibility,
        distanceScore,
        interestSimilarity,
        collegeCompatibility,
        majorCompatibility,
        yearCompatibility,
        personalityCompatibility,
        totalScore
      };

      matches.push({
        user: candidate,
        score: totalScore,
        breakdown
      });
    });

    // Sort by score (descending) and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// React Component - Move all hooks inside here
const Matching: React.FC = () => {
  // Move all useState hooks inside the component
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState<{ [key: string]: boolean }>({});

  const matchingAlgorithm = new MatchingAlgorithm();

  // Helper functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    if (score >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-red-600';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/auth/me', { // Changed from /auth/me to /auth/status
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration
  const mockCurrentUser: UserProfile = {
    id: "user1",
    name: "Alice Johnson",
    age: 20,
    gender: "female",
    college: "Stanford University",
    major: "Computer Science",
    year: 3,
    bio: "Love coding and hiking! Looking for someone who shares similar interests and values. Always up for deep conversations and new adventures.",
    profilePicture: "/images/alice.jpg",
    location: { latitude: 37.4419, longitude: -122.1430 },
    interests: ["programming", "hiking", "movies", "coffee", "reading"],
    preferences: {
      ageRange: { min: 18, max: 25 },
      preferredGenders: ["male"],
      maxDistance: 50,
      collegePreference: "any",
      majorPreference: "any",
      yearPreference: { min: 2, max: 4 },
      importanceWeights: {
        age: 0.15,
        distance: 0.10,
        interests: 0.25,
        college: 0.10,
        major: 0.15,
        year: 0.10,
        personality: 0.15
      }
    },
    personality: {
      extroversion: 7,
      openness: 8,
      conscientiousness: 6,
      agreeableness: 7,
      neuroticism: 4
    }
  };

  const mockCandidates: UserProfile[] = [
    // ... your existing mock candidates data ...
    {
      id: "user2",
      name: "Bob Smith",
      age: 22,
      gender: "male",
      college: "Stanford University",
      major: "Computer Science",
      year: 4,
      bio: "Tech enthusiast and outdoor lover. Always up for new adventures and building cool projects!",
      profilePicture: "/images/bob.jpg",
      location: { latitude: 37.4449, longitude: -122.1610 },
      interests: ["programming", "basketball", "movies", "travel", "gaming"],
      preferences: {
        ageRange: { min: 18, max: 24 },
        preferredGenders: ["female"],
        maxDistance: 30,
        collegePreference: "same",
        majorPreference: "same",
        yearPreference: { min: 2, max: 4 },
        importanceWeights: {
          age: 0.10,
          distance: 0.15,
          interests: 0.20,
          college: 0.15,
          major: 0.20,
          year: 0.10,
          personality: 0.10
        }
      },
      personality: {
        extroversion: 8,
        openness: 7,
        conscientiousness: 7,
        agreeableness: 8,
        neuroticism: 3
      }
    }
    // Add other candidates here...
  ];

  // Effects
  useEffect(() => {
    checkAuthStatus();
    setCurrentUser(mockCurrentUser);
    setCandidates(mockCandidates);
  }, []);

  // Event handlers
  const handleFindMatches = () => {
    if (!currentUser) return;
    
    setLoading(true);
    setTimeout(() => {
      const foundMatches = matchingAlgorithm.findMatches(currentUser, candidates, 10);
      setMatches(foundMatches);
      setLoading(false);
    }, 1500);
  };

  const toggleBreakdown = (userId: string) => {
    setShowBreakdown(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const renderScoreBreakdown = (breakdown: ScoreBreakdown) => (
    <div className="mt-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
      <h4 className="font-semibold text-white mb-4 flex items-center">
        <Star className="h-5 w-5 mr-2 text-violet-400" />
        Compatibility Breakdown
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Age</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.ageCompatibility)}`}>
            {breakdown.ageCompatibility.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Distance</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.distanceScore)}`}>
            {breakdown.distanceScore.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Interests</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.interestSimilarity)}`}>
            {breakdown.interestSimilarity.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">College</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.collegeCompatibility)}`}>
            {breakdown.collegeCompatibility.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Major</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.majorCompatibility)}`}>
            {breakdown.majorCompatibility.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Year</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.yearCompatibility)}`}>
            {breakdown.yearCompatibility.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-sm text-white/60 mb-1">Personality</div>
          <div className={`font-bold text-lg ${getScoreTextColor(breakdown.personalityCompatibility)}`}>
            {breakdown.personalityCompatibility.toFixed(1)}%
          </div>
        </div>
        <div className="text-center backdrop-blur-md bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
          <div className="text-sm text-violet-300 font-semibold mb-1">Overall</div>
          <div className={`font-bold text-xl bg-gradient-to-r ${getScoreColor(breakdown.totalScore)} bg-clip-text text-transparent`}>
            {breakdown.totalScore.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Decorative Background Elements */}
      <div className="absolute -left-10 top-20 text-6xl opacity-10 transform rotate-12">💕</div>
      <div className="absolute -right-10 top-40 text-4xl opacity-10 transform -rotate-12">✨</div>
      <div className="absolute left-1/4 bottom-20 text-3xl opacity-10 transform rotate-45">💖</div>
      <div className="absolute right-1/3 bottom-40 text-5xl opacity-10 transform -rotate-45">⭐</div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <span className="inline-block bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full px-6 py-2 text-sm font-medium text-pink-300 mb-6">
              💕 Smart Matching Algorithm
            </span>
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

        {/* Current User Profile */}
        {currentUser && (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 mb-8 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/25">
                <span className="text-3xl text-white font-bold">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">{currentUser.name}</h2>
                <div className="flex flex-wrap gap-4 text-white/60 mb-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {currentUser.age} years old
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    {currentUser.college}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {currentUser.major} • Year {currentUser.year}
                  </div>
                </div>
                <p className="text-white/80 mb-4">{currentUser.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 backdrop-blur-md bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Find Matches Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleFindMatches}
            disabled={loading}
            className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 shadow-pink-500/25 hover:shadow-pink-500/40'
            } text-white`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding Your Perfect Matches...
              </span>
            ) : (
              <>
                <Heart className="inline h-5 w-5 mr-2" />
                Find My Soulmate
              </>
            )}
          </button>
        </div>

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
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <span className="text-3xl text-white font-bold">
                              {match.user.name.charAt(0)}
                            </span>
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
                      <span className="text-white/60 font-medium mb-3 block">Shared Interests:</span>
                      <div className="flex flex-wrap gap-3">
                        {match.user.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                              currentUser?.interests.includes(interest)
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 shadow-lg shadow-green-500/10'
                                : 'backdrop-blur-md bg-white/5 border-white/20 text-white/60'
                            }`}
                          >
                            {interest}
                            {currentUser?.interests.includes(interest) && ' ✓'}
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
                        <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:scale-105">
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

        {/* Empty State */}
        {matches.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6 opacity-30">💔</div>
            <h3 className="text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                No Matches Found
              </span>
            </h3>
            <p className="text-white/60 text-lg mb-8">Try adjusting your preferences or check back later!</p>
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        )}
        
        {/* Back Button - Fixed at bottom */}
        <div className="fixed bottom-8 left-8">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Matching;