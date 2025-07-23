import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMusicVideos, MusicVideo } from "@/hooks/useMusicVideos";
import { MusicVideoModal } from "@/components/MusicVideoModal";
import { Music as MusicIcon, Play } from "lucide-react";

export default function Music() {
  const { fetchAllVideos } = useMusicVideos();
  const navigate = useNavigate();
  const [approvedVideos, setApprovedVideos] = useState<MusicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<MusicVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadApprovedVideos = async () => {
      try {
        setLoading(true);
        const videos = await fetchAllVideos('approved');
        setApprovedVideos(videos as MusicVideo[]);
      } catch (error) {
        console.error('Error loading approved videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApprovedVideos();
  }, []);

  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}`;
  };

  const handlePlayVideo = (video: MusicVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleArtistClick = (artistId: string) => {
    navigate(`/user/${artistId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading music videos...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
            <MusicIcon className="w-8 h-8" />
            Music Videos
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover amazing music videos from our community artists
          </p>
        </div>

        {approvedVideos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MusicIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Music Videos Yet</h3>
              <p className="text-muted-foreground">
                Be the first to submit a music video for approval!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video relative group">
                  <iframe
                    src={getYouTubeEmbedUrl(video.youtube_id)}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={() => handlePlayVideo(video)}
                      size="lg"
                      className="bg-primary/90 hover:bg-primary text-primary-foreground"
                    >
                      <Play className="w-6 h-6 mr-2" />
                      Play Full Screen
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle 
                    className="line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handlePlayVideo(video)}
                  >
                    {video.title}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleArtistClick(video.artist_id)}
                    >
                      By {video.artist?.full_name || video.artist?.username || 'Unknown Artist'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Music Video
                    </Badge>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <MusicVideoModal 
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}