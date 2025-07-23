import React, { useState, useEffect } from 'react';
import { useMusicVideos, MusicVideo } from '@/hooks/useMusicVideos';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Music, 
  Check, 
  X, 
  ChevronDown, 
  ExternalLink, 
  Clock, 
  User,
  Calendar
} from 'lucide-react';

export const AdminMusicManagement = () => {
  const { isAdmin } = useUserRoles();
  const { fetchAllVideos, updateVideoStatus } = useMusicVideos();
  const [pendingVideos, setPendingVideos] = useState<MusicVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingVideo, setRejectingVideo] = useState<MusicVideo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadPendingVideos();
    }
  }, [isAdmin]);

  const loadPendingVideos = async () => {
    setLoading(true);
    try {
      const videos = await fetchAllVideos('pending');
      setPendingVideos(videos);
    } catch (error) {
      console.error('Error loading pending videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending music videos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (videoId: string) => {
    try {
      await updateVideoStatus(videoId, 'approved');
      toast({
        title: 'Success',
        description: 'Music video approved successfully'
      });
      loadPendingVideos();
    } catch (error) {
      console.error('Error approving video:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve music video',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingVideo || !rejectionReason.trim()) return;
    
    try {
      await updateVideoStatus(rejectingVideo.id, 'rejected', rejectionReason);
      toast({
        title: 'Success',
        description: 'Music video rejected'
      });
      setRejectingVideo(null);
      setRejectionReason('');
      loadPendingVideos();
    } catch (error) {
      console.error('Error rejecting video:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject music video',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative">
            <Music className="h-4 w-4 mr-2" />
            Manage Music
            {pendingVideos.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingVideos.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-96 max-h-96 overflow-y-auto bg-background border z-50">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Pending Music Videos</span>
            <Badge variant="secondary">{pendingVideos.length}</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : pendingVideos.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No pending submissions
            </div>
          ) : (
            pendingVideos.map((video) => (
              <div key={video.id} className="p-3 border-b border-border last:border-b-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{video.title}</h4>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <span>{video.artist?.full_name || video.artist?.username || 'Unknown Artist'}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Video
                    </a>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(video.id)}
                        className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingVideo(video)}
                            className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Music Video</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">{video.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                by {video.artist?.full_name || video.artist?.username || 'Unknown Artist'}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Rejection Reason</label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a reason for rejection..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectingVideo(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                              >
                                Reject Video
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};