import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Map as MapGL, Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Plus, AlertTriangle, Database, CheckCircle, Lightbulb as Lighthouse, Bell } from 'lucide-react';
import { translations } from '../translations';
import { supabase, isSupabaseConfigured, testSupabaseConnection, subscribeToIceMarkers } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import LocationSearch from './LocationSearch';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useIsMobile } from '../hooks/useIsMobile';
import { isWithinLast24Hours } from '../lib/dateUtils';
import UniversitySelector from './UniversitySelector';
import type { University } from '../lib/universities'; 

// US bounds
const US_BOUNDS = {
  minLng: -125.0,
  minLat: 24.396308,
  maxLng: -66.934570,
  maxLat: 49.384358
};

// Default to a zoom level appropriate for campus view
const DEFAULT_ZOOM = 15.5;

// Default center (will be replaced by user location)
const DEFAULT_CENTER = {
  longitude: -76.13459,
  latitude: 43.03643
};

// MapTiler API key
const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

interface MapViewProps {
  language?: 'en' | 'es';
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
  const [pendingMarker, setPendingMarker] = useState<{lat: number; lng: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory>('ice');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const fetchMarkersTimeoutRef = useRef<number | null>(null);
  const isAddingMarkerRef = useRef(false);
  const t = translations[language];

  // Add the handleLocationSelect function
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: DEFAULT_ZOOM,
      transitionDuration: 1000
    }));
  }, []);

  // Initialize map and fetch markers
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);
      
      if (isConnected) {
        fetchMarkers();
      }
    };
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Only set view state if no university is selected
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
          setError(t.errors?.location || 'Could not get your location');
        }
      );
    }
    
    checkSupabaseConnection();
    
    // Set up subscription to real-time marker updates
    let unsubscribe: (() => void) | null = null;
    
    if (userLocation) {
      unsubscribe = subscribeToIceMarkers(
        userLocation.lat,
        userLocation.lng,
        50, // 50 mile radius
        (newMarker) => {
          setMarkers(prev => [...prev, newMarker]);
          
          // Show alert for new marker
          setAlertMessage(`New ${newMarker.category.toUpperCase()} marker reported nearby`);
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
        }
      );
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (fetchMarkersTimeoutRef.current) {
        clearTimeout(fetchMarkersTimeoutRef.current);
      }
    };
  }, [userLocation, selectedUniversity]);
  
  // Update view when university is selected
  useEffect(() => {
    if (selectedUniversity) {
      const { latitude, longitude } = selectedUniversity.geofence_coordinates.center;
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude,
        zoom: DEFAULT_ZOOM,
        transitionDuration: 1000
      }));
    }
  }, [selectedUniversity]);
  
  // Fetch markers from database
  const fetchMarkers = async () => {
    try {
      const { data, error } = await supabase
        .from('markers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
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
      }
    } catch (err) {
      console.error('Error fetching markers:', err);
      setError(t.errors?.fetchMarkers || 'Failed to load markers');
    }
  };

  return (
    <div className="h-screen w-screen relative">
      {/* Map container */}
      <div className="absolute inset-0 bg-gray-900">
        {mapLoaded ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">{t.loading || 'Loading maps...'}</p>
            </div>
          </div>
        )}
        
        <MapGL
          {...viewState}
          ref={mapRef}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
          mapLib={maplibregl}
          attributionControl={false}
          onLoad={() => setMapLoaded(true)}
          onClick={e => {
            if (isAddingMarker) {
              const { lat, lng } = e.lngLat;
              setPendingMarker({ lat, lng });
              setShowCategoryDialog(true);
              setIsAddingMarker(false);
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Navigation controls */}
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            trackUserLocation
            onGeolocate={(e) => {
              setUserLocation({
                lat: e.coords.latitude,
                lng: e.coords.longitude
              });
            }}
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="center"
            >
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                <div className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
              </div>
            </Marker>
          )}
          
          {/* Display all markers */}
          {markers.map(marker => (
            <Marker
              key={marker.id}
              longitude={marker.position.lng}
              latitude={marker.position.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedMarker(marker);
              }}
              className={marker.active ? '' : 'marker-archived'}
            >
              <div className="relative cursor-pointer">
                <MapPin
                  size={36}
                  className={`drop-shadow-md transition-colors ${
                    marker.category === 'ice'
                      ? 'text-blue-500'
                      : marker.category === 'police'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}
                />
              </div>
            </Marker>
          ))}
          
          {/* Selected marker popup */}
          {selectedMarker && (
            <Popup
              longitude={selectedMarker.position.lng}
              latitude={selectedMarker.position.lat}
              anchor="bottom"
              onClose={() => setSelectedMarker(null)}
              closeOnClick={false}
              className="marker-popup"
              maxWidth="400px"
            >
              <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        selectedMarker.category === 'ice'
                          ? 'bg-blue-500'
                          : selectedMarker.category === 'police'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    ></div>
                    <span className="text-white font-medium uppercase text-sm">
                      {selectedMarker.category}
                    </span>
                  </div>
                  {!selectedMarker.active && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {t.archivedStatus || 'Archived'}
                    </span>
                  )}
                </div>
                
                <div className="text-gray-300 text-sm mb-3">
                  {new Date(selectedMarker.createdAt).toLocaleString()}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-200">
                    <Bell size={16} className="mr-2 text-gray-400" />
                    <span>
                      {t.lastConfirmed || 'Last confirmed'}: {' '}
                      {selectedMarker.lastConfirmed
                        ? new Date(selectedMarker.lastConfirmed).toLocaleString()
                        : new Date(selectedMarker.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium"
                    onClick={() => {
                      // Handle confirmation
                      setSelectedMarker(null);
                    }}
                  >
                    {t.stillPresent || 'Still Present'}
                  </button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium"
                    onClick={() => {
                      // Handle not present
                      setSelectedMarker(null);
                    }}
                  >
                    {t.notPresent || 'Not Present'}
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </MapGL>
      </div>
      
      <div className="fixed bottom-32 left-4 z-[1001] space-y-2 w-72">
        <div className="flex flex-col gap-2">
          <button
            className={`w-36 px-4 py-2 rounded-lg shadow-md flex items-center justify-center ${
              isAddingMarker
                ? 'bg-green-600/90 backdrop-blur-sm text-white hover:bg-green-700'
                : 'bg-gray-800/90 backdrop-blur-sm text-gray-100 hover:bg-gray-700'
            }`}
            onClick={() => setIsAddingMarker(!isAddingMarker)}
          >
            <Plus className="mr-2" size={20} />
            {isAddingMarker ? t.clickToPlace : 'Add Mark'}
          </button>

          <div className="relative">
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              language={language as 'en' | 'es' | 'zh'}
              className="w-full bg-black/80 backdrop-blur-md shadow-lg border border-gray-700/50"
            />
          </div>
          
          <div className="mt-2 w-full">
            <UniversitySelector 
              onSelect={onUniversitySelect}
              language={language} 
              className="w-full bg-black/80 backdrop-blur-md shadow-lg border border-gray-700/50"
            />
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] bg-red-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Success/error feedback */}
      {feedback && (
        <div
          className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] ${
            feedback.type === 'success' ? 'bg-green-900/90' : 'bg-red-900/90'
          } backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle size={20} className="mr-2" />
          ) : (
            <AlertTriangle size={20} className="mr-2" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
      
      {/* New marker alert */}
      {showAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] bg-blue-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
          <Bell size={20} className="mr-2" />
          <span>{alertMessage}</span>
        </div>
      )}
      
      {/* Category selection dialog */}
      {showCategoryDialog && pendingMarker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {t.selectCategory || 'Select Category'}
            </h3>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedCategory('ice')}
                className={`w-full px-4 py-3 rounded-lg flex items-center ${
                  selectedCategory === 'ice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span>ICE</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('police')}
                className={`w-full px-4 py-3 rounded-lg flex items-center ${
                  selectedCategory === 'police'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span>Police</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('observer')}
                className={`w-full px-4 py-3 rounded-lg flex items-center ${
                  selectedCategory === 'observer'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span>Observer</span>
              </button>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCategoryDialog(false);
                  setPendingMarker(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle marker creation
                  setShowCategoryDialog(false);
                  setPendingMarker(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;