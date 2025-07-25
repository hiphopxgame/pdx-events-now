import React from 'react';
import { MapboxMap } from '@/components/MapboxMap';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MapTest = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Map Test Page</h1>
          <p className="text-muted-foreground mt-2">
            Testing Mapbox integration with Harlow Hotel
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Harlow Hotel Map Test
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Address: 1022 SE Hawthorne Blvd, Portland, OR 97214
            </p>
            <MapboxMap 
              address="1022 SE Hawthorne Blvd, Portland, OR 97214"
              venueName="Harlow Hotel"
              className="w-full h-96 rounded-lg"
            />
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Map Test with Coordinates
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Using latitude/longitude for Harlow Hotel
            </p>
            <MapboxMap 
              latitude={45.5126}
              longitude={-122.6480}
              venueName="Harlow Hotel (Coordinates)"
              className="w-full h-96 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTest;