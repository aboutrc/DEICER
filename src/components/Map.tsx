import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapGL, Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Plus, AlertTriangle, CheckCircle, Bell, ScanEye } from 'lucide-react';
import { translations } from '../translations';
import Modal from './Modal';
import { supabase, isSupabaseConfigured, subscribeToIceMarkers, testSupabaseConnection } from '../lib/supabase';
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
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const fetchMarkersTimeoutRef = useRef<number | null>(null);
  const isAddingMarkerRef = useRef(false);
  const t = translations[language];

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: DEFAULT_ZOOM,
      transitionDuration: 1000
    }));
  }, []);

  const handleSaveMarker = async () => {
    if (!pendingMarker) return;
    
    if (!isSupabaseConnected) {
      setError('Database connection not available');
      setShowCategoryDialog(false);
      setPendingMarker(null);
      return;
    }
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('markers')
        .insert({
          latitude: pendingMarker.lat,
          longitude: pendingMarker.lng,
          category: selectedCategory,
          title: `${selectedCategory.toUpperCase()} Sighting`,
          description: `${selectedCategory.toUpperCase()} sighting reported at ${new Date().toLocaleString()}`,
          active: true,
          user_id: null
        })
        .select();
      
      if (error) {
        console.error('Error saving marker:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const newMarker: MarkerType = {
          id: data[0].id,
          position: { lat: data[0].latitude, lng: data[0].longitude },
          category: data[0].category as MarkerCategory,
          createdAt: new Date(data[0].created_at),
          active: data[0].active,
          lastConfirmed: data[0].last_confirmed ? new Date(data[0].last_confirmed) : undefined,
          reliability_score: data[0].reliability_score,
          negative_confirmations: data[0].negative_confirmations
        };
        
        setMarkers(prev => [newMarker, ...prev]);
        
        setFeedback({
          message: 'Marker added successfully',
          type: 'success'
        });
        
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error saving marker:', err);
      setError('Failed to save marker. Please try again.');
    } finally {
      setShowCategoryDialog(false);
      setPendingMarker(null);
    }
  };

  const fetchMarkers = async (retryCount = 0, maxRetries = 3) => {
    try {
      const isConfigured = isSupabaseConfigured();
      console.log('Fetch markers - Supabase configured:', isConfigured);
      
      if (!isConfigured) {
        console.warn('Supabase not configured, skipping marker fetch');
        setError(t.errors?.databaseConnection || 'Database connection not available');
        return;
      }

      const isConnected = await testSupabaseConnection();
      console.log('Fetch markers - Supabase connection test result:', isConnected);
      setIsSupabaseConnected(isConnected);
      
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      console.log('Fetching markers...');
      const response = await supabase
        .from('markers')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data, error } = response;
      console.log('Supabase query response:', {
        status: response.status,
        statusText: response.statusText,
        hasData: Boolean(data),
        dataCount: data?.length || 0,
        hasError: Boolean(error)
      });
      
      if (error) {
        console.error('Error fetching markers:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }
      
      if (data) {
        console.log(`Successfully fetched ${data.length} markers`);
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
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching markers:', err);
      
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1} of ${maxRetries})`);
        
        setError(`Connecting to database... (Attempt ${retryCount + 1} of ${maxRetries})`);
        
        setTimeout(() => {
          fetchMarkers(retryCount + 1, maxRetries);
        }, delay);
      } else {
        setError(t.errors?.fetchMarkers || 'Failed to load markers. Please try again later.');
      }
    }
  };

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      const isConfigured = isSupabaseConfigured();
      console.log('Initial Supabase configuration check:', isConfigured);
      
      if (isConfigured) {
        const isConnected = await testSupabaseConnection();
        console.log('Initial Supabase connection test result:', isConnected);
        setIsSupabaseConnected(isConnected);
        
        if (isConnected) {
          fetchMarkers();
        } else {
          setError('Could not connect to database. Please try again later.');
        }
      } else {
        setError('Database connection not available. Please check your configuration.');
      }
    };
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
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
    
    let unsubscribe: (() => void) | null = null;

    if (userLocation && isSupabaseConnected && isSupabaseConfigured()) {
      unsubscribe = subscribeToIceMarkers(
        userLocation.lat,
        userLocation.lng,
        50,
        (newMarker) => {
          setMarkers(prev => [...prev, newMarker]);
          
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

  return (
    <div className="h-screen w-screen relative">
      <div className="absolute inset-0 bg-gray-900">
        {mapLoaded ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">{t.loading || 'Loading maps...'}</p>
              {!isSupabaseConnected && (
                <p className="text-yellow-300 mt-2">Database connection unavailable. Some features may be limited.</p>
              )}
              {isSupabaseConnected === false && (
                <button 
                  onClick={() => fetchMarkers(0, 3)} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Connection
                </button>
              )}
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
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            style={{ marginTop: '120px' }}
            trackUserLocation={true}
            showUserHeading={true}
            showUserLocation={true}
            showAccuracyCircle={true}
            onGeolocate={(e) => {
              setUserLocation({
                lat: e.coords.latitude,
                lng: e.coords.longitude
              });
            }}
          />
          
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
          
          {markers.map(marker => (
            marker.active && (
            <Marker
              key={marker.id}
              longitude={marker.position.lng}
              latitude={marker.position.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedMarker(marker);
              }}
            >
              <div className="relative cursor-pointer">
                {marker.category === 'observer' ? (
                  <ScanEye
                    size={36}
                    className="drop-shadow-md transition-colors text-blue-500"
                  />
                ) : (
                  <img 
                    src="/police-officer.svg" 
                    alt="ICE" 
                    className="w-9 h-9 drop-shadow-md"
                    style={{ filter: "invert(21%) sepia(100%) saturate(7414%) hue-rotate(353deg) brightness(94%) contrast(128%)" }}
                  />
                )}
              </div>
            </Marker>
            )
          ))}
          
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
                          ? 'bg-red-500'
                          : selectedMarker.category === 'observer'
                          ? 'bg-blue-500'
                          : 'bg-blue-500'
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
                      setSelectedMarker(null);
                    }}
                  >
                    {t.stillPresent || 'Still Present'}
                  </button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium"
                    onClick={() => {
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
      
      <div className="fixed left-4 top-[60%] transform -translate-y-1/2 z-[1001] space-y-2">
      </div>
      
      <div className="fixed left-4 bottom-32 z-[1001] space-y-2">
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

          <LocationSearch
            onLocationSelect={handleLocationSelect}
            language={language as 'en' | 'es' | 'zh'}
            className="w-36"
          />
          
          <button
            onClick={() => navigate('/debug')} 
            className="hidden"
          />

          <UniversitySelector
            onSelect={onUniversitySelect}
            language={language} 
            className="w-36"
          />
        </div>
      </div>
      
      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] bg-red-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
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
      
      {showAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1002] bg-blue-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
          <Bell size={20} className="mr-2" />
          <span>{alertMessage}</span>
        </div>
      )}
      
      {showCategoryDialog && pendingMarker && (
        <Modal
          isOpen={showCategoryDialog && pendingMarker !== null}
          onClose={() => {
            setShowCategoryDialog(false);
            setPendingMarker(null);
          }}
          title={t.selectCategory || 'Select Category'}
        >
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedCategory('ice')}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                  selectedCategory === 'ice'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <img 
                  src="/police-officer.svg" 
                  alt="ICE" 
                  className="w-5 h-5"
                  style={{ filter: "invert(21%) sepia(100%) saturate(7414%) hue-rotate(353deg) brightness(94%) contrast(128%)" }}
                />
                <span className="font-medium">ICE</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('observer')}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                  selectedCategory === 'observer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ScanEye size={18} className="text-blue-500" />
                <span className="font-medium">Observer</span>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => {
                  handleSaveMarker();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MapView;