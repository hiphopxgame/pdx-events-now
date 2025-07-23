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
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold truncate">{video.title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={getYouTubeEmbedUrl(video.youtube_id)}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-6 pt-0">
          <div className="text-center text-muted-foreground">
            By {video.artist?.full_name || video.artist?.username || 'Unknown Artist'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}