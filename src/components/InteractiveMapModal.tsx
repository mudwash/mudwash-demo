'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Navigation, Map as MapIcon, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic Leaflet Imports
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

function MapEventsWrapper({ onCoordsChange }: { onCoordsChange: (lat: number, lng: number) => void }) {
  try {
    const { useMapEvents } = require('react-leaflet');
    const map = useMapEvents({
      moveend() {
        const center = map.getCenter();
        onCoordsChange(center.lat, center.lng);
      },
      click(e: any) {
        map.flyTo(e.latlng, map.getZoom());
        onCoordsChange(e.latlng.lat, e.latlng.lng);
      }
    });
  } catch (e) {}
  return null;
}

function RecenterMap({ coords }: { coords: { lat: number; lng: number } }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], map.getZoom());
  }, [coords, map]);
  return null;
}

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`);
    const data = await response.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (err) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
  initialCoords: { lat: number; lng: number };
}

export default function InteractiveMapModal({ isOpen, onClose, onConfirm, initialCoords }: Props) {
  const [mapCoords, setMapCoords] = useState(initialCoords);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapType, setMapType] = useState<'hybrid' | 'streets'>('hybrid');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("Fetching address...");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      const addr = await reverseGeocode(mapCoords.lat, mapCoords.lng);
      setCurrentAddress(addr);
      setIsGeocoding(false);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [mapCoords]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }} 
        className="relative w-full h-full bg-[#051005] overflow-hidden flex flex-col"
      >
        <div className="p-8 sm:p-10 pb-6 flex items-center justify-between relative z-20">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              Select Delivery <span className="text-[#D4E157]">Pin</span>
            </h2>
            <p className="text-xs sm:text-base font-bold text-white/50">Tap exactly where you want your order delivered.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex-grow relative">
          <div className="w-full h-full relative overflow-hidden bg-black/40 shadow-inner z-10">
            {typeof window !== 'undefined' && (
              <MapContainer 
                center={[mapCoords.lat, mapCoords.lng]} 
                zoom={mapZoom} 
                className="absolute inset-0 w-full h-full cursor-crosshair"
                zoomControl={false}
              >
                <TileLayer
                  url={mapType === 'hybrid' 
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                  attribution='&copy; Esri'
                />
                <MapEventsWrapper onCoordsChange={(lat, lng) => setMapCoords({ lat, lng })} />
                <RecenterMap coords={mapCoords} />
                
                <Marker position={[mapCoords.lat, mapCoords.lng]} icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%)">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 12px 12px rgba(0,0,0,0.5))">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#4285F4" stroke="white" stroke-width="1.5"/>
                        <circle cx="12" cy="9" r="3.5" fill="white"/>
                      </svg>
                      <div style="width: 2px; height: 2px; background: rgba(0,0,0,0.4); border-radius: 50%; filter: blur(2px); margin-top: -3px"></div>
                    </div>
                  `,
                  iconSize: [0, 0],
                  iconAnchor: [0, 0]
                })} />
              </MapContainer>
            )}

            <div className="absolute top-6 left-6 z-[500] flex flex-col gap-3">
              <div className="flex flex-col bg-white rounded-xl shadow-xl overflow-hidden border border-black/5">
                <button onClick={() => setMapZoom(z => Math.min(z + 1, 20))} className="w-11 h-11 flex items-center justify-center text-black hover:bg-black/5 border-b border-black/5 active:scale-90">
                  <Plus size={20} strokeWidth={3} />
                </button>
                <button onClick={() => setMapZoom(z => Math.max(z - 1, 10))} className="w-11 h-11 flex items-center justify-center text-black hover:bg-black/5 active:scale-90">
                  <Minus size={20} strokeWidth={3} />
                </button>
              </div>
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setMapCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    });
                  }
                }}
                className="w-11 h-11 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-xl hover:bg-blue-50 border border-black/5 active:scale-90"
              >
                <Navigation size={20} fill="currentColor" />
              </button>
            </div>

            <div className="absolute top-6 right-6 z-[500]">
              <button 
                onClick={() => setMapType(prev => prev === 'hybrid' ? 'streets' : 'hybrid')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all border border-black/5 active:scale-90 ${mapType === 'hybrid' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}
              >
                <MapIcon size={24} />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-md px-2 py-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[500] border border-black/10 min-w-[280px]">
              <div className="flex-grow px-4">
                <span className="text-[10px] font-black text-black/80 uppercase tracking-widest flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  {isGeocoding ? "Decoding..." : currentAddress}
                </span>
              </div>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsGeocoding(true);
                  const addr = await reverseGeocode(mapCoords.lat, mapCoords.lng);
                  onConfirm(addr);
                  setIsGeocoding(false);
                }}
                disabled={isGeocoding}
                className="bg-[#D4E157] text-black h-12 px-6 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {isGeocoding ? <Loader2 className="animate-spin" size={16} /> : "Confirm Pin"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 pt-0 hidden sm:flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <button onClick={onClose} className="flex-grow sm:flex-grow-0 px-12 h-16 rounded-[1.5rem] border-2 border-white/10 text-white font-black uppercase text-sm tracking-widest hover:bg-white/5 transition-all">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
