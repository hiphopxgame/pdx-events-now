import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMusicVideos } from "@/hooks/useMusicVideos";
import { toast } from "sonner";
import { Music, Youtube } from "lucide-react";

export const MusicVideoSubmissionForm = () => {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitVideo, extractYouTubeId } = useMusicVideos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !youtubeUrl.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!extractYouTubeId(youtubeUrl)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitVideo(title.trim(), youtubeUrl.trim());
      toast.success("Music video submitted for approval!");
      setTitle("");
      setYoutubeUrl("");
    } catch (error) {
      console.error('Error submitting video:', error);
      toast.error("Failed to submit music video. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Submit Music Video
        </CardTitle>
        <CardDescription>
          Submit your YouTube music videos for approval. Once approved, they'll appear in the Music section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the title of your music video"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Youtube className="w-4 h-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};