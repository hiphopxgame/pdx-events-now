import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { Music } from "lucide-react";

export const UpgradeToArtistButton = () => {
  const { hasRole, upgradeToArtist, userRoles, loading } = useUserRoles();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Don't show anything while loading
  if (loading) {
    return <div className="text-sm text-gray-500">Loading roles...</div>;
  }

  // Show current roles for debugging and user information
  const currentRoles = userRoles.map(role => role.role).join(', ');
  const isMember = hasRole('member'); // All users should have 'member' role (migrated from legacy 'user' role)
  const isArtist = hasRole('artist');

  // Only show upgrade button if user has member/user role but not artist
  if (!isMember || isArtist) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Current roles: {currentRoles || 'None'}</p>
        {isArtist && (
          <p className="text-sm text-green-600">✓ You already have Artist privileges</p>
        )}
        {!isMember && (
          <p className="text-sm text-gray-600">You need to be a member to upgrade to Artist</p>
        )}
      </div>
    );
  }

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await upgradeToArtist();
      toast.success("Successfully upgraded to Artist! You can now submit music videos.");
    } catch (error) {
      console.error('Error upgrading to artist:', error);
      toast.error("Failed to upgrade to Artist. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Button 
      onClick={handleUpgrade}
      disabled={isUpgrading}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      <Music className="w-4 h-4 mr-2" />
      {isUpgrading ? "Upgrading..." : "Become an Artist"}
    </Button>
  );
};