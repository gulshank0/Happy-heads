const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiError {
  error: string;
  message?: string;
}

import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, FileText, Edit3, Check, X, Camera, Upload } from 'lucide-react';
import Navbar from '@/components/Header/Navbar';

interface ProfileData {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  age: string;
  bio: string;
  gender: string;
  college?: string;
  major?: string;
  interests?: string[];
  url?: string;
  location?: string;
  year?: string;
  googleId?: string;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({ 
    name: "", 
    email: "", 
    phone: "", 
    age: "", 
    bio: "", 
    avatar: "",
    gender: "male",
    url: "",
    location: "",
    year: "",
    college: "",
    major: "",
    interests: []
  });
  const [profile, setProfile] = useState<ProfileData>({ 
    name: "", 
    email: "", 
    phone: "", 
    age: "", 
    bio: "", 
    avatar: "",
    gender: "male",
    url: "",
    location: "",
    year: "",
    college: "",
    major: "",
    interests: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include'
        });

        console.log('Auth response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Auth response data:', data);
          
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            const profileData = {
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              age: data.user.age?.toString() || '',
              bio: data.user.bio || '',
              gender: data.user.gender || 'male',
              avatar: data.user.avatar || '',
              url: data.user.url || '',
              location: data.user.location || '',
              year: data.user.year?.toString() || '',
              college: data.user.college || '',
              major: data.user.major || '',
              interests: data.user.interests || [],
            };
            
