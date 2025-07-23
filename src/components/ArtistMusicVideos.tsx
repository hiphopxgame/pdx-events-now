import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMusicVideos } from "@/hooks/useMusicVideos";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const ArtistMusicVideos = () => {
  const { videos, loading, deleteVideo } = useMusicVideos();
  const { hasRole } = useUserRoles();

  if (!hasRole('artist')) {
    return null;
  }

  const handleDelete = async (videoId: string) => {
    try {
      await deleteVideo(videoId);
      toast.success("Video deleted successfully");
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  if (loading) {
    return <div>Loading your music videos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Music Videos</CardTitle>
        <CardDescription>
          Manage your submitted music videos and track their approval status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No music videos submitted yet. Submit your first video above!
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{video.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Submitted {new Date(video.created_at).toLocaleDateString()}
                  </p>
                  {video.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">
                      Rejection reason: {video.rejection_reason}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(video.status)}>
                    {video.status}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(video.youtube_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {video.status === 'pending' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Video</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{video.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(video.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};