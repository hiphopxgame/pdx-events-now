import React from 'react';
import { Badge } from '@/components/ui/badge';

export const BetaBanner = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            BETA
          </Badge>
          <p className="text-sm text-foreground/80 text-center">
            You're viewing the beta version of our platform. Help us improve by supporting our development!
          </p>
        </div>
      </div>
    </div>
  );
};