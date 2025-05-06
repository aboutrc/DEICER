import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapGL, NavigationControl, GeolocateControl, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import { MapPin, Plus, AlertTriangle, CheckCircle, ScanEye, Bell, RefreshCw, X, Eye } from 'lucide-react';
import { translations } from '../translations'; 
import MapControls from './MapControls';
import Modal from './Modal';
import { supabase, isSupabaseConfigured, testSupabaseConnection, fetchMarkersWithinRadius } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import maplibregl from 'maplibre-gl';
import { calculateDistance, formatDistance, calculateBearing } from '../lib/distanceUtils';
import { addAlert } from '../components/AlertSystem';
import { debounce } from '../lib/utils';

// Import components directly to reduce lazy loading overhead
import LocationSearch from './LocationSearch';
import { Marker, Popup } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useIsMobile } from '../hooks/useIsMobile';
import { isWithinLast24Hours } from '../lib/dateUtils';
import UniversitySelector from './UniversitySelector';
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
  const [alertMarkerId, setAlertMarkerId] = useState<string | null>(null);
  const [alertMarkerPosition, setAlertMarkerPosition] = useState<{lat: number, lng: number} | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [checkedExistingMarkers, setCheckedExistingMarkers] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const rafRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const fetchMarkersTimeoutRef = useRef<number | null>(null);
  const isAddingMarkerRef = useRef(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewStateRef = useRef(viewState);
  const t = translations[language];

  // Debounced version of setViewState to prevent too many updates
  const debouncedSetViewState = useCallback(
    debounce((newViewState) => {
      // Use requestAnimationFrame to batch updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        // Only update if the map isn't currently in a transition
        if (!mapRef.current?.isEasing()) {
          setViewState(newViewState);
        }
        setIsMapMoving(false);
        rafRef.current = null;
      });
    }, 50), // Reduced debounce time for more responsive feel
    []
  );

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
      console.log('Skipping marker check: already checked or Supabase not configured');
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
        const direction = userLocation ? calculateBearing(
          userLocation.lat, userLocation.lng,
          closestMarker.position.lat, closestMarker.position.lng
        ) : '';
        
        const message = `ICE marker detected ${formattedDistance} ${direction ? `to the ${direction}` : 'away'}`;
        console.log(message);
        
        setAlertMessage(message);
        setAlertMarkerId(closestMarker.id);
        setAlertMarkerPosition(closestMarker.position);
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

  // Check for existing markers when user location changes
  useEffect(() => {
    if (userLocation && !checkedExistingMarkers) {
      console.log('Checking for existing markers on location change');
      checkExistingMarkers(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, checkExistingMarkers, checkedExistingMarkers]);

  // Update viewStateRef when viewState changes
  useEffect(() => {
    viewStateRef.current = viewState;
    
    // Cleanup RAF on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [viewState]);

  useEffect(() => {
    // Get user location once on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Only set view state if not already set
          if (!selectedUniversity) {
            setViewState(prev => ({
              ...prev,
              latitude,
              longitude,
              zoom: DEFAULT_ZOOM
            }));
          }
          
          // Initial fetch of markers
          refreshMarkers();
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

    // Check Supabase connection once
    const checkConnectionAndSubscribe = async () => {
      const isConfigured = isSupabaseConfigured();
      if (!isConfigured) return;

      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);
    };

    checkConnectionAndSubscribe();

    return () => {
      if (fetchMarkersTimeoutRef.current) clearTimeout(fetchMarkersTimeoutRef.current);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [userLocation, selectedUniversity, t.errors, checkExistingMarkers, checkedExistingMarkers]);

  // Optimized map movement handler
  const handleMapMove = useCallback((evt: ViewStateChangeEvent) => {
    // Skip updates during transitions to avoid jitter
    if (mapRef.current?.isEasing() || isMapMoving) {
      return;
    }
    
    // Only set the flag if we're not already moving
    setIsMapMoving(true);
    
    // Use debounced update for smoother experience
    debouncedSetViewState(evt.viewState);
  }, [debouncedSetViewState, isMapMoving]);

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

  // Function to manually refresh markers
  const refreshMarkers = async () => {
    try {
      console.log('Manually refreshing markers');
      setIsRefreshing(true);

      if (!userLocation) {
        addAlert({
          message: "Location not available. Please enable location services and refresh the page.",
          type: 'warning',
          duration: 3000
        });
        setIsRefreshing(false);
        return;
      }

      // Fetch markers within radius
      const { markers: nearbyMarkers, distances } = await fetchMarkersWithinRadius(
        userLocation.lat, 
        userLocation.lng, 
        50
      );
      
      if (nearbyMarkers.length > 0) {
        console.log(`Found ${nearbyMarkers.length} markers within radius`);
        
        // Update markers state with new data
        setMarkers(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkers = nearbyMarkers.filter(m => !existingIds.has(m.id));
          
          if (newMarkers.length > 0) {
            addAlert({
              message: `Found ${newMarkers.length} new marker${newMarkers.length === 1 ? '' : 's'} in your area`,
              type: 'info',
              duration: 3000
            });
            return [...prev, ...newMarkers];
          }
          
          return prev;
        });
      } else {
        addAlert({
          message: "No new markers found in your area",
          type: 'info',
          duration: 3000
        });
      }
      
    } catch (err) {
      console.error('Error refreshing markers:', err);
      addAlert({
        message: "Failed to refresh markers",
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    } 
  };

  // Function to zoom to the alerted marker
  const zoomToAlertedMarker = useCallback(() => {
    if (!alertMarkerPosition || !mapRef.current) {
      console.log('Cannot highlight marker: missing position or map reference');
      return;
    }
    
    // Instead of zooming, just highlight the marker and provide directions
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        alertMarkerPosition.lat, alertMarkerPosition.lng
      );
      
      const distanceInMiles = distance / 1.60934; // Convert km to miles
      const formattedDistance = formatDistance(distanceInMiles);
      
      const direction = calculateBearing(
        userLocation.lat, userLocation.lng,
        alertMarkerPosition.lat, alertMarkerPosition.lng
      );
      
      // Show a more detailed alert with directions
      addAlert({
        message: `The marker is ${formattedDistance} to the ${direction} from your current location`,
        type: 'info',
        duration: 5000
      });
    }
    
    // If we have the marker ID, find and select it to show popup
    if (alertMarkerId) {
      const marker = markers.find(m => m.id === alertMarkerId);
      if (marker) {
        setSelectedMarker(marker);
        
        // Highlight the marker by pulsing it
        const markerElement = document.querySelector(`[data-marker-id="${marker.id}"]`);
        if (markerElement) {
          markerElement.classList.add('marker-highlight');
          setTimeout(() => {
            markerElement.classList.remove('marker-highlight');
          }, 3000);
        }
      }
    }
    
    // Hide the alert after zooming
    setShowAlert(false);
  }, [alertMarkerPosition, alertMarkerId, markers, userLocation]);

  return (
    <div className="h-screen w-screen relative">
      {/* Alert Popup */}
      {showAlert && (
        <div className="map-alert-box bg-blue-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-fade-in z-[1001]">
          <div className="flex items-center flex-1 mr-2">
            <Bell size={20} className="mr-2 flex-shrink-0 text-yellow-300" />
            <span className="line-clamp-2 alert-message-text">{alertMessage}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 alert-message-actions">
            <button 
              onClick={zoomToAlertedMarker}
              className="p-2 bg-green-600 hover:bg-green-500 rounded-full text-white flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="Show me"
            >
              <Eye size={18} />
            </button>
            <button 
              onClick={() => setShowAlert(false)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white flex items-center justify-center min-w-[36px] min-h-[36px]" 
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
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
        onMove={handleMapMove}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
        mapLib={maplibregl}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        touchZoomRotate={true}
        dragRotate={isMobile ? false : true}
        touchPitch={isMobile ? false : true}
        renderWorldCopies={false}
        transitionDuration={0}
        scrollZoom={{
          speed: 0.01,
          smooth: true
        }}
        optimizeForTerrain={false}
        attributionControl={false}
      >
        <NavigationControl 
          position="top-right" 
          showCompass={false} 
          visualizePitch={false}
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
                
                // If user has location, show distance and direction
                if (userLocation) {
                  const distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    marker.position.lat, marker.position.lng
                  );
                  
                  const distanceInMiles = distance / 1.60934; // Convert km to miles
                  const formattedDistance = formatDistance(distanceInMiles);
                  
                  const direction = calculateBearing(
                    userLocation.lat, userLocation.lng,
                    marker.position.lat, marker.position.lng
                  );
                  
                  addAlert({
                    message: `This marker is ${formattedDistance} to the ${direction} from your location`,
                    type: 'info',
                    duration: 3000
                  });
                }
              }}
            >
              <div 
                className={`relative ${!marker.active ? 'marker-archived' : ''}`}
                data-marker-id={marker.id}
              >
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
            anchor="top"
            onClose={() => setSelectedMarker(null)}
            className="marker-popup"
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
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
                      : new Date(selectedMarker.createdAt).toLocaleString()
                    }
                  </span>
                </div>
                
                {/* Add distance and direction information if user location is available */}
                {userLocation && (
                  <div className="flex items-center mt-2 text-blue-300">
                    <span className="mr-2">Distance:</span>
                    <span>
                      {formatDistance(
                        calculateDistance(
                          userLocation.lat, userLocation.lng,
                          selectedMarker.position.lat, selectedMarker.position.lng
                        ) / 1.60934 // Convert km to miles
                      )}
                      {' '}
                      {calculateBearing(
                        userLocation.lat, userLocation.lng,
                        selectedMarker.position.lat, selectedMarker.position.lng
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapGL>
      
      {/* Add Marker Button */}
      <div className="absolute bottom-48 left-4 z-10 buttonControls">
        <MapControls
          isAddingMarker={isAddingMarker}
          setIsAddingMarker={setIsAddingMarker} 
          isRefreshing={isRefreshing}
          refreshMarkers={refreshMarkers}
          language={language}
        />
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
              ...viewStateRef.current,
              latitude: university.geofence_coordinates.center.latitude,
              longitude: university.geofence_coordinates.center.longitude,
              zoom: 14,
              transitionDuration: 1000
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
              <p className="mt-2 text-yellow-400 font-bold">Remember to use the Refresh button to check for new markers</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MapView;