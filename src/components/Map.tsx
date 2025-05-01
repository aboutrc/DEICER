import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapGL, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Plus, AlertTriangle, CheckCircle, ScanEye, Bell } from 'lucide-react';
import { translations } from '../translations'; 
import Modal from './Modal';
import { supabase, isSupabaseConfigured, subscribeToIceMarkers, testSupabaseConnection, fetchMarkersWithinRadius } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import maplibregl from 'maplibre-gl';
import { calculateDistance, formatDistance } from '../lib/distanceUtils';
import { addAlert } from '../components/AlertSystem';

const LocationSearch = React.lazy(() => import('./LocationSearch'));
const Marker = React.lazy(() => import('react-map-gl/maplibre').then(module => ({ default: module.Marker })));
const Popup = React.lazy(() => import('react-map-gl/maplibre').then(module => ({ default: module.Popup })));

import 'maplibre-gl/dist/maplibre-gl.css';
import { useIsMobile } from '../hooks/useIsMobile';
import { isWithinLast24Hours } from '../lib/dateUtils';
const UniversitySelector = React.lazy(() => import('./UniversitySelector'));
import type { University } from '../lib/universities';

const DEFAULT_ZOOM = 15.5;
const DEFAULT_CENTER = {
  longitude: -76.13459,
  latitude: 43.03643
};

const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

interface MapViewProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  selectedUniversity: University | null;
  onUniversitySelect: (university: University) => void;
}

