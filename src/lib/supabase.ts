import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Marker, MarkerCategory } from '../types';

// Get Supabase credentials from environment variables with debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with proper configuration
export const supabase = createClient<Database>( 
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.39.7'
      }
    }
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const configured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
  return configured;
};

// Helper function to test Supabase connection with retries
export const testSupabaseConnection = async (retryCount = 0, maxRetries = 3) => {
  try {
    // Check if credentials exist
    if (!isSupabaseConfigured()) {
      return false;
    }

    // Test connection with a simple query
    const { data, error } = await supabase
      .from('markers')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    
    // Retry on network errors with exponential backoff
    if (retryCount < maxRetries && err instanceof Error && 
        (err.message.includes('Failed to fetch') || 
         err.message.includes('NetworkError') || 
         err.message.includes('upstream connect error') || 
         err.message.includes('TypeError') ||
         err.message.includes('Network request failed'))) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff capped at 8s
      await new Promise(resolve => setTimeout(resolve, delay));
      try {
        return await testSupabaseConnection(retryCount + 1, maxRetries);
      } catch (retryError) {
        return false;
      }
    }
    
    return false;
  }
};

// Calculate distance between two points in kilometers
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Convert miles to kilometers
const milesToKm = (miles: number): number => {
  return miles * 1.60934;
};

// Subscribe to new ICE markers within a specified radius
export const subscribeToIceMarkers = (
  userLat: number,
  userLng: number,
  radiusMiles: number,
  callback: (marker: Marker) => void
): (() => void) => {
  if (!isSupabaseConfigured()) {
    console.warn('Missing parameters for subscribeToIceMarkers');
    return () => {}; // Return empty function if parameters are missing
  }
  
  const radiusKm = milesToKm(radiusMiles);
  
  // Subscribe to the markers table for inserts
  const subscription = supabase
    .channel('ice-markers')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'markers',
        filter: 'category=eq.ice'
      },
      (payload) => {
        const newMarker = payload.new;
        if (!newMarker) return;
        
        // Calculate distance between user and new marker
        const distance = calculateDistance(
          userLat,
          userLng,
          newMarker.latitude,
          newMarker.longitude
        );
        
        // If within radius, trigger callback
        if (distance <= radiusKm && callback) {
          const marker: Marker = {
            id: newMarker.id,
            position: { lat: newMarker.latitude, lng: newMarker.longitude },
            category: newMarker.category as MarkerCategory,
            createdAt: new Date(newMarker.created_at),
            active: newMarker.active
          };
          
          callback(marker);
        }
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
};