import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMusicVideos, MusicVideo } from "@/hooks/useMusicVideos";
import { Music as MusicIcon, Play } from "lucide-react";

export default function Music() {
  const { fetchAllVideos } = useMusicVideos();
  const [approvedVideos, setApprovedVideos] = useState<MusicVideo[]>([]);
  const [loading, setLoading] = useState(true);

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
                <div className="aspect-video">
                  <iframe
                    src={getYouTubeEmbedUrl(video.youtube_id)}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{video.title}</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
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
    </div>
  );
}