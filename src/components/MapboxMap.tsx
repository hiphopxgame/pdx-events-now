import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';

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
        // Get Mapbox token
        const response = await fetch('https://vtknmauyvmuaryttnenx.supabase.co/functions/v1/mapbox-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }
        
        const data = await response.json();
        mapboxgl.accessToken = data.publicToken;

        if (!mapContainer.current || !isMounted) return;

        // Use provided coordinates or default to Portland, OR
        let center: [number, number] = [-122.6784, 45.5152];
        
        if (latitude && longitude) {
          center = [longitude, latitude];
        } else if (address || venueName) {
          // For now, use default location. In production, you'd geocode the address
          // You could integrate with Mapbox Geocoding API here
          center = [-122.6784, 45.5152];
        }

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: center,
          zoom: 15,
          pitch: 0,
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

      } catch (err) {
        console.error('Error initializing Mapbox map:', err);
        if (isMounted) {
          setError('Failed to load map');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
      }
    };
  }, [address, venueName, latitude, longitude]);

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