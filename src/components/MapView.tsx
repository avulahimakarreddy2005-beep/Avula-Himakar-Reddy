import React, { useEffect, useState, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker as LMarker, 
  Popup as LPopup, 
  Circle as LCircle, 
  useMapEvents as useLMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  Maximize2, 
  Minimize2, 
  X, 
  Filter, 
  Map as MapIcon, 
  Eye, 
  Radio, 
  Search, 
  Activity, 
  Compass, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Issue } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Google Maps components from our installed library
import { 
  APIProvider, 
  Map as GMap, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap as useGMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';

// Resolve Leaflet Vite default asset path bug
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Leaflet-only subcomponents for fallback --
function LeafletLocationMarker({ onUpdatePos }: { onUpdatePos: (pos: L.LatLng) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const map = useLMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      onUpdatePos(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate({
      watch: true,
      enableHighAccuracy: true,
    });
  }, [map]);

  const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-white ring-4 ring-blue-500/30">
             <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return position === null ? null : (
    <>
      <LMarker position={position} icon={userIcon}>
        <LPopup>
          <div className="text-center font-bold text-slate-800 p-1">
            <p className="text-sm">You are here</p>
            <p className="text-[10px] text-slate-400 font-medium">Accuracy: {accuracy.toFixed(0)}m</p>
          </div>
        </LPopup>
      </LMarker>
      <LCircle 
        center={position} 
        radius={accuracy} 
        pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1, dashArray: '5, 5' }} 
      />
    </>
  );
}

// --- Dynamic Google Map subcomponents ---

// Subcomponent: Live Traffic Layer Wrapper
function TrafficLayer({ enabled }: { enabled: boolean }) {
  const map = useGMap();
  const layerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TrafficLayer();
      }
      layerRef.current.setMap(map);
    } else {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    }
    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
}

// Subcomponent: Routes computes display (Optimized driving crew)
interface RouteDisplayProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onRouteDetails: (details: { distance: string; duration: string }) => void;
}

