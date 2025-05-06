import React, { useState, useRef, useEffect } from 'react';
import { Map as MapGL, NavigationControl, GeolocateControl, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapControls from './MapControls';
import { addAlert } from './AlertSystem';
import LocationSearch from './LocationSearch';
import UniversitySelector from './UniversitySelector';
import type { University } from '../lib/universities';
import { supabase, fetchMarkersWithinRadius, testSupabaseConnection } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import { ScanEye, Plus, AlertTriangle, X } from 'lucide-react';
import { calculateDistance, formatDistance, calculateBearing } from '../lib/distanceUtils';
import Modal from './Modal';

const Marker = React.lazy(() => import('react-map-gl/maplibre').then(module => ({ default: module.Marker })));
const Popup = React.lazy(() => import('react-map-gl/maplibre').then(module => ({ default: module.Popup })));

const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

const DEFAULT_ZOOM = 15.5;
const DEFAULT_CENTER = {
  longitude: -76.13459,
  latitude: 43.03643
};

const MapDebug: React.FC = () => {
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    zoom: number;
    lat: number;
    lng: number;
    lastMoveTime: number;
    moveCount: number;
  }>({
    zoom: DEFAULT_ZOOM,
    lat: DEFAULT_CENTER.latitude,
    lng: DEFAULT_CENTER.longitude,
    lastMoveTime: Date.now(),
    moveCount: 0
  });
  
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory>('ice');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  
  const mapRef = useRef<maplibregl.Map | null>(null);
  const moveCountRef = useRef(0);

  // Get user location and fetch initial markers on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setViewState(prev => ({
            ...prev,
            latitude,
            longitude,
            zoom: DEFAULT_ZOOM
          }));
          
          // Check Supabase connection before fetching
          checkConnectionAndFetchMarkers(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Could not get your location');
        }
      );
    } 
  }, []);

  // Check Supabase connection and fetch markers
  const checkConnectionAndFetchMarkers = async (lat: number, lng: number) => {
    try {
      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);
      
      if (isConnected) {
        fetchInitialMarkers(lat, lng);
      } else {
        setError('Database connection failed. Please try again later.');
      }
    } catch (err) {
      console.error('Connection check error:', err);
      setError('Failed to connect to database');
    }
  };

  // Function to fetch markers once on component mount
  const fetchInitialMarkers = async (lat: number, lng: number) => {
    try {
      const { markers: nearbyMarkers } = await fetchMarkersWithinRadius(lat, lng, 50);
      
      if (nearbyMarkers.length > 0) {
        setMarkers(nearbyMarkers);
        addAlert({
          message: `Found ${nearbyMarkers.length} markers in your area`,
          type: 'info',
          duration: 3000
        });
      } else {
        addAlert({
          message: "No markers found in your area",
          type: 'info',
          duration: 3000
        });
      }
    } catch (err) {
      console.error('Error fetching markers:', err);
      setError('Failed to fetch markers');
    }
  };
  
  // Handle map click for adding markers
  const handleMapClick = (e: maplibregl.MapLayerMouseEvent) => {
    if (isAddingMarker) {
      const { lng, lat } = e.lngLat;
      setPendingMarker({ lat, lng });
      setShowCategoryDialog(true);
    }
  };

  // Function to manually refresh markers
  const refreshMarkers = async () => {
    try {
      setIsRefreshing(true);
      
      if (!userLocation) {
        addAlert({
          message: "Location not available. Please enable location services.",
          type: 'warning',
          duration: 3000
        });
        setIsRefreshing(false);
        return;
      }
      
      // Fetch markers within radius
      const { markers: nearbyMarkers } = await fetchMarkersWithinRadius(
        userLocation.lat, 
        userLocation.lng, 
        50
      );
      
      if (nearbyMarkers.length > 0) {
        // Update markers state with new data
        setMarkers(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkers = nearbyMarkers.filter(m => !existingIds.has(m.id));
          
          if (newMarkers.length > 0) {
            addAlert({
              message: `Found ${newMarkers.length} new markers in your area`,
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

  // Function to add a new marker
  const handleAddMarker = async () => {
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
  };

  // Handle map movement
  const handleMapMove = (evt: ViewStateChangeEvent) => {
    // Skip updates during transitions to avoid jitter
    if (mapRef.current?.isEasing()) {
      return;
    }
    
    // Update view state
    setViewState(evt.viewState);
    
    // Update debug info
    moveCountRef.current += 1;
    setDebugInfo({
      zoom: evt.viewState.zoom,
      lat: evt.viewState.latitude,
      lng: evt.viewState.longitude,
      lastMoveTime: Date.now(),
      moveCount: moveCountRef.current
    });
  };

  return (
    <div className="h-screen w-screen relative">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <p className="text-white">Loading map...</p>
        </div>
      )}
      
      {/* Debug Info Panel */}
      <div className="absolute top-4 left-4 z-20 bg-black/70 text-white p-4 rounded-lg text-sm font-mono">
        <h3 className="font-bold mb-2">Map Debug Info</h3>
        <div>Zoom: {debugInfo.zoom.toFixed(4)}</div>
        <div>Lat: {debugInfo.lat.toFixed(6)}</div>
        <div>Lng: {debugInfo.lng.toFixed(6)}</div>
        <div>Move Count: {debugInfo.moveCount}</div>
        <div>Last Move: {new Date(debugInfo.lastMoveTime).toLocaleTimeString()}</div>
      </div>
      
      <MapGL
        {...viewState}
        ref={(ref) => {
          if (ref) {
            mapRef.current = ref.getMap();
          }
        }}
        onMove={handleMapMove}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
        mapLib={maplibregl}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        touchZoomRotate={true}
        dragRotate={false}
        touchPitch={false}
        scrollZoom={{
          speed: 0.01,
          smooth: true
        }}
        attributionControl={false}
      >
        <NavigationControl 
          position="top-right" 
          showCompass={false} 
          visualizePitch={false}
        />
        <GeolocateControl
          position="top-right"
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
          positionOptions={{
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
          }}
        />
        
        {/* Display user location */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
          </Marker>
        )}
        
        {/* Display markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
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
        ))}
        
        {/* Display selected marker popup */}
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
                    Archived
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 mr-2">Created:</span>
                  <span>
                    {new Date(selectedMarker.createdAt).toLocaleString()}
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
      
      {/* Map Controls */}
      <div className="absolute bottom-48 left-4 z-10 flex flex-col gap-2 buttonControls">
        <MapControls
          isAddingMarker={isAddingMarker}
          setIsAddingMarker={setIsAddingMarker}
          isRefreshing={isRefreshing}
          refreshMarkers={refreshMarkers}
          language="en"
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
          language="en"
        />
        
        <UniversitySelector
          id="university-selector-button"
          onSelect={(university: University) => {
            setViewState(prev => ({
              ...prev,
              latitude: university.geofence_coordinates.center.latitude,
              longitude: university.geofence_coordinates.center.longitude,
              zoom: 14
            }));
          }}
          language="en"
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
          title="Select Category"
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
                <span>Observer</span>
              </button>
            </div>
            
            <div className="text-center text-gray-400 text-sm mt-4">
              <p>Observer markers will automatically expire after 1 hour</p>
              <p>ICE markers will remain active for 24 hours</p>
              <p className="mt-2 text-yellow-400">Remember to use the Refresh button to check for new markers</p>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/80 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-3 p-1 rounded-full hover:bg-red-800"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MapDebug;