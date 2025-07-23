import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MusicVideo } from "@/hooks/useMusicVideos";

interface MusicVideoModalProps {
  video: MusicVideo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MusicVideoModal({ video, isOpen, onClose }: MusicVideoModalProps) {
  if (!video) return null;

  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{video.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 aspect-video">
          <iframe
            src={getYouTubeEmbedUrl(video.youtube_id)}
            title={video.title}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="text-center text-muted-foreground">
          By {video.artist?.full_name || video.artist?.username || 'Unknown Artist'}
        </div>
      </DialogContent>
    </Dialog>
  );
}