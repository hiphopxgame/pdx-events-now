import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapboxMapProps {
  address?: string;
  venueName?: string;
  className?: string;
  latitude?: number;
  longitude?: number;
}

export const MapboxMap: React.FC<MapboxMapProps> = ({ 
  address, 
  venueName, 
  className = "w-full h-64 rounded-lg",
  latitude,
  longitude
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        // Get Mapbox token using Supabase functions
        const { data, error } = await supabase.functions.invoke('mapbox-config');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error('Failed to fetch Mapbox token');
        }
        
        if (!data || !data.publicToken) {
          console.error('No token in response:', data);
          throw new Error('No Mapbox token received');
        }
        
        console.log('Mapbox config received successfully');
        mapboxgl.accessToken = data.publicToken;

        if (!mapContainer.current || !isMounted) return;

        // Use provided coordinates or geocode address if available
        let center: [number, number] = [-122.6784, 45.5152]; // Default to Portland, OR
        
        if (latitude && longitude) {
          center = [longitude, latitude];
        } else if (address) {
          // Try to geocode the address using Mapbox Geocoding API
          try {
            const geocodeResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${data.publicToken}&limit=1`
            );
            
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              if (geocodeData.features && geocodeData.features.length > 0) {
                const [lng, lat] = geocodeData.features[0].center;
                center = [lng, lat];
                console.log('Geocoded address:', address, 'to coordinates:', center);
              }
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed, using default location:', geocodeError);
          }
        }

        // Initialize map with error handling
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12', // Use a more basic style
          center: center,
          zoom: 15,
          pitch: 0,
        });

        // Add error handling for map
        map.current.on('error', (e) => {
          console.error('Mapbox map error:', e);
          if (isMounted) {
            setError('Map failed to load properly');
            setIsLoading(false);
          }
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        // Add marker
        const marker = new mapboxgl.Marker({
          color: '#10b981',
        })
          .setLngLat(center)
          .addTo(map.current);

        // Add popup if venue name is provided
        if (venueName) {
          const popup = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false
          })
            .setHTML(`<div class="text-sm font-medium text-gray-900">${venueName}</div>`);
          
          marker.setPopup(popup);
        }

        map.current.on('load', () => {
          if (isMounted) {
            setIsLoading(false);
          }
        });

        // Fallback timeout in case map doesn't load
        setTimeout(() => {
          if (isMounted && isLoading) {
            setIsLoading(false);
          }
        }, 10000);

      } catch (err) {
        console.error('Error initializing Mapbox map:', err);
        if (isMounted) {
          setError('Failed to load map - please check Mapbox configuration');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (map.current) {
        try {
          // Check if map is loaded before removing
          if (map.current.loaded()) {
            map.current.remove();
          } else {
            // If not loaded, wait a bit and then remove
            setTimeout(() => {
              if (map.current) {
                map.current.remove();
              }
            }, 100);
          }
        } catch (error) {
          console.warn('Error removing Mapbox map:', error);
          // Force remove if there's an error
          try {
            map.current.remove();
          } catch (finalError) {
            console.warn('Final cleanup error:', finalError);
          }
        }
      }
    };
  }, [address, venueName, latitude, longitude, isLoading]);

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
      <div ref={mapContainer} className={className} />
    </div>
  );
};