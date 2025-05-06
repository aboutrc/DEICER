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

// Convert miles to meters
export const milesToMeters = (miles: number): number => {
  return miles * 1609.34; // 1 mile = 1609.34 meters
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distanceInMiles: number): string => {
  if (distanceInMiles < 0.1) {
    // Convert to feet if less than 0.1 miles
    const feet = Math.round(distanceInMiles * 5280);
    return `${feet} feet`;
  } else {
    // Round to 1 decimal place
    return `${distanceInMiles.toFixed(1)} miles`;
  }
};

// Calculate bearing between two points
export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const startLat = deg2rad(lat1);
  const startLng = deg2rad(lon1);
  const destLat = deg2rad(lat2);
  const destLng = deg2rad(lon2);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  brng = (brng * 180 / Math.PI + 360) % 360; // in degrees

  // Convert bearing to cardinal direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const index = Math.round(brng / 45);
  
  return directions[index];
};