const MapView = ({ language = 'en', selectedUniversity, onUniversitySelect }: MapViewProps) => {
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 45,
    bearing: 0
  });
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory>('ice');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [checkedExistingMarkers, setCheckedExistingMarkers] = useState(false);
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const fetchMarkersTimeoutRef = useRef<number | null>(null);
  const isAddingMarkerRef = useRef(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = translations[language];

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setViewState(prev => ({ ...prev, latitude, longitude, zoom: DEFAULT_ZOOM }));
        }, 
        (err) => {
          console.error('Geolocation error:', err);
          setError(t.errors?.location || 'Could not get your location');
        }
      );
    }
  }, []);

  // Function to check for existing markers near the user
  const checkExistingMarkers = useCallback(async (lat: number, lng: number) => {
    if (!isSupabaseConfigured() || checkedExistingMarkers) {
      return;
    }

    try {
      console.log(`Checking for existing markers near [${lat}, ${lng}]`);
      const { markers: nearbyMarkers, distances } = await fetchMarkersWithinRadius(lat, lng, 50, 'ice');
      
      if (nearbyMarkers.length > 0) {
        console.log(`Found ${nearbyMarkers.length} nearby markers`);
        
        // Add markers to state if they're not already there
        setMarkers(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkers = nearbyMarkers.filter(m => !existingIds.has(m.id));
          
          if (newMarkers.length > 0) {
            console.log(`Adding ${newMarkers.length} new markers to state`);
            return [...prev, ...newMarkers];
          }
          
          return prev;
        });
        
        // Show alert for the closest marker
        const closestMarker = nearbyMarkers[0];
        const distanceInMiles = distances[closestMarker.id];
        const formattedDistance = formatDistance(distanceInMiles);
        
        const message = `ICE marker detected ${formattedDistance} away`;
        console.log(message);
        
        setAlertMessage(message);
        setShowAlert(true);
        
        // Show notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Deicer Alert', {
            body: message,
            icon: '/police-officer.svg',
          });
        }
        
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        alertTimeoutRef.current = setTimeout(() => setShowAlert(false), 5000);
      } else {
        console.log('No nearby markers found');
      }
      
      setCheckedExistingMarkers(true);
    } catch (err) {
      console.error('Error checking existing markers:', err);
    }
  }, [checkedExistingMarkers]);

  // Fetch initial markers
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured, skipping marker fetch');
          return;
        }

        const { data, error } = await supabase
          .from('markers')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching markers:', error);
          setError(t.errors?.fetchMarkers || 'Could not load markers');
          return;
        }

        // Convert to our marker format
        const formattedMarkers: MarkerType[] = data.map(marker => ({
          id: marker.id,
          position: { lat: marker.latitude, lng: marker.longitude },
          category: marker.category as MarkerCategory,
          createdAt: new Date(marker.created_at),
          active: marker.active,
          lastConfirmed: marker.last_confirmed ? new Date(marker.last_confirmed) : undefined,
          reliability_score: marker.reliability_score,
          negative_confirmations: marker.negative_confirmations
        }));

        setMarkers(formattedMarkers);
      } catch (err) {
        console.error('Error in fetchMarkers:', err);
        setError(t.errors?.fetchMarkers || 'Could not load markers');
      }
    };

    fetchMarkers();
  }, [t.errors?.fetchMarkers]);

  // Check for existing markers when user location changes
  useEffect(() => {
    if (userLocation && !checkedExistingMarkers) {
      checkExistingMarkers(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, checkExistingMarkers, checkedExistingMarkers]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Check for existing markers near the new location
          checkExistingMarkers(latitude, longitude);

          if (!selectedUniversity) {
            setViewState(prev => ({
              ...prev,
              latitude,
              longitude,
              zoom: DEFAULT_ZOOM
            }));
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          let errorMessage = t.errors?.location || 'Could not get your location';

          switch (err.code) {
            case 1:
              errorMessage = t.errors?.locationDenied || 'Location access was denied';
              break;
            case 2:
              errorMessage = t.errors?.locationUnavailable || 'Location unavailable';
              break;
            case 3:
              errorMessage = t.errors?.locationTimeout || 'Location timed out';
              break;
          }

          setError(errorMessage);
        }
      );
    } else {
      setError(t.errors?.locationNotSupported || 'Geolocation not supported');
    }

    const checkConnectionAndSubscribe = async () => {
      const isConfigured = isSupabaseConfigured();
      if (!isConfigured) return;

      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);

      // Check for existing markers if we have user location
      if (userLocation && isConnected && !checkedExistingMarkers) {
        checkExistingMarkers(userLocation.lat, userLocation.lng);
      }

      if (userLocation && isConnected) {
        const unsubscribe = subscribeToIceMarkers(
          userLocation.lat,
          userLocation.lng,
          50,
          (newMarker, distanceInMiles) => {
            setMarkers(prev => [...prev, newMarker]);
            const formattedDistance = formatDistance(distanceInMiles);
            const message = `New ${newMarker.category.toUpperCase()} marker reported ${formattedDistance} away`;

            setAlertMessage(message);
            setShowAlert(true);

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Deicer Alert', {
                  body: message,
                  icon: '/police-officer.svg',
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    new Notification('Deicer Alert', {
                      body: message,
                      icon: '/police-officer.svg',
                    });
                  }
                });
              }
            }

            if (alertTimeoutRef.current) {
              clearTimeout(alertTimeoutRef.current);
            }
            alertTimeoutRef.current = setTimeout(() => setShowAlert(false), 5000);
          }
        );

        return () => unsubscribe && unsubscribe();
      }
    };

    checkConnectionAndSubscribe();

    return () => {
      if (fetchMarkersTimeoutRef.current) clearTimeout(fetchMarkersTimeoutRef.current);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [userLocation, selectedUniversity, t.errors, checkExistingMarkers, checkedExistingMarkers]);

  const handleMapClick = useCallback((e: maplibregl.MapLayerMouseEvent) => {
    if (isAddingMarker) {
      const { lng, lat } = e.lngLat;
      setPendingMarker({ lat, lng });
      setShowCategoryDialog(true);
    }
  }, [isAddingMarker]);

  const handleAddMarker = useCallback(async () => {
    if (!pendingMarker) return;
    
    try {
      const { data, error } = await supabase
        .from('markers')
        .insert([
          {
            latitude: pendingMarker.lat,
            longitude: pendingMarker.lng,
            category: selectedCategory,
            title: `${selectedCategory.toUpperCase()} Sighting`,
            description: `${selectedCategory.toUpperCase()} sighting reported by community member`,
            active: true
          }
        ])
        .select();

      if (error) throw error;

      // Add the new marker to the local state
      if (data && data[0]) {
        const newMarker: MarkerType = {
          id: data[0].id,
          position: { lat: data[0].latitude, lng: data[0].longitude },
          category: data[0].category as MarkerCategory,
          createdAt: new Date(data[0].created_at),
          active: data[0].active
        };

        setMarkers(prev => [...prev, newMarker]);
        
        // Show success message
        addAlert({
          message: `${selectedCategory.toUpperCase()} marker added successfully`,
          type: 'success',
          duration: 3000
        });
      }

      // Reset state
      setPendingMarker(null);
      setShowCategoryDialog(false);
      setIsAddingMarker(false);
    } catch (err) {
      console.error('Error adding marker:', err);
      addAlert({
        message: 'Failed to add marker',
        type: 'error',
        duration: 5000
      });
    }
  }, [pendingMarker, selectedCategory]);

  return (
    <div className="h-screen w-screen relative">
      {/* Alert Popup */}
      {showAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] bg-blue-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
          <Bell size={20} className="mr-2" />
          <span>{alertMessage}</span>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <p className="text-white">Loading map...</p>
        </div>
      )}
      <MapGL
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
        mapLib={maplibregl}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          showUserHeading={true}
          showUserLocation={true}
          showAccuracyCircle={true}
          onGeolocate={(e) => setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude })}
        />
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
          </Marker>
        )}
        {markers.map(marker => (
          <React.Fragment key={marker.id}>
            <Marker
              longitude={marker.position.lng}
              latitude={marker.position.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedMarker(marker);
              }}
            >
              <div className={`relative ${!marker.active ? 'marker-archived' : ''}`}>
                {marker.category === 'ice' ? (
                  <img src="/police-officer.svg" alt="ICE" className="w-9 h-9" />
                ) : (
                  <div className="bg-blue-500 p-2 rounded-full">
                    <ScanEye size={20} className="text-white" />
                  </div>
                )}
              </div>
            </Marker>
          </React.Fragment>
        ))}
        
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.position.lng}
            latitude={selectedMarker.position.lat}
            anchor="bottom"
            onClose={() => setSelectedMarker(null)}
            className="marker-popup"
            closeButton={true}
            closeOnClick={false}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {selectedMarker.category === 'ice' ? (
                    <img src="/police-officer.svg" alt="ICE" className="w-6 h-6 mr-2" />
                  ) : (
                    <ScanEye size={18} className="text-blue-400 mr-2" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {selectedMarker.category.toUpperCase()}
                  </h3>
                </div>
                {!selectedMarker.active && (
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
                    {t.archivedStatus || 'Archived'}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 mr-2">{t.lastConfirmed || 'Last confirmed'}:</span>
                  <span>
                    {selectedMarker.lastConfirmed 
                      ? new Date(selectedMarker.lastConfirmed).toLocaleString() 
                      : new Date(selectedMarker.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </MapGL>
      
      {/* Add Marker Button */}
      <div className="absolute bottom-48 left-4 z-10 flex flex-col gap-2 buttonControls">
        <button
          onClick={() => {
            setIsAddingMarker(!isAddingMarker);
            if (!isAddingMarker) {
              addAlert({
                message: t.clickToPlace || "Click on map to place mark",
                type: 'info',
                duration: 5000
              });
            }
          }}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-center ${
            isAddingMarker 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
          title={isAddingMarker ? "Cancel" : "Add Mark"}
        >
          <Plus size={20} className="mr-2" /> 
          <span>Add Mark</span>
        </button>
        
        <button
          onClick={() => {
            document.getElementById('location-search-button')?.click();
          }}
          className="px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center"
        >
          <MapPin size={20} className="mr-2" />
          <span>Search</span>
        </button>
        
        <button
          onClick={() => {
            document.getElementById('university-selector-button')?.click();
          }}
          className="px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center"
        >
          <MapPin size={20} className="mr-2" />
          <span>University</span>
        </button>
      </div>
      
      {/* Hidden components for functionality */}
      <div className="hidden">
        <LocationSearch 
          id="location-search-button"
          onLocationSelect={(lat, lng) => {
            setViewState(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              zoom: 14
            }));
          }}
          language={language}
        />
        
        <UniversitySelector
          id="university-selector-button"
          onSelect={(university) => {
            onUniversitySelect(university);
            setViewState(prev => ({
              ...prev,
              latitude: university.geofence_coordinates.center.latitude,
              longitude: university.geofence_coordinates.center.longitude,
              zoom: 14
            }));
          }}
          language={language}
        />
      </div>
      
      {/* Category Selection Dialog */}
      {showCategoryDialog && pendingMarker && (
        <Modal
          isOpen={showCategoryDialog}
          onClose={() => {
            setShowCategoryDialog(false);
            setPendingMarker(null);
            setIsAddingMarker(false);
          }}
          title={t.selectCategory || "Select Category"}
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('ice');
                  handleAddMarker();
                }}
                className="p-4 bg-red-900/70 hover:bg-red-800 text-white rounded-lg flex flex-col items-center"
              >
                <img src="/police-officer.svg" alt="ICE" className="w-12 h-12 mb-2" />
                <span>ICE</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedCategory('observer');
                  handleAddMarker();
                }}
                className="p-4 bg-blue-900/70 hover:bg-blue-800 text-white rounded-lg flex flex-col items-center"
              >
                <ScanEye size={32} className="mb-2" />
                <span>{t.categories?.observer || 'Observer'}</span>
              </button>
            </div>
            
            <div className="text-center text-gray-400 text-sm mt-4">
              <p>Observer markers will automatically expire after 1 hour</p>
              <p>ICE markers will remain active for 24 hours</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MapView;