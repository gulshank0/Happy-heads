import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, FileText, Edit3, Check, X, Camera, Upload, Shield, Bell, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import OptimizedAvatar from '@/components/ui/OptimizedAvatar';

const BACKEND_URL = import.meta.env.BACKEND_URL;

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  age: string;
  bio: string;
  avatar: string;
  gender: string;
  url: string;
  location: string;
  year: string;
  college: string;
  major: string;
  interests: string[];
}

interface AccountSettingsProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpdate }) => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    age: '',
    bio: '',
    avatar: '',
    gender: 'male',
    url: '',
    location: '',
    year: '',
    college: '',
    major: '',
    interests: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showAge: true,
    showLocation: true,
    showCollege: true,
    allowMessages: true,
    showOnlineStatus: true
  });

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    matchNotifications: true,
    likeNotifications: true,
    commentNotifications: true
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        gender: user.gender || 'male',
        url: user.url || '',
        location: user.location || '',
        year: user.year?.toString() || '',
        college: user.college || '',
        major: user.major || '',
        interests: user.interests || []
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let avatarUrl = profile.avatar;

      // Handle avatar upload first if there's a new file
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

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
        avatarUrl = data.avatarUrl;
      }

      // Update profile data
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
      };

      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Profile update failed');
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        gender: user.gender || 'male',
        url: user.url || '',
        location: user.location || '',
        year: user.year?.toString() || '',
        college: user.college || '',
        major: user.major || '',
        interests: user.interests || []
      });
    }
    setIsEditing(false);
    setError("");
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Profile Information</h3>
          <button
            onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/15 transition-all duration-200"
          >
            {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Avatar Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white/80 mb-3">Profile Picture</label>
            <div className="flex items-center space-x-4">
              <OptimizedAvatar 
                src={avatarPreview || profile.avatar} 
                alt="Profile" 
                fallbackText={profile.name}
                size="xl"
                className="shadow-lg"
                lazy={false}
              />
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/15 transition-all duration-200"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
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

          {/* Additional Information */}
          <div className="mt-6 space-y-6">
            <div className="space-y-3">
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

            <div className="space-y-3">
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
                <div className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white min-h-[48px] flex items-center">
                  {profile.interests && profile.interests.length > 0 ? profile.interests.join(', ') : <span className="text-white/50">Not specified</span>}
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

      {/* Privacy Settings */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-3 text-green-400" />
          Privacy Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Profile Visibility</label>
              <p className="text-white/60 text-sm">Who can see your profile</p>
            </div>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
              className="px-3 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="public" className="bg-gray-800">Everyone</option>
              <option value="matches" className="bg-gray-800">Matches Only</option>
              <option value="private" className="bg-gray-800">Private</option>
            </select>
          </div>

          {['showAge', 'showLocation', 'showCollege', 'allowMessages', 'showOnlineStatus'].map((setting) => (
            <div key={setting} className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium capitalize">
                  {setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <p className="text-white/60 text-sm">
                  {setting === 'showAge' && 'Display your age on profile'}
                  {setting === 'showLocation' && 'Show your location to others'}
                  {setting === 'showCollege' && 'Display your college information'}
                  {setting === 'allowMessages' && 'Allow others to message you'}
                  {setting === 'showOnlineStatus' && 'Show when you\'re online'}
                </p>
              </div>
              <button
                onClick={() => setPrivacySettings(prev => ({ 
                  ...prev, 
                  [setting]: !prev[setting as keyof typeof prev] 
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacySettings[setting as keyof typeof privacySettings] 
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500' 
                    : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    privacySettings[setting as keyof typeof privacySettings] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Bell className="w-5 h-5 mr-3 text-blue-400" />
          Notification Preferences
        </h3>
        
        <div className="space-y-4">
          {Object.entries(notificationPrefs).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <p className="text-white/60 text-sm">
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'pushNotifications' && 'Browser push notifications'}
                  {key === 'messageNotifications' && 'New message alerts'}
                  {key === 'matchNotifications' && 'New match notifications'}
                  {key === 'likeNotifications' && 'When someone likes your profile'}
                  {key === 'commentNotifications' && 'Comments on your posts'}
                </p>
              </div>
              <button
                onClick={() => setNotificationPrefs(prev => ({ ...prev, [key]: !value }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-red-400 font-medium">Delete Account</label>
              <p className="text-red-300/80 text-sm">Permanently delete your account and all data. This action cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-md bg-white/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Account</h3>
              <p className="text-white/70 mb-6">
                Are you absolutely sure you want to delete your account? This will permanently delete all your data, matches, messages, and posts. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;