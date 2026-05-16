"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MapPin, Compass, ChevronRight } from "lucide-react";

const POPULAR_AREAS = [
  "Dubai Marina", "Downtown Dubai", "JVC", "Palm Jumeirah", 
  "Business Bay", "JLT", "Al Barsha", "Dubai Hills"
];

const ALL_AREAS = [
  { name: "Downtown Dubai", city: "Dubai", lat: 25.1972, lng: 55.2744 },
  { name: "Dubai Marina", city: "Dubai", lat: 25.0777, lng: 55.1357 },
  { name: "JVC", city: "Dubai", lat: 25.0682, lng: 55.2045 },
  { name: "Palm Jumeirah", city: "Dubai", lat: 25.1124, lng: 55.1390 },
  { name: "Business Bay", city: "Dubai", lat: 25.1832, lng: 55.2667 },
  { name: "JLT", city: "Dubai", lat: 25.0744, lng: 55.1404 },
  { name: "Al Barsha", city: "Dubai", lat: 25.1121, lng: 55.2042 },
  { name: "Dubai Hills", city: "Dubai", lat: 25.1147, lng: 55.2447 },
  { name: "Mirdif", city: "Dubai", lat: 25.2167, lng: 55.4167 },
  { name: "Deira", city: "Dubai", lat: 25.2631, lng: 55.3094 },
  { name: "Bur Dubai", city: "Dubai", lat: 25.2532, lng: 55.3042 },
  { name: "Silicon Oasis", city: "Dubai", lat: 25.1226, lng: 55.3763 },
  { name: "Jumeirah", city: "Dubai", lat: 25.2104, lng: 55.2504 },
  { name: "Al Quoz", city: "Dubai", lat: 25.1542, lng: 55.2342 },
  { name: "Discovery Gardens", city: "Dubai", lat: 25.0412, lng: 55.1432 },
  { name: "International City", city: "Dubai", lat: 25.1610, lng: 55.4050 },
  { name: "Abu Dhabi", city: "UAE", lat: 24.4539, lng: 54.3773 },
  { name: "Sharjah", city: "UAE", lat: 25.3463, lng: 55.4209 },
];

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export default function LocationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Unable to detect your current location");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof ALL_AREAS>([]);
  const [sortedAreas, setSortedAreas] = useState(ALL_AREAS);

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setCurrentLocation(savedLocation);
    }

    const savedCoords = localStorage.getItem("userCoords");
    if (savedCoords) {
      const { latitude, longitude } = JSON.parse(savedCoords);
      const sorted = [...ALL_AREAS].sort((a, b) => {
        const distA = getDistance(latitude, longitude, a.lat, a.lng);
        const distB = getDistance(latitude, longitude, b.lat, b.lng);
        return distA - distB;
      });
      setSortedAreas(sorted);
    }
  }, []);

  const filteredAreas = sortedAreas.filter(area => 
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Location</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search by city, area or locality..."
          className="w-full bg-[#111] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors placeholder:text-white/20"
          value={searchQuery}
          onChange={(e) => {
            const query = e.target.value;
            setSearchQuery(query);
            
            const matches = ALL_AREAS.filter(area => 
              area.name.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(matches);
            setShowSuggestions(true);

            if (query.trim().length >= 3) {
              fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`, {
                headers: {
                  'User-Agent': 'Mudwash-App'
                }
              })
                .then(res => res.json())
                .then(data => {
                  const apiSuggestions = data.map((item: any) => ({
                    name: item.display_name.split(',')[0],
                    city: "Dubai",
                    fullName: item.display_name
                  }));
                  
                  setSuggestions(prev => {
                    const combined = [...matches];
                    apiSuggestions.forEach((apiItem: any) => {
                      if (!combined.some(c => c.name.toLowerCase() === apiItem.name.toLowerCase())) {
                        combined.push(apiItem);
                      }
                    });
                    return combined;
                  });
                })
                .catch(err => console.error("Search error:", err));
            } else if (query.trim() === "") {
              setShowSuggestions(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim() !== "") {
              localStorage.setItem("userLocation", searchQuery.trim());
              setCurrentLocation(searchQuery.trim());
              window.dispatchEvent(new Event("locationChanged"));
              router.back();
            }
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => {
            if (searchQuery.trim() !== "") {
              setShowSuggestions(true);
            }
          }}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[200px] overflow-y-auto no-scrollbar">
            {searchQuery.trim() !== "" && (
              <button
                onClick={() => {
                  localStorage.setItem("userLocation", searchQuery.trim());
                  setCurrentLocation(searchQuery.trim());
                  window.dispatchEvent(new Event("locationChanged"));
                  router.back();
                }}
                className="w-full text-left px-4 py-3 text-sm text-brand-orange hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-3"
              >
                <MapPin size={14} className="text-brand-orange" />
                <div className="min-w-0">
                  <p className="font-bold truncate">Use "{searchQuery.trim()}"</p>
                  <p className="text-xs text-white/30">Manual entry</p>
                </div>
              </button>
            )}
            {suggestions.map(area => (
              <button
                key={area.name}
                onClick={() => {
                  localStorage.setItem("userLocation", area.name);
                  setCurrentLocation(area.name);
                  window.dispatchEvent(new Event("locationChanged"));
                  router.back();
                }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-white/30" />
                  <div>
                    <p className="font-bold">{area.name}</p>
                    <p className="text-xs text-white/30">{area.city}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Allow Location Access */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-8 hover:bg-[#1A1A1A] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <Compass size={20} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Allow location access</p>
            <p className="text-xs text-white/30">{currentLocation}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-white/30" />
      </button>

      {/* Popular Cities/Areas */}
      <div className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Popular Areas</h2>
        <div className="grid grid-cols-3 gap-3">
          {POPULAR_AREAS.map(area => (
            <button
              key={area}
              onClick={() => {
                localStorage.setItem("userLocation", area);
                setCurrentLocation(area);
                window.dispatchEvent(new Event("locationChanged"));
                router.back();
              }}
              className="bg-[#111] border border-white/5 rounded-xl py-3 text-xs font-medium hover:border-brand-orange/50 transition-colors"
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* All Cities/Areas */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">All Areas</h2>
        <div className="space-y-3">
          {filteredAreas.map(area => (
            <button
              key={area.name}
              onClick={() => {
                localStorage.setItem("userLocation", area.name);
                setCurrentLocation(area.name);
                window.dispatchEvent(new Event("locationChanged"));
                router.back();
              }}
              className="w-full bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
                <MapPin size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{area.name}</p>
                <p className="text-xs text-white/30">{area.city}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6">
            <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto text-brand-orange border border-brand-orange/20">
              <MapPin size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">
                {isLocationDetected ? "Location Detected" : "Enable Location Services"}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {isLocationDetected 
                  ? `We found your location: ${currentLocation}`
                  : "We need your location to show you relevant services and providers in your area."}
              </p>
            </div>
            <div className="flex gap-3">
              {isLocationDetected ? (
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsLocationDetected(false); // Reset for next time
                    router.back();
                  }}
                  className="flex-1 bg-brand-orange text-black font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_15px_rgba(246,150,33,0.3)]"
                >
                  Done
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Not Now
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            localStorage.setItem("userCoords", JSON.stringify({ latitude, longitude }));
                            setCurrentLocation("Detecting...");
                            setIsLocationDetected(true);

                            // Fetch real address from OpenStreetMap Nominatim API
                            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                              headers: {
                                'User-Agent': 'Mudwash-App'
                              }
                            })
                              .then(res => res.json())
                              .then(data => {
                                const address = data.address?.suburb || data.address?.city_district || data.address?.city || data.display_name || "Current Location";
                                localStorage.setItem("userLocation", address);
                                setCurrentLocation(address);
                                window.dispatchEvent(new Event("locationChanged"));
                                router.back();
                              })
                              .catch(err => {
                                console.error("Error reverse geocoding:", err);
                                localStorage.setItem("userLocation", "Current Location");
                                setCurrentLocation("Current Location");
                                window.dispatchEvent(new Event("locationChanged"));
                                router.back();
                              });
                          },
                          (error) => {
                            console.log("Error getting location: " + error.message);
                            setIsModalOpen(false);
                          }
                        );
                      } else {
                        console.log("Geolocation is not supported by this browser.");
                        setIsModalOpen(false);
                      }
                    }}
                    className="flex-1 bg-brand-orange text-black font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_15px_rgba(246,150,33,0.3)]"
                  >
                    Enable Location
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
