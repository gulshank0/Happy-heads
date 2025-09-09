import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, FileText, Edit3, Check, X } from 'lucide-react';
import Navbar from '@/components/Header/Navbar';

interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  bio: string;
  gender: string;
  googleId?: string;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileData>({ 
    name: "", 
    email: "", 
    phone: "", 
    age: "", 
    bio: "", 
    gender: "male"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Authentication check using the correct endpoint
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch('http://localhost:8000/auth/me', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            // Set initial profile data from authenticated user
            setProfile({
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              age: data.user.age?.toString() || '',
              bio: data.user.bio || '',
              gender: data.user.gender || 'male'
            });
          } else {
            setIsAuthenticated(false);
            window.location.href = '/';
          }
        } else {
          setIsAuthenticated(false);
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        window.location.href = '/';
      }
    };

    checkAuthentication();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare update data with proper type conversion
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        bio: profile.bio
      };

      const response = await fetch('http://localhost:8000/users/profile', {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          window.location.href = '/';
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Profile update failed");
      }

      const updatedUser = await response.json();
      
      // Update profile state with server response
      setProfile({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        age: updatedUser.age?.toString() || '',
        bio: updatedUser.bio || '',
        gender: updatedUser.gender || 'male'
      });

      setIsEditing(false);
      console.log("Profile update successful");
      
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
  };

  useEffect(() => {
    document.title = "Profile - Happy Heads";
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const completedFields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.age,
    profile.gender,
    profile.bio
  ].filter(value => value && value.trim() !== '').length;

  const completionPercentage = Math.round((completedFields / 6) * 100);
  const handleNext = () => {
    window.location.href = '/home';
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-black text-white relative pt-20 pb-20 px-6">
        {/* Decorative Emojis */}
        <div className="absolute -left-10 top-20 text-4xl sm:text-6xl opacity-20 transform skew-y-12">💕</div>
        <div className="absolute -right-10 top-40 text-2xl sm:text-4xl opacity-20 transform -skew-y-12">✨</div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-poppins text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-2">
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Your Profile
              </span>
            </h1>
            <p className="text-lg sm:text-xl leading-6 sm:leading-8 text-white/70 max-w-2xl mx-auto">
              Create your perfect profile and connect with amazing people on campus
            </p>
          </div>

          {/* Main Profile Card */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-b border-white/10 px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {profile.name || 'Your Name'}
                    </h2>
                    <p className="text-white/60">College Student</p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={isEditing ? handleCancel : handleEdit}
                    className="inline-flex items-center px-6 py-3 backdrop-blur-md bg-white/12 border border-white/20 rounded-lg text-white font-medium hover:bg-white/16 transition-all duration-300"
                  >
                    {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-white/80">
                    <User className="w-4 h-4 mr-2 text-violet-400" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  ) : (
                    <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                      {profile.name || <span className="text-white/50">Not specified</span>}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-white/80">
                    <Mail className="w-4 h-4 mr-2 text-pink-400" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  ) : (
                    <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                      {profile.email || <span className="text-white/50">Not specified</span>}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-white/80">
                    <Phone className="w-4 h-4 mr-2 text-violet-400" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                      {profile.phone || <span className="text-white/50">Not specified</span>}
                    </div>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-white/80">
                    <Calendar className="w-4 h-4 mr-2 text-pink-400" />
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="age"
                      value={profile.age}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200"
                      placeholder="Enter your age"
                      min="18"
                      max="100"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                      {profile.age || <span className="text-white/50">Not specified</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                  >
                    <option className='bg-gray-800' value="male">Male</option>
                    <option className='bg-gray-800' value="female">Female</option>
                    <option className='bg-gray-800' value="other">Other</option>
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center capitalize">
                    {profile.gender || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <FileText className="w-4 h-4 mr-2 text-violet-400" />
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[100px]">
                    {profile.bio || <span className="text-white/50">No bio added yet</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/15 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={loading}
                    type='submit'
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-2 inline" />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Profile Completion Card */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
              <span className="text-sm font-medium text-white/60">
                {completedFields}/6 completed
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-violet-400 to-pink-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                {completionPercentage}%
              </span>
            </div>
            <p className="text-sm text-white/50 mt-3">
              Complete your profile to increase your chances of finding the perfect match!
            </p>
          </div>
<div className="mt-8 text-center">
  <button 
    onClick={handleNext}
    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-violet-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-violet-500/25 group"
  >
    <span className="mr-2">Continue to Home</span>
    <svg 
      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </button>
</div>
          {/* Decorative elements */}
          <div className="absolute right-10 bottom-20 text-3xl opacity-10 transform -rotate-12">💖</div>
          <div className="absolute left-20 bottom-40 text-2xl opacity-10 transform rotate-12">⭐</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;