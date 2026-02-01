import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Heart, MapPin, GraduationCap, Calendar, User, Save, RotateCcw } from 'lucide-react';

const BACKEND_URL = import.meta.env.BACKEND_URL;

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

interface MatchingPreferencesProps {
  user: any;
}

const MatchingPreferences: React.FC<MatchingPreferencesProps> = ({ user }) => {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/matching/preferences`, {
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

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${BACKEND_URL}/api/matching/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setSuccess('Matching preferences updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    setPreferences({
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
  };

  const updateWeight = (key: string, value: number) => {
    const totalOthers = Object.entries(preferences)
      .filter(([k]) => k.endsWith('Weight') && k !== key)
      .reduce((sum, [, v]) => sum + (v as number), 0);
    
    const remaining = 1 - value;
    const ratio = remaining / totalOthers;
    
    const updatedPrefs = { ...preferences, [key]: value };
    
    // Proportionally adjust other weights
    Object.keys(updatedPrefs).forEach(k => {
      if (k.endsWith('Weight') && k !== key) {
        updatedPrefs[k as keyof UserPreferences] = (updatedPrefs[k as keyof UserPreferences] as number) * ratio;
      }
    });
    
    setPreferences(updatedPrefs);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Heart className="w-5 h-5 mr-3 text-pink-400" />
            Matching Preferences
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleResetToDefaults}
              className="px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        <p className="text-white/70 text-sm">
          Configure your matching preferences to find the most compatible people on campus.
        </p>
      </div>

      {/* Basic Preferences */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
          <User className="w-4 h-4 mr-2 text-blue-400" />
          Basic Preferences
        </h4>

        <div className="space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-white/80 font-medium mb-3">Age Range</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-white/60 mb-1">Min Age: {preferences.minAge}</label>
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.minAge}
                  onChange={(e) => setPreferences(prev => ({ ...prev, minAge: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>
              <span className="text-white/60 px-2">to</span>
              <div className="flex-1">
                <label className="block text-sm text-white/60 mb-1">Max Age: {preferences.maxAge}</label>
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.maxAge}
                  onChange={(e) => setPreferences(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>
            </div>
          </div>

          {/* Gender Preferences */}
          <div>
            <label className="block text-white/80 font-medium mb-3">Interested in</label>
            <div className="flex flex-wrap gap-3">
              {['male', 'female', 'other'].map(gender => (
                <label key={gender} className="flex items-center cursor-pointer">
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
                    className="hidden"
                  />
                  <div className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                    preferences.preferredGenders.includes(gender)
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                  }`}>
                    <span className="capitalize font-medium">{gender}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Max Distance */}
          <div>
            <label className="block text-white/80 font-medium mb-3">
              Maximum Distance: {preferences.maxDistance} km
            </label>
            <input
              type="range"
              min="1"
              max="200"
              value={preferences.maxDistance}
              onChange={(e) => setPreferences(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
            />
            <div className="flex justify-between text-sm text-white/60 mt-1">
              <span>1 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Preferences */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
          <GraduationCap className="w-4 h-4 mr-2 text-blue-400" />
          Academic Preferences
        </h4>

        <div className="space-y-6">
          {/* College Preference */}
          <div>
            <label className="block text-white/80 font-medium mb-3">College Preference</label>
            <select
              value={preferences.collegePreference}
              onChange={(e) => setPreferences(prev => ({ ...prev, collegePreference: e.target.value }))}
              className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="any" className="bg-gray-800">Any College</option>
              <option value="same" className="bg-gray-800">Same College</option>
              <option value="different" className="bg-gray-800">Different College</option>
            </select>
          </div>

          {/* Major Preference */}
          <div>
            <label className="block text-white/80 font-medium mb-3">Major Preference</label>
            <select
              value={preferences.majorPreference}
              onChange={(e) => setPreferences(prev => ({ ...prev, majorPreference: e.target.value }))}
              className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="any" className="bg-gray-800">Any Major</option>
              <option value="same" className="bg-gray-800">Same Major</option>
              <option value="similar" className="bg-gray-800">Similar Field</option>
              <option value="different" className="bg-gray-800">Different Major</option>
            </select>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-white/80 font-medium mb-3">Preferred Academic Year</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-white/60 mb-1">Min Year: {preferences.minYear}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={preferences.minYear}
                  onChange={(e) => setPreferences(prev => ({ ...prev, minYear: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>
              <span className="text-white/60 px-2">to</span>
              <div className="flex-1">
                <label className="block text-sm text-white/60 mb-1">Max Year: {preferences.maxYear}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={preferences.maxYear}
                  onChange={(e) => setPreferences(prev => ({ ...prev, maxYear: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Weights */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Sliders className="w-4 h-4 mr-2 text-orange-400" />
          Matching Algorithm Weights
        </h4>
        
        <p className="text-white/60 text-sm mb-6">
          Adjust how important each factor is in finding your matches. All weights must add up to 100%.
        </p>

        <div className="space-y-4">
          {[
            { key: 'ageWeight', label: 'Age Compatibility', color: 'pink' },
            { key: 'distanceWeight', label: 'Distance', color: 'blue' },
            { key: 'interestsWeight', label: 'Common Interests', color: 'green' },
            { key: 'collegeWeight', label: 'College Match', color: 'purple' },
            { key: 'majorWeight', label: 'Academic Field', color: 'yellow' },
            { key: 'yearWeight', label: 'Academic Year', color: 'indigo' },
            { key: 'personalityWeight', label: 'Personality Match', color: 'red' }
          ].map(({ key, label, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/80 font-medium">{label}</label>
                <span className="text-white/60 text-sm">
                  {Math.round((preferences[key as keyof UserPreferences] as number) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={preferences[key as keyof UserPreferences] as number}
                onChange={(e) => updateWeight(key, parseFloat(e.target.value))}
                className={`w-full h-2 bg-white/20 rounded-lg appearance-none slider slider-${color}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total Weight:</span>
            <span className={`font-medium ${
              Math.round((Object.keys(preferences).filter(k => k.endsWith('Weight')).reduce((sum, k) => 
                sum + (preferences[k as keyof UserPreferences] as number), 0)) * 100) === 100 
                ? 'text-green-400' : 'text-orange-400'
            }`}>
              {Math.round((Object.keys(preferences).filter(k => k.endsWith('Weight')).reduce((sum, k) => 
                sum + (preferences[k as keyof UserPreferences] as number), 0)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          disabled={loading}
          className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2 inline" />
          {loading ? 'Saving Preferences...' : 'Save All Preferences'}
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};

export default MatchingPreferences;