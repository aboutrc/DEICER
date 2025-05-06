import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Marker, MarkerCategory } from '../types';
import { calculateDistance, calculateBearing } from './distanceUtils';

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
        eventsPerSecond: 10
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
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing:', {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseAnonKey)
    });
    return false;
  }
  return true;
};

// Helper function to test Supabase connection with improved retries
export const testSupabaseConnection = async (retryCount = 0, maxRetries = 5) => {
  try {
    // Check if credentials exist
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping connection test');
      return false;
    }

    // Test connection with a simple query
    const { data, error, status } = await supabase
      .from('markers')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    // Log response details for debugging
    console.debug('Supabase connection test response:', {
      status,
      hasData: Boolean(data),
      hasError: Boolean(error)
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    
    // Network-related errors that should trigger retry
    const shouldRetry = (
      err instanceof Error && (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('network request failed') ||
        err.message.includes('TypeError') ||
        err.message.includes('Network request failed') ||
        err.message.includes('upstream connect error')
      )
    );
    
    // Implement exponential backoff for retries
    if (shouldRetry && retryCount < maxRetries) {
      const baseDelay = 1000; // Start with 1 second
      const maxDelay = 10000; // Cap at 10 seconds
      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
      
      console.log(`Retrying connection test in ${delay}ms (Attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return testSupabaseConnection(retryCount + 1, maxRetries);
    }
    
    return false;
  }
};

// Fetch existing markers within a radius
export const fetchMarkersWithinRadius = async (
  userLat: number,
  userLng: number,
  radiusMiles: number,
  category?: MarkerCategory
): Promise<{ markers: Marker[]; distances: Record<string, number> }> => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping marker fetch');
      return { markers: [], distances: {} };
    }
    
    const radiusKm = milesToKm(radiusMiles);
    console.log(`Fetching markers within ${radiusMiles} miles (${radiusKm} km) of [${userLat}, ${userLng}]`);
    
    // Build query
    let query = supabase
      .from('markers')
      .select('*')
      .eq('active', true);
    
    // Add category filter if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching markers:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return { markers: [], distances: {} };
    }
    
    // Calculate distance for each marker and filter by radius
    const markersWithDistance: { marker: Marker; distanceKm: number }[] = data
      .map(item => {
        const distanceKm = calculateDistance(
          userLat, 
          userLng, 
          item.latitude, 
          item.longitude
        );
        
        const marker: Marker = {
          id: item.id,
          position: { lat: item.latitude, lng: item.longitude },
          category: item.category as MarkerCategory,
          createdAt: new Date(item.created_at),
          active: item.active,
          lastConfirmed: item.last_confirmed ? new Date(item.last_confirmed) : undefined,
          reliability_score: item.reliability_score,
          negative_confirmations: item.negative_confirmations
        };
        
        return { marker, distanceKm };
      })
      .filter(({ distanceKm }) => distanceKm <= radiusKm);
    
    // Sort by distance
    markersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    
    // Create distances record
    const distances: Record<string, number> = {};
    markersWithDistance.forEach(({ marker, distanceKm }) => {
      distances[marker.id] = distanceKm / 1.60934; // Convert to miles
    });
    
    // Extract just the markers
    const markers = markersWithDistance.map(item => item.marker);
    
    console.log(`Found ${markers.length} markers within radius`);
    return { markers, distances };
  } catch (err) {
    console.error('Error fetching markers within radius:', err);
    return { markers: [], distances: {} };
  }
};

// Convert miles to kilometers
const milesToKm = (miles: number): number => {
  return miles * 1.60934;
};