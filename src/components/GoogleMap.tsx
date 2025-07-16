import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleMapProps {
  address?: string;
  venueName?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ 
  address, 
  venueName, 
  className = "w-full h-64 rounded-lg" 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          if (isMounted) {
            initializeMap();
          }
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey()}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (isMounted) {
            initializeMap();
          }
        };
        
        script.onerror = () => {
          if (isMounted) {
            setError('Failed to load Google Maps');
            setIsLoading(false);
          }
        };

        document.head.appendChild(script);

        // Cleanup function
        return () => {
          const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
          if (existingScript) {
            document.head.removeChild(existingScript);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError('Error loading map');
          setIsLoading(false);
        }
      }
    };

    const getGoogleMapsApiKey = () => {
      // In a real implementation, this would come from environment variables
      // For now, we'll use a placeholder - the actual key should be configured in Supabase secrets
      return 'YOUR_GOOGLE_MAPS_API_KEY';
    };

    const initializeMap = async () => {
      if (!mapRef.current || !window.google) {
        if (isMounted) {
          setError('Map container not available');
          setIsLoading(false);
        }
        return;
      }

      try {
        const geocoder = new window.google.maps.Geocoder();
        const searchQuery = address || venueName;

        if (!searchQuery) {
          // Default to Portland, OR if no address available
          const defaultLocation = { lat: 45.5152, lng: -122.6784 };
          createMap(defaultLocation);
          return;
        }

        // Geocode the address
        geocoder.geocode({ address: searchQuery }, (results: any[], status: string) => {
          if (!isMounted) return;

          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            createMap({ lat: location.lat(), lng: location.lng() });
          } else {
            // Fallback to Portland, OR
            const defaultLocation = { lat: 45.5152, lng: -122.6784 };
            createMap(defaultLocation);
          }
        });
      } catch (err) {
        if (isMounted) {
          setError('Error initializing map');
          setIsLoading(false);
        }
      }
    };

    const createMap = (location: { lat: number; lng: number }) => {
      if (!mapRef.current || !isMounted) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 15,
          styles: [
            {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{ color: '#eeeeee' }]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }]
            }
          ]
        });

        // Add marker for the venue
        new window.google.maps.Marker({
          position: location,
          map: map,
          title: venueName || 'Venue Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#047857',
            strokeWeight: 2
          }
        });

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (err) {
        setError('Error creating map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, [address, venueName]);

  if (error) {
    return (
      <div className={`${className} bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-gray-600 mb-2">Unable to load map</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center absolute inset-0 z-10`}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className={className} />
    </div>
  );
};