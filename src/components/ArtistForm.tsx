import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageFromFile } from '@/utils/imageUpload';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const artistSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
  bio: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  youtube_url: z.string().url().optional().or(z.literal('')),
  spotify_url: z.string().url().optional().or(z.literal('')),
  bandcamp_url: z.string().url().optional().or(z.literal('')),
  apple_music_url: z.string().url().optional().or(z.literal('')),
  soundcloud_url: z.string().url().optional().or(z.literal('')),
  tiktok_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
});

type ArtistFormData = z.infer<typeof artistSchema>;

interface ArtistFormProps {
  onSuccess?: () => void;
}

export const ArtistForm: React.FC<ArtistFormProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: '',
      bio: '',
      website_url: '',
      youtube_url: '',
      spotify_url: '',
      bandcamp_url: '',
      apple_music_url: '',
      soundcloud_url: '',
      tiktok_url: '',
      facebook_url: '',
      twitter_url: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ArtistFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = '';
      
      if (selectedImage) {
        const uploadedUrl = await uploadImageFromFile(selectedImage, 'avatars', 'artists');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('featured_artists')
        .insert({
          name: data.name,
          bio: data.bio || null,
          image_url: imageUrl || null,
          website_url: data.website_url || null,
          youtube_url: data.youtube_url || null,
          spotify_url: data.spotify_url || null,
          bandcamp_url: data.bandcamp_url || null,
          apple_music_url: data.apple_music_url || null,
          soundcloud_url: data.soundcloud_url || null,
          tiktok_url: data.tiktok_url || null,
          facebook_url: data.facebook_url || null,
          twitter_url: data.twitter_url || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Artist has been added successfully.',
      });

      form.reset();
      setSelectedImage(null);
      setImagePreview('');
      onSuccess?.();
    } catch (error) {
      console.error('Error adding artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add artist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Featured Artist</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Artist Photo</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="artist-image"
                  />
                  <label
                    htmlFor="artist-image"
                    className="flex items-center space-x-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose Image</span>
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter artist name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter artist bio"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spotify_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spotify</FormLabel>
                      <FormControl>
                        <Input placeholder="https://spotify.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bandcamp_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandcamp</FormLabel>
                      <FormControl>
                        <Input placeholder="https://bandcamp.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apple_music_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apple Music</FormLabel>
                      <FormControl>
                        <Input placeholder="https://music.apple.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="soundcloud_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SoundCloud</FormLabel>
                      <FormControl>
                        <Input placeholder="https://soundcloud.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiktok_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok</FormLabel>
                      <FormControl>
                        <Input placeholder="https://tiktok.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Artist
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};