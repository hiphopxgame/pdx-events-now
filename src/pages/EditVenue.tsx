import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  compressImages, 
  isValidImageFile, 
  formatFileSize, 
  createFileFromBlob, 
  DEFAULT_COMPRESSION_OPTIONS 
} from '@/lib/imageUtils';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Loader2,
  Building2,
  ArrowLeft,
  Upload,
  X,
  Image
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Venue {
  id: string;
  name: string;
  google_place_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  google_review_count?: number;
  google_photos?: string[];
  image_urls?: string[];
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  ages?: string;
}

const EditVenue = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Portland',
    state: 'Oregon',
    zip_code: '',
    phone: '',
    website: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    ages: '21+',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin && venueId && venueId !== 'new') {
      fetchVenue();
    } else if (isAdmin && venueId === 'new') {
      setLoading(false);
    }
  }, [isAdmin, venueId]);

  const fetchVenue = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) throw error;
      
      setVenue(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        city: data.city || 'Portland',
        state: data.state || 'Oregon',
        zip_code: data.zip_code || '',
        phone: data.phone || '',
        website: data.website || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        twitter_url: data.twitter_url || '',
        youtube_url: data.youtube_url || '',
        ages: data.ages || '21+',
      });
      setImageUrls(data.image_urls || []);
    } catch (error) {
      console.error('Error fetching venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch venue details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const fileArray = Array.from(files);
      
      // Validate all files first
      const invalidFiles = fileArray.filter(file => !isValidImageFile(file));
      if (invalidFiles.length > 0) {
        toast({
          title: 'Invalid File Type',
          description: `Please upload valid image files (JPEG, PNG, WebP, or GIF). ${invalidFiles.length} invalid file(s) detected.`,
          variant: 'destructive'
        });
        return;
      }

      // Show compression progress
      const totalOriginalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
      console.log(`Compressing ${fileArray.length} venue images (${formatFileSize(totalOriginalSize)} total)`);

      // Compress all images
      const compressedBlobs = await compressImages(fileArray, DEFAULT_COMPRESSION_OPTIONS.venue);
      
      const totalCompressedSize = compressedBlobs.reduce((sum, blob) => sum + blob.size, 0);
      console.log(`Compression complete: ${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalCompressedSize)}`);

      const uploadedUrls: string[] = [];

      for (let i = 0; i < compressedBlobs.length; i++) {
        const blob = compressedBlobs[i];
        const originalFile = fileArray[i];
        
        // Create file from compressed blob
        const compressedFile = createFileFromBlob(blob, originalFile.name, 'jpeg');
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${i}.jpg`;
        const filePath = `venues/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('venue-images')
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('venue-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImageUrls(prev => [...prev, ...uploadedUrls]);
      toast({
        title: 'Success',
        description: `${uploadedUrls.length} image(s) uploaded successfully (${formatFileSize(totalCompressedSize)} total)`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Venue name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const isCreating = venueId === 'new';
      
      const venueData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        facebook_url: formData.facebook_url.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        twitter_url: formData.twitter_url.trim() || null,
        youtube_url: formData.youtube_url.trim() || null,
        image_urls: imageUrls,
        ages: formData.ages,
      };

      let error;

      if (isCreating) {
        const { error: insertError } = await supabase
          .from('venues')
          .insert({
            ...venueData,
            status: 'pending'
          });
        error = insertError;
      } else {
        const { error: updateError } = await supabase
          .from('venues')
          .update({
            ...venueData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', venueId);
        error = updateError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Venue ${isCreating ? 'created' : 'updated'} successfully`,
      });

      navigate('/admin/venues');
    } catch (error) {
      console.error('Error saving venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to save venue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (rolesLoading || !isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg text-gray-600">
                  {!isAdmin ? 'Access denied. Admin privileges required.' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/venues')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
            </Button>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-emerald-600" />
              {venueId === 'new' ? 'Create Venue' : 'Edit Venue'}
            </h1>
            <p className="text-gray-600">
              {venueId === 'new' ? 'Add a new venue to the system' : 'Update venue information and images'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter venue name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ages">Age Requirement</Label>
                    <Select value={formData.ages} onValueChange={(value) => handleInputChange('ages', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age requirement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Ages">All Ages</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                        <SelectItem value="21+">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Address</h4>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Portland"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Oregon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="97201"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Social Media</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook URL</Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/venue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/venue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/venue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/channel/..."
                    />
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Venue Images</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-400" />
                        )}
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> venue images
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Venue image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/venues')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !formData.name.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {venueId === 'new' ? 'Create Venue' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default EditVenue;