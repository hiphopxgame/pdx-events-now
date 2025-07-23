import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const UpgradeToArtistButton = () => {
  const { hasRole, upgradeToArtist, userRoles, loading } = useUserRoles();
  const { user } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    zip_code: ''
  });

  // Don't show anything while loading
  if (loading) {
    return <div className="text-sm text-gray-500">Loading roles...</div>;
  }

  // Show current roles for debugging and user information
  const currentRoles = userRoles.map(role => role.role).join(', ');
  const isMember = hasRole('member');
  const isAdmin = hasRole('admin');
  const isArtist = hasRole('artist');

  // Only show upgrade button if user has member or admin role but not artist
  if ((!isMember && !isAdmin) || isArtist) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Current roles: {currentRoles || 'None'}</p>
        {isArtist && (
          <p className="text-sm text-green-600">✓ You already have Artist privileges</p>
        )}
        {!isMember && !isAdmin && (
          <p className="text-sm text-gray-600">You need to be a member or admin to upgrade to Artist</p>
        )}
      </div>
    );
  }

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      
      // First update the profile with location information
      const { error: profileError } = await supabase
        .from('por_eve_profiles')
        .update({
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Then upgrade to artist
      await upgradeToArtist();
      
      toast.success("Successfully applied to be an Artist! You can now submit music videos.");
      setShowDialog(false);
      setFormData({ city: '', state: '', zip_code: '' });
    } catch (error) {
      console.error('Error upgrading to artist:', error);
      toast.error("Failed to apply to be an Artist. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const isFormValid = formData.city.trim() && formData.state.trim() && formData.zip_code.trim();

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Music className="w-4 h-4 mr-2" />
          Apply to be an Artist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to be an Artist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            To apply to be an artist, please provide your location information:
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter your city"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter your state"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="Enter your zip code"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={isUpgrading || !isFormValid}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isUpgrading ? "Applying..." : "Apply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};