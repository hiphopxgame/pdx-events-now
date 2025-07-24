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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Globe, Facebook, Instagram, Twitter, Youtube, Loader2, Upload, X, Music, Video, MapPin } from 'lucide-react';
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
  is_email_public: boolean;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface ContentSubmission {
  title: string;
  youtube_url: string;
  category: 'Live Footage' | 'Music Videos' | 'Interviews' | 'Miscellaneous' | '';
}

const Account = () => {
  const { user } = useAuth();
  const { userRoles } = useUserRoles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [applyingForArtist, setApplyingForArtist] = useState(false);
  const [submittingContent, setSubmittingContent] = useState(false);
  const [contentSubmission, setContentSubmission] = useState<ContentSubmission>({
    title: '',
    youtube_url: '',
    category: ''
  });

  const isArtist = userRoles.some(role => role.role === 'artist');
  const canApplyForArtist = profile?.city && profile?.state && profile?.zip_code;

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
      
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      
      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully',
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
          is_email_public: profile.is_email_public,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code
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

  const handleApplyForArtist = async () => {
    if (!canApplyForArtist) {
      toast({
        title: 'Error',
        description: 'Please fill in your city, state, and zip code to apply for artist status',
        variant: 'destructive'
      });
      return;
    }

    try {
      setApplyingForArtist(true);
      const { error } = await supabase.rpc('upgrade_to_artist');
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have been granted artist status! You can now submit content.',
      });
      
      // Refresh the page to update role status
      window.location.reload();
    } catch (error) {
      console.error('Error applying for artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply for artist status',
        variant: 'destructive'
      });
    } finally {
      setApplyingForArtist(false);
    }
  };

  const handleContentSubmission = async () => {
    if (!contentSubmission.title || !contentSubmission.youtube_url || !contentSubmission.category || !user?.id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingContent(true);
      const { error } = await supabase
        .from('artist_content')
        .insert({
          title: contentSubmission.title,
          youtube_url: contentSubmission.youtube_url,
          category: contentSubmission.category as 'Live Footage' | 'Music Videos' | 'Interviews' | 'Miscellaneous',
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content submitted successfully! It will be reviewed by admins.',
      });

      // Reset form
      setContentSubmission({ title: '', youtube_url: '', category: '' });
    } catch (error) {
      console.error('Error submitting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit content',
        variant: 'destructive'
      });
    } finally {
      setSubmittingContent(false);
    }
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
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name || ''}
                      onChange={(e) => updateProfile('display_name', e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username || ''}
                      onChange={(e) => updateProfile('username', e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => updateProfile('full_name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.city || ''}
                        onChange={(e) => updateProfile('city', e.target.value)}
                        placeholder="Your city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profile.state || ''}
                        onChange={(e) => updateProfile('state', e.target.value)}
                        placeholder="Your state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">Zip Code</Label>
                      <Input
                        id="zip_code"
                        value={profile.zip_code || ''}
                        onChange={(e) => updateProfile('zip_code', e.target.value)}
                        placeholder="Your zip code"
                      />
                    </div>
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
                  <Label htmlFor="website_url" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Label>
                  <Input
                    id="website_url"
                    value={profile.website_url || ''}
                    onChange={(e) => updateProfile('website_url', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url" className="flex items-center">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook_url"
                    value={profile.facebook_url || ''}
                    onChange={(e) => updateProfile('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url" className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram_url"
                    value={profile.instagram_url || ''}
                    onChange={(e) => updateProfile('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_url" className="flex items-center">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter/X
                  </Label>
                  <Input
                    id="twitter_url"
                    value={profile.twitter_url || ''}
                    onChange={(e) => updateProfile('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_url" className="flex items-center">
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube_url"
                    value={profile.youtube_url || ''}
                    onChange={(e) => updateProfile('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/yourchannel"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Artist Application */}
            {!isArtist && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Music className="h-5 w-5 mr-2" />
                    Apply to be an Artist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Artists can submit content including YouTube videos, live footage, and more. 
                    To apply, please ensure your location information is complete.
                  </p>
                  {!canApplyForArtist && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Please fill in your city, state, and zip code above to apply for artist status.
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={handleApplyForArtist}
                    disabled={!canApplyForArtist || applyingForArtist}
                    className="w-full"
                  >
                    {applyingForArtist ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Music className="h-4 w-4 mr-2" />
                    )}
                    Apply for Artist Status
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Artist Content Submission */}
            {isArtist && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Submit Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="content_title">Title</Label>
                    <Input
                      id="content_title"
                      value={contentSubmission.title}
                      onChange={(e) => setContentSubmission(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter content title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      value={contentSubmission.youtube_url}
                      onChange={(e) => setContentSubmission(prev => ({ ...prev, youtube_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={contentSubmission.category}
                      onValueChange={(value: 'Live Footage' | 'Music Videos' | 'Interviews' | 'Miscellaneous') => 
                        setContentSubmission(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Live Footage">Live Footage</SelectItem>
                        <SelectItem value="Music Videos">Music Videos</SelectItem>
                        <SelectItem value="Interviews">Interviews</SelectItem>
                        <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleContentSubmission}
                    disabled={submittingContent}
                    className="w-full"
                  >
                    {submittingContent ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Submit Content
                  </Button>
                </CardContent>
              </Card>
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