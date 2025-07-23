import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Globe, Facebook, Instagram, Twitter, Youtube, Loader2, Upload, X, Music } from 'lucide-react';
import { UpgradeToArtistButton } from '@/components/UpgradeToArtistButton';
import { 
  compressImage, 
  isValidImageFile, 
  formatFileSize, 
  createFileFromBlob, 
  DEFAULT_COMPRESSION_OPTIONS 
} from '@/lib/imageUtils';
import { MusicVideoSubmissionForm } from '@/components/MusicVideoSubmissionForm';
import { ArtistMusicVideos } from '@/components/ArtistMusicVideos';
import { useUserRoles } from '@/hooks/useUserRoles';
import ProtectedRoute from '@/components/ProtectedRoute';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  bandcamp_url: string | null;
  soundcloud_url: string | null;
  is_email_public: boolean;
}

const Account = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('por_eve_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      
      // Validate file type
      if (!isValidImageFile(file)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, WebP, or GIF)",
          variant: "destructive",
        });
        return;
      }

      // Show compression progress
      const originalSize = formatFileSize(file.size);
      console.log(`Compressing avatar: ${file.name} (${originalSize})`);

      // Compress the image for profile use
      const compressedBlob = await compressImage(file, DEFAULT_COMPRESSION_OPTIONS.profile);
      const compressedSize = formatFileSize(compressedBlob.size);
      
      console.log(`Avatar compression complete: ${originalSize} → ${compressedSize}`);

      // Create file from compressed blob
      const compressedFile = createFileFromBlob(compressedBlob, file.name, 'jpeg');
      
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      
      toast({
        title: 'Success',
        description: `Avatar uploaded successfully (${compressedSize})`,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('por_eve_profiles')
        .update({
          display_name: profile.display_name,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          website_url: profile.website_url,
          facebook_url: profile.facebook_url,
          instagram_url: profile.instagram_url,
          twitter_url: profile.twitter_url,
          youtube_url: profile.youtube_url,
          spotify_url: profile.spotify_url,
          bandcamp_url: profile.bandcamp_url,
          soundcloud_url: profile.soundcloud_url,
          is_email_public: profile.is_email_public
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Navigate to user's unique page
      navigate(`/user/${user.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof UserProfile, value: string | boolean) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <p>Profile not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
              <User className="h-8 w-8 mr-3 text-emerald-600" />
              My Account
            </h1>
            <p className="text-gray-600">Manage your profile information and privacy settings</p>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_name" className={`flex items-center gap-2 ${profile.display_name ? 'text-emerald-700' : 'text-amber-600'}`}>
                      Display Name
                      <div className={`w-2 h-2 rounded-full ${profile.display_name ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    </Label>
                    <Input
                      id="display_name"
                      value={profile.display_name || ''}
                      onChange={(e) => updateProfile('display_name', e.target.value)}
                      placeholder="Your display name"
                      className={`${profile.display_name ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className={`flex items-center gap-2 ${profile.username ? 'text-emerald-700' : 'text-amber-600'}`}>
                      Username
                      <div className={`w-2 h-2 rounded-full ${profile.username ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    </Label>
                    <Input
                      id="username"
                      value={profile.username || ''}
                      onChange={(e) => updateProfile('username', e.target.value)}
                      placeholder="@username"
                      className={`${profile.username ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="full_name" className={`flex items-center gap-2 ${profile.full_name ? 'text-emerald-700' : 'text-amber-600'}`}>
                    Full Name
                    <div className={`w-2 h-2 rounded-full ${profile.full_name ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ''}
                    onChange={(e) => updateProfile('full_name', e.target.value)}
                    placeholder="Your full name"
                    className={`${profile.full_name ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    {profile.avatar_url && (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            handleAvatarUpload(file);
                          }
                        }}
                        disabled={uploading}
                      />
                      {uploading && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </div>
                      )}
                    </div>
                    {profile.avatar_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateProfile('avatar_url', '')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_public"
                    checked={profile.is_email_public}
                    onCheckedChange={(checked) => updateProfile('is_email_public', checked)}
                  />
                  <Label htmlFor="email_public">Make email address public</Label>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Social Media & Website
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website_url" className={`flex items-center gap-2 ${profile.website_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                    <Globe className="h-4 w-4" />
                    Website
                    <div className={`w-2 h-2 rounded-full ${profile.website_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="website_url"
                    value={profile.website_url || ''}
                    onChange={(e) => updateProfile('website_url', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={`${profile.website_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url" className={`flex items-center gap-2 ${profile.facebook_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                    <Facebook className="h-4 w-4" />
                    Facebook
                    <div className={`w-2 h-2 rounded-full ${profile.facebook_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="facebook_url"
                    value={profile.facebook_url || ''}
                    onChange={(e) => updateProfile('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yourprofile"
                    className={`${profile.facebook_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url" className={`flex items-center gap-2 ${profile.instagram_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                    <Instagram className="h-4 w-4" />
                    Instagram
                    <div className={`w-2 h-2 rounded-full ${profile.instagram_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="instagram_url"
                    value={profile.instagram_url || ''}
                    onChange={(e) => updateProfile('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/yourusername"
                    className={`${profile.instagram_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_url" className={`flex items-center gap-2 ${profile.twitter_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                    <Twitter className="h-4 w-4" />
                    Twitter/X
                    <div className={`w-2 h-2 rounded-full ${profile.twitter_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="twitter_url"
                    value={profile.twitter_url || ''}
                    onChange={(e) => updateProfile('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                    className={`${profile.twitter_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_url" className={`flex items-center gap-2 ${profile.youtube_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                    <Youtube className="h-4 w-4" />
                    YouTube
                    <div className={`w-2 h-2 rounded-full ${profile.youtube_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </Label>
                  <Input
                    id="youtube_url"
                    value={profile.youtube_url || ''}
                    onChange={(e) => updateProfile('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/yourchannel"
                    className={`${profile.youtube_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                  />
                </div>
                {hasRole('artist') && (
                  <>
                    <div>
                      <Label htmlFor="spotify_url" className={`flex items-center gap-2 ${profile.spotify_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                        <Music className="h-4 w-4" />
                        Spotify
                        <div className={`w-2 h-2 rounded-full ${profile.spotify_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      </Label>
                      <Input
                        id="spotify_url"
                        value={profile.spotify_url || ''}
                        onChange={(e) => updateProfile('spotify_url', e.target.value)}
                        placeholder="https://open.spotify.com/artist/..."
                        className={`${profile.spotify_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bandcamp_url" className={`flex items-center gap-2 ${profile.bandcamp_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                        <Music className="h-4 w-4" />
                        Bandcamp
                        <div className={`w-2 h-2 rounded-full ${profile.bandcamp_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      </Label>
                      <Input
                        id="bandcamp_url"
                        value={profile.bandcamp_url || ''}
                        onChange={(e) => updateProfile('bandcamp_url', e.target.value)}
                        placeholder="https://artistname.bandcamp.com"
                        className={`${profile.bandcamp_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="soundcloud_url" className={`flex items-center gap-2 ${profile.soundcloud_url ? 'text-emerald-700' : 'text-amber-600'}`}>
                        <Music className="h-4 w-4" />
                        SoundCloud
                        <div className={`w-2 h-2 rounded-full ${profile.soundcloud_url ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      </Label>
                      <Input
                        id="soundcloud_url"
                        value={profile.soundcloud_url || ''}
                        onChange={(e) => updateProfile('soundcloud_url', e.target.value)}
                        placeholder="https://soundcloud.com/artistname"
                        className={`${profile.soundcloud_url ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/30'}`}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Role Management */}
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UpgradeToArtistButton />
              </CardContent>
            </Card>

            {/* Artist Features */}
            {hasRole('artist') && (
              <div className="space-y-6">
                <MusicVideoSubmissionForm />
                <ArtistMusicVideos />
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Account;