            setProfile(profileData);
            setOriginalProfile(profileData); // Store original data for cancel functionality
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageLoadError(false);
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };
  const handleInterestsChange = (newInterests: string[]) => {
    const filteredInterests = newInterests.map(item => typeof item === 'string' ? item.trim() : '');
    setProfile(prev => ({
      ...prev,
      interests: filteredInterests
    }));
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${BACKEND_URL}/users/upload-avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Avatar upload failed');
    }

    const data = await response.json();
    return data.avatarUrl;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}:`, value);
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('=== SAVE FUNCTION STARTED ===');
    setLoading(true);
    setError("");

    try {
      let avatarUrl = profile.avatar;

      // Handle avatar upload first if there's a new file
      if (avatarFile) {
        console.log('Uploading new avatar...');
        setUploadingAvatar(true);
        try {
          avatarUrl = await uploadAvatar(avatarFile);
          console.log('Avatar uploaded successfully:', avatarUrl);
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          setError(uploadError instanceof Error ? uploadError.message : 'Avatar upload failed');
          setLoading(false);
          setUploadingAvatar(false);
          return;
        }
        setUploadingAvatar(false);
      }

      // Prepare update data with proper type conversion
      const updateData = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        age: profile.age && profile.age.trim() ? parseInt(profile.age.trim()) : null,
        gender: profile.gender,
        bio: profile.bio.trim(),
        avatar: avatarUrl,
        url: profile.url?.trim() || '',
        location: profile.location?.trim() || '',
        year: profile.year && profile.year.trim() ? parseInt(profile.year.trim()) : null,
        college: profile.college?.trim() || '',
        major: profile.major?.trim() || '',
        interests: profile.interests || [],
        googleId: profile.googleId || '',
      };

      console.log('=== SENDING UPDATE DATA ===');
      console.log(JSON.stringify(updateData, null, 2));

      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - redirecting to login');
          setIsAuthenticated(false);
          window.location.href = '/';
          return;
        }
        
        let errorMessage = "Profile update failed";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let updatedUser;
      try {
        updatedUser = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('=== RECEIVED UPDATED USER ===');
      console.log(JSON.stringify(updatedUser, null, 2));
      
      // Update the profile state with the response from the server
      const newProfileData = {
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        age: updatedUser.age?.toString() || '',
        bio: updatedUser.bio || '',
        avatar: updatedUser.avatar || '',
        gender: updatedUser.gender || 'male',
        url: updatedUser.url || '',
        location: updatedUser.location || '',
        year: updatedUser.year?.toString() || '',
        college: updatedUser.college || '',
        major: updatedUser.major || '',
        interests: updatedUser.interests || []
      };

      setProfile(newProfileData);
      setOriginalProfile(newProfileData); // Update original data too

      // Clear temporary states
      setAvatarFile(null);
      setAvatarPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsEditing(false);
      console.log("=== PROFILE UPDATE SUCCESSFUL ===");
      
    } catch (error: unknown) {
      console.error("=== PROFILE UPDATE ERROR ===", error);
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    console.log('Canceling edit - resetting to original profile');
    setProfile({ ...originalProfile }); // Reset to original values
    setIsEditing(false);
    setError("");
    setAvatarFile(null);
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = () => {
    console.log('Starting edit mode');
    setIsEditing(true);
    setError("");
  };

  useEffect(() => {
    document.title = "Profile - Happy Heads";
  }, []);

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

  if (!isAuthenticated) {
    return null;
  }

  const completedFields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.age,
    profile.avatar,
    profile.gender,
    profile.bio,
    profile.college,
    profile.major,
    profile.interests?.length ? 'filled' : '',
    profile.url,
    profile.location,
    profile.year
  ].filter(value => value && value.trim() !== '').length;

  const completionPercentage = Math.round((completedFields / 12) * 100);
  const handleNext = () => {
    window.location.href = '/home';
  }

  console.log('Profile avatar:', profile.avatar);

  const handleImageError = () => {
    setImageLoadError(true);
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-black text-white relative pt-20 pb-20 px-6">
        <div className="absolute -left-10 top-20 text-4xl sm:text-6xl opacity-20 transform skew-y-12">💕</div>
        <div className="absolute -right-10 top-40 text-2xl sm:text-4xl opacity-20 transform -skew-y-12">✨</div>
        
        <div className="max-w-4xl mx-auto relative z-10">
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

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8">
            <div className="bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-b border-white/10 px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg group">
                    {(avatarPreview || profile.avatar) && !imageLoadError ? (
                      <img 
                        src={avatarPreview || profile.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-violet-400 to-pink-400 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                    
                    {isEditing && (
                      <div 
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
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

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              accept="image/*"
              className="hidden"
            />

            <form onSubmit={handleSave} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
                  {error}
                </div>
              )}

              {isEditing && (
                <div className="mb-6 space-y-3">
                  <label className="flex items-center text-sm font-semibold text-white/80">
                    <Camera className="w-4 h-4 mr-2 text-violet-400" />
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/15 transition-all duration-200"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {avatarFile ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {avatarFile && (
                      <span className="text-sm text-white/70">
                        Selected: {avatarFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center capitalize">
                    {profile.gender || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>
<div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Year
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="year"
                    value={profile.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="Enter your year (e.g., Freshman, Sophomore)"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                    {profile.year || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>
              


              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="Enter your location"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                    {profile.location || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Personal URL
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="url"
                    value={profile.url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="Enter your personal URL"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                    {profile.url || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  College
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="college"
                    value={profile.college}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="Enter your college"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                    {profile.college || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Major
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="major"
                    value={profile.major}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="Enter your major"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                    {profile.major || <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex items-center text-sm font-semibold text-white/80">
                  <User className="w-4 h-4 mr-2 text-violet-400" />
                  Interests (comma separated)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="interests"
                    value={profile.interests?.join(',') || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      interests: e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest)
                    }))}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                    placeholder="e.g., Music, Sports, Art"
                  />
                ) : (
                  <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200 resize-none min-h-[48px] flex items-center" >
                    {profile.interests && profile.interests.length > 0 ? profile.interests.join(', ') : <span className="text-white/50">Not specified</span>}
                  </div>
                )}
              </div>



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
</div>
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
                    disabled={loading || uploadingAvatar}
                    type='submit'
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-2 inline" />
                    {uploadingAvatar ? "Uploading..." : loading ? "Saving..." : "Save Changes"}
                    {}
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
              <span className="text-sm font-medium text-white/60">
                {completedFields}/12 completed
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

          <div className="absolute right-10 bottom-20 text-3xl opacity-10 transform -rotate-12">💖</div>
          <div className="absolute left-20 bottom-40 text-2xl opacity-10 transform rotate-12">⭐</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;