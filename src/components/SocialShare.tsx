import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { shareUrls } from '@/lib/seo';
import { toast } from 'sonner';
import { Facebook, Twitter, Linkedin, MessageCircle, Mail, Copy, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'button' | 'dropdown' | 'card';
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
  url, 
  title, 
  description = '', 
  className = '',
  variant = 'dropdown'
}) => {
  const handleShare = (shareFunction: () => void) => {
    shareFunction();
  };

  const handleCopy = async () => {
    const success = await shareUrls.copy(url);
    if (success) {
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const ShareButton = ({ icon: Icon, label, onClick, className: btnClassName = "" }: { 
    icon: React.ElementType; 
    label: string; 
    onClick: () => void;
    className?: string;
  }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-2 ${btnClassName}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share this page
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <ShareButton
              icon={Facebook}
              label="Facebook"
              onClick={() => window.open(shareUrls.facebook(url, title), '_blank')}
              className="text-blue-600 hover:bg-blue-50"
            />
            <ShareButton
              icon={Twitter}
              label="Twitter"
              onClick={() => window.open(shareUrls.twitter(url, title), '_blank')}
              className="text-sky-500 hover:bg-sky-50"
            />
            <ShareButton
              icon={Linkedin}
              label="LinkedIn"
              onClick={() => window.open(shareUrls.linkedin(url, title, description), '_blank')}
              className="text-blue-700 hover:bg-blue-50"
            />
            <ShareButton
              icon={MessageCircle}
              label="WhatsApp"
              onClick={() => window.open(shareUrls.whatsapp(url, title), '_blank')}
              className="text-green-600 hover:bg-green-50"
            />
            <ShareButton
              icon={Mail}
              label="Email"
              onClick={() => window.open(shareUrls.email(url, title, description), '_blank')}
              className="text-gray-600 hover:bg-gray-50"
            />
            <ShareButton
              icon={Copy}
              label="Copy Link"
              onClick={handleCopy}
              className="text-gray-600 hover:bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'button') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <ShareButton
          icon={Facebook}
          label="Facebook"
          onClick={() => window.open(shareUrls.facebook(url, title), '_blank')}
          className="text-blue-600 hover:bg-blue-50"
        />
        <ShareButton
          icon={Twitter}
          label="Twitter"
          onClick={() => window.open(shareUrls.twitter(url, title), '_blank')}
          className="text-sky-500 hover:bg-sky-50"
        />
        <ShareButton
          icon={Copy}
          label="Copy"
          onClick={handleCopy}
          className="text-gray-600 hover:bg-gray-50"
        />
      </div>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => window.open(shareUrls.facebook(url, title), '_blank')}>
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.twitter(url, title), '_blank')}>
          <Twitter className="w-4 h-4 mr-2 text-sky-500" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.linkedin(url, title, description), '_blank')}>
          <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.whatsapp(url, title), '_blank')}>
          <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.email(url, title, description), '_blank')}>
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2 text-gray-600" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};