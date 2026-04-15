import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, CheckCircle, XCircle, AlertCircle,
  Plus, Trash2, Edit2, Target, Loader2, ExternalLink,
  Users, Clock, Shield
} from 'lucide-react';
import { 
  getCurrentLocation,
  saveMeetingLocation,
  getMeetingLocations,
  deleteMeetingLocation,
  getDefaultMeetingLocation,
  verifyAttendanceLocation,
  recordGPSAttendance,
  getMeetingAttendanceRecords,
  formatDistance,
  formatCoordinates,
  openInGoogleMaps,
  MeetingLocation,
  GPSAttendanceRecord
} from '../lib/location';
import toast from 'react-hot-toast';

export const GPSAttendance: React.FC = () => {
  const { t } = useLanguage();
  const { members, meetings } = useData();
  
  const [activeTab, setActiveTab] = useState<'checkin' | 'locations' | 'history'>('checkin');
  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MeetingLocation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    distance: number;
    error?: string;
  } | null>(null);
  
  // Add Location Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationRadius, setLocationRadius] = useState(100);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Check-in
  const [selectedMember, setSelectedMember] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    setLocations(getMeetingLocations());
    setSelectedLocation(getDefaultMeetingLocation());
  }, []);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setNewLocationCoords({ lat: coords.latitude, lng: coords.longitude });
      toast.success('Location captured!', { icon: '📍' });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveLocation = () => {
    if (!locationName || !newLocationCoords) {
      toast.error('Please fill all required fields');
      return;
    }

    saveMeetingLocation({
      name: locationName,
      address: locationAddress,
      latitude: newLocationCoords.lat,
      longitude: newLocationCoords.lng,
      radius: locationRadius,
      isDefault: locations.length === 0
    });

    setLocations(getMeetingLocations());
    setShowAddForm(false);
    resetForm();
    toast.success('Location saved!', { icon: '✅' });
  };

  const resetForm = () => {
    setLocationName('');
    setLocationAddress('');
    setLocationRadius(100);
    setNewLocationCoords(null);
  };

  const handleDeleteLocation = (id: string) => {
    deleteMeetingLocation(id);
    setLocations(getMeetingLocations());
    if (selectedLocation?.id === id) {
      setSelectedLocation(getDefaultMeetingLocation());
    }
    toast.success('Location deleted');
  };

  const handleVerifyLocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a meeting location');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyAttendanceLocation(selectedLocation);
      setVerificationResult(result);
      
      if (result.verified) {
        toast.success('You are at the meeting location!', { icon: '✅' });
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.error(`You are ${formatDistance(result.distance)} away from the venue`);
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    const member = members.find(m => m.id === selectedMember);
    if (!member) return;

    setIsCheckingIn(true);

    try {
      const record = await recordGPSAttendance(
        meetings[0]?.id || 'manual',
        member.id,
        member.name,
        selectedLocation || undefined
      );

      if (record.verificationStatus === 'verified') {
        toast.success(`${member.name} checked in!`, { icon: '✅' });
      } else if (record.verificationStatus === 'outside_radius') {
        toast.error(`${member.name} is ${formatDistance(record.distanceFromVenue)} away`);
      } else {
        toast.success(`${member.name} checked in (location unavailable)`);
      }

      setSelectedMember('');
    } catch (error) {
      toast.error('Check-in failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const renderCheckIn = () => (
    <div className="space-y-6">
      {/* Location Status */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <MapPin className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Meeting Location</h3>
              <p className="text-white/40 text-sm">
                {selectedLocation ? selectedLocation.name : 'No location set'}
              </p>
            </div>
          </div>

          {selectedLocation && (
            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-white/60 text-sm">{selectedLocation.address || formatCoordinates(selectedLocation.latitude, selectedLocation.longitude)}</p>
              <p className="text-white/40 text-xs mt-1">Radius: {selectedLocation.radius}m</p>
            </div>
          )}

          <button
            onClick={handleVerifyLocation}
            disabled={isVerifying || !selectedLocation}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Navigation size={18} />
            )}
            Verify My Location
          </button>

          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                verificationResult.verified 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {verificationResult.verified ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : (
                <XCircle className="text-red-400" size={24} />
              )}
              <div>
                <p className={`font-bold ${verificationResult.verified ? 'text-green-400' : 'text-red-400'}`}>
                  {verificationResult.verified ? 'At Meeting Location' : 'Outside Meeting Area'}
                </p>
                <p className="text-white/50 text-sm">
                  {verificationResult.distance >= 0 
                    ? `Distance: ${formatDistance(verificationResult.distance)}`
                    : verificationResult.error}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Check-in */}
      <div>
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Quick Check-in</h3>
        
        <div className="glass-panel p-4 rounded-2xl space-y-4">
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Select member...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || !selectedMember}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCheckingIn ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            Check In Member
          </button>
        </div>
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full glass-panel p-4 rounded-2xl flex items-center justify-center gap-2 text-blue-400 hover:bg-white/5 transition-colors"
      >
        <Plus size={20} />
        Add Meeting Location
      </button>

      {locations.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <MapPin className="mx-auto mb-3 text-white/20" size={48} />
          <p className="text-white/40">No locations saved</p>
          <p className="text-white/20 text-sm mt-1">Add your regular meeting venue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-panel p-4 rounded-2xl ${
                selectedLocation?.id === location.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{location.name}</h4>
                    <p className="text-white/40 text-xs">{location.address || 'No address'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {location.isDefault && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Default</span>
                  )}
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="p-2 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">
                  <Target size={14} className="inline mr-1" />
                  {location.radius}m radius
                </span>
                <button
                  onClick={() => openInGoogleMaps(location.latitude, location.longitude, location.name)}
                  className="text-blue-400 flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  View on Map
                </button>
              </div>

              {selectedLocation?.id !== location.id && (
                <button
                  onClick={() => setSelectedLocation(location)}
                  className="w-full mt-3 py-2 bg-white/5 rounded-lg text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  Set as Active
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    const allRecords = meetings.flatMap(m => getMeetingAttendanceRecords(m.id));
    
    return (
      <div className="space-y-4">
        {allRecords.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <Clock className="mx-auto mb-3 text-white/20" size={48} />
            <p className="text-white/40">No attendance records</p>
            <p className="text-white/20 text-sm mt-1">GPS check-ins will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allRecords.slice(0, 20).map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="glass-panel p-4 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      record.verificationStatus === 'verified' 
                        ? 'bg-green-500/20' 
                        : record.verificationStatus === 'outside_radius'
                          ? 'bg-red-500/20'
                          : 'bg-yellow-500/20'
                    }`}>
                      {record.verificationStatus === 'verified' ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : record.verificationStatus === 'outside_radius' ? (
                        <XCircle className="text-red-400" size={20} />
                      ) : (
                        <AlertCircle className="text-yellow-400" size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{record.memberName}</h4>
                      <p className="text-white/40 text-xs">
                        {new Date(record.checkInTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded ${
                    record.verificationStatus === 'verified' 
                      ? 'bg-green-500/20 text-green-400' 
                      : record.verificationStatus === 'outside_radius'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {record.verificationStatus === 'verified' 
                      ? 'Verified' 
                      : record.verificationStatus === 'outside_radius'
                        ? `${formatDistance(record.distanceFromVenue)} away`
                        : 'No GPS'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title="GPS Attendance" 
        subtitle="Location-based check-in"
        showProfile={false}
      />

      <div className="px-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
          {[
            { id: 'checkin', label: 'Check-in', icon: CheckCircle },
            { id: 'locations', label: 'Locations', icon: MapPin },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'checkin' && renderCheckIn()}
        {activeTab === 'locations' && renderLocations()}
        {activeTab === 'history' && renderHistory()}
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              
              <h3 className="text-xl font-bold text-white mb-6">Add Meeting Location</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-2 block">Location Name *</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Community Hall"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">Address</label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Full address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">GPS Coordinates *</label>
                  {newLocationCoords ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-sm font-medium">Location Captured</p>
                        <p className="text-white/50 text-xs">
                          {formatCoordinates(newLocationCoords.lat, newLocationCoords.lng)}
                        </p>
                      </div>
                      <button
                        onClick={handleGetCurrentLocation}
                        className="text-blue-400 text-sm"
                      >
                        Recapture
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetCurrentLocation}
                      disabled={isGettingLocation}
                      className="w-full bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex items-center justify-center gap-2 text-blue-400"
                    >
                      {isGettingLocation ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Navigation size={18} />
                      )}
                      Capture Current Location
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">Check-in Radius: {locationRadius}m</label>
                  <input
                    type="range"
                    min={25}
                    max={500}
                    step={25}
                    value={locationRadius}
                    onChange={(e) => setLocationRadius(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-white/30 text-xs mt-1">
                    <span>25m</span>
                    <span>500m</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveLocation}
                  disabled={!locationName || !newLocationCoords}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold mt-4 disabled:opacity-50"
                >
                  Save Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
