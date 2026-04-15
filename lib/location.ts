// GPS Location and Attendance Verification
import { haptics } from './native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface MeetingLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  isDefault: boolean;
}

const LOCATIONS_KEY = 'shg_meeting_locations';
const ATTENDANCE_LOG_KEY = 'shg_gps_attendance';

// ============ GET CURRENT LOCATION ============

export const getCurrentLocation = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('Unknown location error'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// ============ DISTANCE CALCULATION ============

// Haversine formula for distance between two points
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// ============ MEETING LOCATION MANAGEMENT ============

export const saveMeetingLocation = (location: Omit<MeetingLocation, 'id'>): MeetingLocation => {
  const locations = getMeetingLocations();
  
  // If setting as default, unset other defaults
  if (location.isDefault) {
    locations.forEach(l => l.isDefault = false);
  }
  
  const newLocation: MeetingLocation = {
    ...location,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  };
  
  locations.push(newLocation);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  
  return newLocation;
};

export const getMeetingLocations = (): MeetingLocation[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getDefaultMeetingLocation = (): MeetingLocation | null => {
  const locations = getMeetingLocations();
  return locations.find(l => l.isDefault) || locations[0] || null;
};

export const updateMeetingLocation = (id: string, updates: Partial<MeetingLocation>) => {
  const locations = getMeetingLocations().map(l => 
    l.id === id ? { ...l, ...updates } : l
  );
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
};

export const deleteMeetingLocation = (id: string) => {
  const locations = getMeetingLocations().filter(l => l.id !== id);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
};

// ============ GPS ATTENDANCE VERIFICATION ============

export interface GPSAttendanceRecord {
  id: string;
  meetingId: string;
  memberId: string;
  memberName: string;
  checkInTime: string;
  location: LocationCoords;
  meetingLocationId?: string;
  distanceFromVenue: number;
  isWithinRadius: boolean;
  verificationStatus: 'verified' | 'outside_radius' | 'location_unavailable';
}

export const verifyAttendanceLocation = async (
  meetingLocation: MeetingLocation
): Promise<{ verified: boolean; distance: number; coords?: LocationCoords; error?: string }> => {
  try {
    const currentLocation = await getCurrentLocation();
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      meetingLocation.latitude,
      meetingLocation.longitude
    );
    
    const verified = distance <= meetingLocation.radius;
    
    haptics.light();
    
    return {
      verified,
      distance: Math.round(distance),
      coords: currentLocation
    };
  } catch (error) {
    return {
      verified: false,
      distance: -1,
      error: (error as Error).message
    };
  }
};

export const recordGPSAttendance = async (
  meetingId: string,
  memberId: string,
  memberName: string,
  meetingLocation?: MeetingLocation
): Promise<GPSAttendanceRecord> => {
  let location: LocationCoords | null = null;
  let distance = -1;
  let isWithinRadius = false;
  let verificationStatus: GPSAttendanceRecord['verificationStatus'] = 'location_unavailable';
  
  try {
    location = await getCurrentLocation();
    
    if (meetingLocation) {
      distance = calculateDistance(
        location.latitude,
        location.longitude,
        meetingLocation.latitude,
        meetingLocation.longitude
      );
      
      isWithinRadius = distance <= meetingLocation.radius;
      verificationStatus = isWithinRadius ? 'verified' : 'outside_radius';
    } else {
      verificationStatus = 'verified'; // No location to verify against
    }
  } catch (error) {
    console.error('GPS attendance error:', error);
  }
  
  const record: GPSAttendanceRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    meetingId,
    memberId,
    memberName,
    checkInTime: new Date().toISOString(),
    location: location || { latitude: 0, longitude: 0, accuracy: 0, timestamp: Date.now() },
    meetingLocationId: meetingLocation?.id,
    distanceFromVenue: Math.round(distance),
    isWithinRadius,
    verificationStatus
  };
  
  // Save to storage
  const records = getGPSAttendanceRecords();
  records.push(record);
  localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(records));
  
  haptics.success();
  
  return record;
};

export const getGPSAttendanceRecords = (): GPSAttendanceRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getMeetingAttendanceRecords = (meetingId: string): GPSAttendanceRecord[] => {
  return getGPSAttendanceRecords().filter(r => r.meetingId === meetingId);
};

export const getMemberAttendanceRecords = (memberId: string): GPSAttendanceRecord[] => {
  return getGPSAttendanceRecords().filter(r => r.memberId === memberId);
};

// ============ LOCATION FORMATTING ============

export const formatDistance = (meters: number): string => {
  if (meters < 0) return 'Unknown';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
};

// ============ GOOGLE MAPS INTEGRATION ============

export const openInGoogleMaps = (lat: number, lng: number, label?: string) => {
  const url = label 
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`
    : `https://www.google.com/maps?q=${lat},${lng}`;
  
  window.open(url, '_blank');
};

export const getDirectionsUrl = (
  fromLat: number, 
  fromLng: number, 
  toLat: number, 
  toLng: number
): string => {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
};

// ============ REVERSE GEOCODING (Offline fallback) ============

export const getApproximateAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using free Nominatim API (OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SHG-Connect-App'
        }
      }
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    return data.display_name || formatCoordinates(lat, lng);
  } catch {
    return formatCoordinates(lat, lng);
  }
};
