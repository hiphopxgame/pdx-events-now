import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { Music } from "lucide-react";

export const UpgradeToArtistButton = () => {
  const { hasRole, upgradeToArtist } = useUserRoles();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Only show if user is a member but not an artist
  if (!hasRole('member') || hasRole('artist')) {
    return null;
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