function RouteDisplay({ origin, destination, onRouteDetails }: RouteDisplayProps) {
  const map = useGMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    
    // Clear old lines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const polyStyle = {
          strokeColor: '#3b82f6',
          strokeOpacity: 0.85,
          strokeWeight: 6,
        };
        const newLines = routes[0].createPolylines();
        newLines.forEach(p => {
          p.setOptions(polyStyle);
          p.setMap(map);
        });
        polylinesRef.current = newLines;

        const distanceMeters = routes[0].distanceMeters || 0;
        const durationMillis = Number(routes[0].durationMillis) || 0;
        const dstKm = (distanceMeters / 1000).toFixed(1);
        const durMin = Math.round(durationMillis / 60000);

        onRouteDetails({
          distance: `${dstKm} km`,
          duration: `${durMin} mins`
        });

        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    }).catch(err => {
      console.error("Error computing routes:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination]);

  return null;
}

// Subcomponent: Autocomplete Place Finder using Google Places SDK (New)
interface SearchBoxProps {
  onSelectLocation: (pos: google.maps.LatLngLiteral, address: string) => void;
}

function PlaceSearchBox({ onSelectLocation }: SearchBoxProps) {
  const map = useGMap();
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text: string) => {
    if (!placesLib || !text) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: text,
        fields: ['displayName', 'location', 'formattedAddress'],
        maxResultCount: 5,
        locationBias: map?.getCenter() || undefined
      });
      setSuggestions(places || []);
    } catch (err) {
      console.error("Place search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search places or addresses..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 2) {
              handleSearch(e.target.value);
            } else {
              setSuggestions([]);
            }
          }}
          className="w-full text-xs font-semibold pl-10 pr-4 py-3.5 bg-white/95 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 shadow-xl text-slate-800"
        />
        {isSearching && (
          <div className="absolute right-3.5 top-3.5 w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="absolute top-14 left-0 right-0 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-[40] divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {suggestions.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                if (p.location) {
                  const pos = { lat: p.location.lat(), lng: p.location.lng() };
                  const label = p.formattedAddress || p.displayName || query;
                  onSelectLocation(pos, label);
                  map?.panTo(pos);
                  map?.setZoom(16);
                  setQuery('');
                  setSuggestions([]);
                }
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors flex flex-col gap-0.5 text-xs text-slate-700"
            >
              <span className="font-bold text-slate-800">{p.displayName}</span>
              <span className="text-[10px] text-slate-400 truncate">{p.formattedAddress}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper styling utilities
const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved': return 'bg-emerald-500';
    case 'in-progress': return 'bg-blue-500';
    default: return 'bg-amber-500';
  }
};

const getCategoryColor = (type: string) => {
  switch (type) {
    case 'pothole': return '#0f172a'; // slate-900
    case 'drainage': return '#3b82f6'; // blue-500
    case 'waste': return '#10b981'; // emerald-500
    default: return '#f43f5e'; // rose-500
  }
};

const getSeverityDetails = (severity: string) => {
  switch (severity) {
    case 'high': return {
      iconColor: '#f43f5e',
      circleRadius: 150,
      circleColor: '#f43f5e'
    };
    case 'medium': return {
      iconColor: '#f59e0b',
      circleRadius: 80,
      circleColor: '#f59e0b'
    };
    default: return {
      iconColor: '#10b981',
      circleRadius: 30,
      circleColor: '#10b981'
    };
  }
};

interface MapViewProps {
  issues: Issue[];
  onViewDetail?: (id: string) => void;
  onInitiateReport?: (draft: { lat: number; lng: number; address: string }) => void;
}

export default function MapView({ issues, onViewDetail, onInitiateReport }: MapViewProps) {
  // Check API keys
  const GOOGLE_API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  
  const hasGoogleKey = Boolean(GOOGLE_API_KEY) && GOOGLE_API_KEY !== 'YOUR_GOOGLE_MAPS_PLATFORM_KEY' && GOOGLE_API_KEY.length > 10;

  // General tab filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fallback Leaflet positioning
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [userLatLng, setUserLatLng] = useState<L.LatLng | null>(null);

  // --- Google Maps specific states ---
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [heatmapsEnabled, setHeatmapsEnabled] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [streetViewActive, setStreetViewActive] = useState(false);

  // Address click placement
  const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Navigation crew routing
  const [routingOrigin, setRoutingOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (leafletMap) {
      leafletMap.invalidateSize();
    }
  }, [isFullscreen, leafletMap]);

  // Leaflet-based Geolocation handling
  const handleLeafletLocate = () => {
    if (leafletMap) {
      leafletMap.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    }
  };

  const filteredIssues = issues.filter(i => {
    const matchesType = filterType === 'all' || i.type === filterType;
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const types = ['pothole', 'drainage', 'waste', 'hazard'];
  const statuses = ['pending', 'in-progress', 'resolved'];

  // Handle click on Google map -> reverse geocode and add pending draft marker
  const handleGoogleMapClick = (e: any) => {
    const latLng = e.detail.latLng;
    if (!latLng) return;

    setIsGeocoding(true);
    setDraftLocation(null);
    setSelectedIssue(null);
    setStreetViewActive(false);

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results?.[0]) {
          setDraftLocation({
            lat: latLng.lat,
            lng: latLng.lng,
            address: results[0].formatted_address
          });
        } else {
          setDraftLocation({
            lat: latLng.lat,
            lng: latLng.lng,
            address: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`
          });
        }
      });
    } catch (err) {
      console.error("Geocoding failed:", err);
      setIsGeocoding(false);
      setDraftLocation({
        lat: latLng.lat,
        lng: latLng.lng,
        address: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`
      });
    }
  };

  // Google Street View dynamic mount effect
  useEffect(() => {
    if (!streetViewActive || !selectedIssue) return;
    const container = document.getElementById("gmp-street-view-modal");
    if (!container) return;

    try {
      const panorama = new google.maps.StreetViewPanorama(container, {
        position: { lat: selectedIssue.location.lat, lng: selectedIssue.location.lng },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: true,
        addressControl: false,
        linksControl: false,
        panControl: false,
        zoomControl: false,
        enableCloseButton: false,
      });
    } catch (err) {
      console.error("Error creating Street View panorama:", err);
    }
  }, [selectedIssue, streetViewActive]);

  // Handle routing triggers
  const initializeCrewRouting = (dest: { lat: number; lng: number }) => {
    // Attempt browser geolocation for start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRoutingOrigin({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Fallback to average location (e.g. Baker street focus)
          setRoutingOrigin({ lat: 51.5237, lng: -0.1585 });
        }
      );
    } else {
      setRoutingOrigin({ lat: 51.5237, lng: -0.1585 });
    }
  };

  const handleCreateReportAtDraft = () => {
    if (draftLocation && onInitiateReport) {
      onInitiateReport(draftLocation);
    }
  };

  return (
    <div className={cn(
      "w-full rounded-[32px] overflow-hidden border border-slate-200 shadow-xl relative transition-all duration-500 bg-slate-50",
      isFullscreen ? "fixed inset-0 z-[100] rounded-none border-none h-screen" : "h-[calc(100vh-12rem)]"
    )}>

      {/* --- RENDER 1: LEAFLET fallback when GOOGLE Key is not configured --- */}
      {!hasGoogleKey ? (
        <div className="w-full h-full relative">
          
          {/* Top banner detailing how to acquire the key for Google Maps system */}
          <div className="absolute top-4 left-4 right-4 z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-990 text-white rounded-3xl p-5 shadow-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl animate-pulse">
                <MapIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Google Maps Engine Upgrades Available
                  <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded">Pro Engine</span>
                </h3>
                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  Connect a Google API key in AI Studio Secrets to unlock real-time **Street View clogs inspections**, **repair crew routes polylines navigator**, **live driving traffic network congestion layers**, and **instant geocoding place discovery**.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                Get Google Key
                <ExternalLink className="w-3 h-3" />
              </a>
              <button 
                onClick={() => {
                  // Direct setup prompt
                  const secretVar = prompt("Enter your GOOGLE_MAPS_PLATFORM_KEY to continue:");
                  if (secretVar) {
                    alert("Please set this GOOGLE_MAPS_PLATFORM_KEY inside Settings (⚙️ top-right) -> Secrets to persist properly!");
                  }
                }}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
              >
                Unlock Premium
              </button>
            </div>
          </div>

          <MapContainer 
            center={[51.5237, -0.1585]} 
            zoom={15} 
            className="h-full w-full z-0"
            zoomControl={false}
            ref={setMapUser => setLeafletMap(setMapUser)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LeafletLocationMarker onUpdatePos={(pos) => setUserLatLng(pos)} />
            
            {filteredIssues.map((report) => (
              <React.Fragment key={report.id}>
                {report.severity !== 'low' && (
                  <LCircle
                    center={[report.location.lat, report.location.lng]}
                    radius={report.severity === 'high' ? 150 : 80}
                    pathOptions={{
                      fillColor: report.severity === 'high' ? '#f43f5e' : '#f59e0b',
                      fillOpacity: 0.1,
                      color: report.severity === 'high' ? '#f43f5e' : '#f59e0b',
                      weight: 1
                    }}
                  />
                )}
                <LMarker 
                  position={[report.location.lat, report.location.lng]}
                >
                  <LPopup className="custom-popup">
                    <div className="w-64 p-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider",
                          getStatusColor(report.status)
                        )}>
                          {report.status}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {report.id}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-sm mb-1 capitalize">
                        {report.type.replace('-', ' ')} Reported
                      </h3>
                      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate text-slate-700">{report.location.address}</span>
                      </p>

                      {report.imageUrl && (
                        <div className="w-full h-24 rounded-lg overflow-hidden mb-3 border border-slate-100">
                          <img 
                            src={report.imageUrl} 
                            alt="report" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 font-sans">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Severity</p>
                          <p className="text-[10px] font-bold text-slate-700 capitalize">{report.severity}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Status</p>
                          <p className={cn(
                            "text-[10px] font-bold capitalize",
                            report.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'
                          )}>{report.status}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onViewDetail?.(report.id)}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                      >
                        View Detail Info
                      </button>
                    </div>
                  </LPopup>
                </LMarker>
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Leaflet Custom Floating Side Controls */}
          <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
            <button 
              onClick={handleLeafletLocate}
              className="bg-white hover:bg-slate-50 text-slate-800 p-3 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <Navigation className="w-4 h-4 fill-current" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">GPS Control</p>
                <p className="text-xs font-bold text-slate-800">My Position</p>
              </div>
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Display</p>
                <p className="text-xs font-bold text-white">{isFullscreen ? 'Minimize' : 'Full Page'}</p>
              </div>
            </button>
          </div>
        </div>
      ) : (

        /* --- RENDER 2: ADVANCED GOOGLE MAPS POWER ENGINE --- */
        <APIProvider apiKey={GOOGLE_API_KEY} version="weekly">
          <div className="w-full h-full relative font-sans flex flex-col md:flex-row">
            
            {/* Split Screen Control Panel (Google Map features workspace) */}
            <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col shrink-0 gap-4 overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">RoadSense AI Maps</p>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Civic Hazards Hub</h3>
                <p className="text-xs text-slate-400">Manage real-time infrastructure indices</p>
              </div>

              {/* Dynamic Autocomplete Search Box */}
              <PlaceSearchBox 
                onSelectLocation={(pos) => {
                  setDraftLocation(null);
                  setSelectedIssue(null);
                }} 
              />

              {/* Toggleable Layer Settings */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle Map Features</p>
                
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer p-0.5">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Radio className={cn("w-4 h-4 transition-colors", trafficEnabled ? "text-emerald-500 animate-pulse" : "text-slate-400")} />
                      Live Traffic Layer
                    </span>
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={trafficEnabled}
                      onChange={(e) => setTrafficEnabled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 relative transition-colors after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-0.5">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <TrendingUp className={cn("w-4 h-4 transition-colors", heatmapsEnabled ? "text-emerald-500 animate-pulse" : "text-slate-400")} />
                      Danger Priority Zones
                    </span>
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={heatmapsEnabled}
                      onChange={(e) => setHeatmapsEnabled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 relative transition-colors after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </div>

              {/* Google Map Sizing Style Overlays */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Map Type</p>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setMapType(style)}
                      className={cn(
                        "py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors",
                        mapType === style 
                          ? "bg-slate-900 text-white" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation crew router section */}
              {routingOrigin && selectedIssue && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl relative">
                  <button 
                    onClick={() => {
                      setRoutingOrigin(null);
                      setRouteInfo(null);
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                    Repair Crew Directions
                  </p>
                  <p className="text-xs font-extrabold text-slate-800 capitalize mb-2">{selectedIssue.type} Route</p>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
                    <div className="p-2 bg-white rounded-xl border border-blue-50/80">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Distance</p>
                      <p className="text-xs font-black text-slate-800">{routeInfo?.distance || 'Calculating...'}</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-blue-50/80">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Est. Drive Time</p>
                      <p className="text-xs font-black text-slate-800">{routeInfo?.duration || 'Calculating...'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Click instruction info */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-4 border border-slate-150 rounded-2xl border-dashed">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Interactive Placement:
                </p>
                Right-click or hold anywhere on Google Maps to reverse-geocode addresses and file live complaints directly from coordinates!
              </div>

              <div className="mt-auto pt-4 border-t border-slate-150">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600">Google Hybrid SDK Active</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Google Map viewport */}
            <div className="flex-1 relative h-full w-full">
              
              <GMap
                defaultCenter={{ lat: 51.5237, lng: -0.1585 }}
                defaultZoom={15}
                mapId="REMIX_ROADSENSE_MAP"
                mapTypeId={mapType}
                onClick={handleGoogleMapClick}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Traffic layer handler */}
                <TrafficLayer enabled={trafficEnabled} />

                {/* Simulated Geolocation Start -> Destination routing */}
                {routingOrigin && selectedIssue && (
                  <RouteDisplay 
                    origin={routingOrigin}
                    destination={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                    onRouteDetails={setRouteInfo}
                  />
                )}

                {/* Draft location marker on clicked maps */}
                {draftLocation && (
                  <AdvancedMarker
                    position={{ lat: draftLocation.lat, lng: draftLocation.lng }}
                    onClick={() => {}}
                  >
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-full bg-emerald-500/30 blur animate-pulse" />
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-white shadow-xl relative ring-2 ring-emerald-500/20">
                        <Plus className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  </AdvancedMarker>
                )}

                {/* Active Issues pins list */}
                {filteredIssues.map((report) => {
                  const sDetails = getSeverityDetails(report.severity);
                  const isSelected = selectedIssue?.id === report.id;
                  
                  return (
                    <React.Fragment key={report.id}>
                      
                      {/* Danger circular proximity heatzones - visually customized */}
                      {heatmapsEnabled && (
                        <svg className="hidden">
                          {/* We draw standard concentric Google Circle overlays if desired, or let AdvancedMarker act as anchor */}
                        </svg>
                      )}

                      <AdvancedMarker
                        position={{ lat: report.location.lat, lng: report.location.lng }}
                        onClick={() => {
                          setSelectedIssue(report);
                          setDraftLocation(null);
                          setStreetViewActive(false);
                          setRoutingOrigin(null);
                        }}
                      >
                        <div className={cn(
                          "relative cursor-pointer transition-transform duration-300",
                          isSelected ? "scale-125 z-10" : "hover:scale-115"
                        )}>
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-2xl transition-all relative"
                            style={{ 
                              backgroundColor: getCategoryColor(report.type),
                              boxShadow: isSelected ? `0 0 15px 4px ${getCategoryColor(report.type)}80` : ''
                            }}
                          >
                            <span className="text-[10px] uppercase font-black">{report.type[0]}</span>
                            {/* Priority visual ping */}
                            {report.severity === 'high' && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                              </div>
                            )}
                          </div>
                        </div>
                      </AdvancedMarker>
                    </React.Fragment>
                  );
                })}

                {/* Google Map In-Window Popup Overlay */}
                {selectedIssue && (
                  <InfoWindow
                    position={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                    onCloseClick={() => {
                      setSelectedIssue(null);
                      setStreetViewActive(false);
                      setRoutingOrigin(null);
                    }}
                  >
                    <div className="w-64 p-1.5 font-sans space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          {selectedIssue.type}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{selectedIssue.id}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {selectedIssue.type.toUpperCase()} HAZARD
                        </h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-56">{selectedIssue.location.address}</span>
                        </p>
                      </div>

                      {/* Photo banner */}
                      {selectedIssue.imageUrl && !streetViewActive && (
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-100">
                          <img 
                            src={selectedIssue.imageUrl} 
                            alt="Hazard photo" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";
                            }}
                          />
                        </div>
                      )}

                      {/* Interactive Embedded Street View box */}
                      {streetViewActive && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-emerald-500" />
                            Live Street Level
                          </p>
                          <div 
                            id="gmp-street-view-modal" 
                            className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 mt-1 shadow-inner overflow-hidden" 
                          />
                        </div>
                      )}

                      {/* Severity parameters */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <p className="text-slate-400 font-bold uppercase mb-0.5" style={{ fontSize: '8px' }}>Priority</p>
                          <p className="text-slate-800 font-black capitalize">{selectedIssue.severity}</p>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <p className="text-slate-400 font-bold uppercase mb-0.5" style={{ fontSize: '8px' }}>Status</p>
                          <p className={cn(
                            "font-black capitalize",
                            selectedIssue.status === 'resolved' ? 'text-emerald-600' : 'text-amber-500'
                          )}>{selectedIssue.status}</p>
                        </div>
                      </div>

                      {/* Dynamic controls */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setStreetViewActive(!streetViewActive)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border",
                              streetViewActive 
                                ? "bg-slate-900 border-slate-900 text-white" 
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                            )}
                          >
                            <Eye className="w-3 h-3" />
                            {streetViewActive ? 'Hide Street' : 'Street View'}
                          </button>
                          
                          <button
                            onClick={() => initializeCrewRouting({ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng })}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3 h-3 fill-current" />
                            Route Crew
                          </button>
                        </div>

                        <button
                          onClick={() => onViewDetail?.(selectedIssue.id)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Open Reports Console
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GMap>

              {/* Reverse Geocoding prompt banner overlay */}
              <AnimatePresence>
                {draftLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    className="absolute bottom-6 left-6 right-6 md:left-12 md:right-auto md:w-96 bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-white/10 z-25 flex flex-col gap-3.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Google Reverse Geocoded</p>
                        </div>
                        <h4 className="text-xs font-black text-white pr-4 leading-tight">{draftLocation.address}</h4>
                      </div>
                      <button 
                        onClick={() => setDraftLocation(null)}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2.5 pt-1.5">
                      <button
                        onClick={handleCreateReportAtDraft}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Report Potholes Here
                      </button>
                      
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Geocoding loading status */}
              {isGeocoding && (
                <div className="absolute top-6 left-6 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2.5 z-20">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Resolving Street Address...</span>
                </div>
              )}

              {/* Status footer inside the google map */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="bg-white hover:bg-slate-50 text-slate-800 p-3 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-center transition-all active:scale-95"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 animate-pulse" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </APIProvider>
      )}
    </div>
  );
}
