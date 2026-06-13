import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Send, Loader2, CheckCircle2, MessageSquare, X, RefreshCw, Video, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, compressImage } from '../lib/utils';
import { analyzeCivicIssue } from '../services/aiService';
import { Issue, Comment } from '../types';
import { User } from '../lib/firebase';

interface ReportIssueProps {
  onReportSubmitted?: (issue: Issue) => void;
  user: User | null;
  draftLocation?: { lat: number; lng: number; address: string } | null;
  onClearDraft?: () => void;
}

export default function ReportIssue({ onReportSubmitted, user, draftLocation, onClearDraft }: ReportIssueProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (draftLocation) {
      return { lat: draftLocation.lat, lng: draftLocation.lng };
    }
    return null;
  });
  const [address, setAddress] = useState<string>(() => {
    if (draftLocation) {
      return draftLocation.address;
    }
    return 'Detecting location...';
  });
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  
  // Form fields
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState<'pothole' | 'waste' | 'drainage' | 'hazard'>('pothole');
  const [tags, setTags] = useState<string[]>([]);
  const [initialComment, setInitialComment] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera stream helper
  const startCamera = async (currentFacing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setIsCameraActive(true);
    
    // Stop any existing stream
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
      
      // Query video inputs to see if flipping is possible
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let errorMsg = "Could not access camera. Please check permissions.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Camera permission was denied. Please allow camera access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "No camera found on this device.";
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  // Toggle between Front and Back camera (e.g. environment vs user)
  const toggleCameraDirection = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Capture current frame from <video> into base64 image data url
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        // Clean up the running stream
        stopCamera();
        setIsCameraActive(false);
        
        // Compress captured photo so it fits Firestore payload nicely
        const compressed = await compressImage(dataUrl, 600, 600, 0.7);
        setPhoto(compressed);
        
        // Strip data prefix and analyze via AI service
        const base64 = compressed.split(',')[1];
        if (base64) {
          handleAIAnalysis(base64);
        }
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);
    }
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (draftLocation) {
      setCoords({ lat: draftLocation.lat, lng: draftLocation.lng });
      setAddress(draftLocation.address);
      setIsManualLocation(false);
      return;
    }

    if ("geolocation" in navigator && !isManualLocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // In a real app, we'd reverse geocode here. 
          // For now we'll show the coordinates to prove accuracy.
          setAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          console.error("Error fetching location:", error);
          setAddress("Location access denied or unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setAddress("Geolocation not supported by browser");
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        
        try {
          // Compress the photo to make sure it doesn't exceed Firestore limits
          const compressed = await compressImage(result, 600, 600, 0.7);
          setPhoto(compressed);
          
          // Extract base64 without prefix
          const base64 = compressed.split(',')[1];
          if (base64) {
            handleAIAnalysis(base64);
          }
        } catch (error) {
          console.error("Failed to compress image:", error);
          setPhoto(result);
          const base64 = result.split(',')[1];
          if (base64) {
            handleAIAnalysis(base64);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const result = await analyzeCivicIssue("Analyze this road image", base64);
      if (result) {
        setAiResult(result);
        
        // Map AI Category to our fixed types
        const cat = result.Category?.toLowerCase() || '';
        if (cat.includes('pothole')) setCategory('pothole');
        else if (cat.includes('waste') || cat.includes('trash') || cat.includes('sanitation')) setCategory('waste');
        else if (cat.includes('drainage') || cat.includes('water')) setCategory('drainage');
        else setCategory('hazard');
        
        // Map AI Severity
        const sev = result.Severity?.toLowerCase() || '';
        if (sev.includes('high')) setSeverity('high');
        else if (sev.includes('low')) setSeverity('low');
        else setSeverity('medium');

        if (result.Description) {
          setDescription(result.Description);
        }

        if (Array.isArray(result.Tags)) {
          setTags(result.Tags.slice(0, 5));
        } else {
          setTags([category]);
        }
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const CATEGORY_IMAGES = {
    pothole: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800',
    drainage: 'https://images.unsplash.com/photo-1541888946425-d81bb1930060?auto=format&fit=crop&q=80&w=800',
    waste: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
    hazard: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=800',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onReportSubmitted) {
      const newIssue: Issue = {
        id: `RS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        type: category,
        severity: severity,
        status: 'pending',
        location: {
          lat: coords?.lat || 51.5074,
          lng: coords?.lng || -0.1278,
          address: isManualLocation ? manualAddress : address
        },
        reporterId: user?.uid || 'guest-user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: description,
        tags: tags.length > 0 ? tags : [category.charAt(0).toUpperCase() + category.slice(1)],
        imageUrl: photo || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.pothole,
        comments: initialComment ? [
          {
            id: `c-${Math.random().toString(36).substring(2, 9)}`,
            userId: user?.uid || 'guest-user',
            userName: user?.displayName || 'Guest User',
            text: initialComment,
            timestamp: Date.now()
          }
        ] : []
      };
      onReportSubmitted(newIssue);
    }
    
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-saffron-light text-saffron rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-saffron-glow border border-saffron/20"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Report Received Successfully</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          Thank you for helping improve Indian community infrastructure! Your report has been dispatched to the municipal municipal team. 
          You have earned <span className="font-bold text-indian-green">50 RoadSense Coins</span>.
        </p>
        <button 
          onClick={() => { setIsSubmitted(false); setPhoto(null); onClearDraft?.(); }}
          className="px-10 py-4 bg-indian-green text-white font-bold rounded-2xl hover:bg-indian-green-dark transition-all shadow-lg shadow-indian-green-glow"
        >
          File Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-8">
        <div className="data-card p-8 bg-white">
          <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Step 1: Capture Photo</h2>
          <p className="text-sm text-slate-400 mb-6 font-medium">Snap a photo and our AI will detect the infrastructure damage automatically.</p>

          {!photo ? (
            <div className="space-y-4">
              {/* Camera mode selector tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsCameraActive(true);
                    startCamera(facingMode);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer",
                    isCameraActive 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Video className="w-4 h-4 text-emerald-500" />
                  Live In-App Cam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsCameraActive(false);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer",
                    !isCameraActive 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  Upload Photo File
                </button>
              </div>

              {cameraError && isCameraActive && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
                  <p>{cameraError}</p>
                  <button 
                    type="button" 
                    onClick={() => { setIsCameraActive(false); stopCamera(); }}
                    className="underline block mt-1 hover:text-rose-800 font-bold"
                  >
                    Switch to upload mode instead
                  </button>
                </div>
              )}

              {isCameraActive ? (
                <div className="relative h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg group">
                  <video 
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera overlays and action buttons */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-indian-green text-white font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live Cam View
                      </span>
                      
                      <div className="flex gap-2">
                        {availableDevices.length > 1 && (
                          <button 
                            type="button"
                            onClick={toggleCameraDirection}
                            className="bg-black/60 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-black/80 transition-colors border border-white/10"
                            title="Flip Camera"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => { stopCamera(); setIsCameraActive(false); }}
                          className="bg-black/60 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-black/80 transition-colors border border-white/10"
                          title="Close Camera Feed"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Camera Shutter release */}
                    <div className="flex justify-center items-center pb-2">
                      <button 
                        type="button"
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white hover:bg-slate-100 active:scale-95 rounded-full border-4 border-slate-400/30 flex items-center justify-center transition-all shadow-xl cursor-pointer"
                        title="Take Photo"
                      >
                        <div className="w-11 h-11 bg-ashoka-blue rounded-full" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-72 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 group-hover:bg-emerald-50/30 group-hover:border-emerald-200 transition-all">
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100">
                      <Camera className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Click or Tap to Select Photo</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Standard File Input / Mobile Camera</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative h-72 rounded-3xl overflow-hidden border border-slate-100 shadow-sm group">
                <img src={photo} alt="Civic issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                    >
                      <Loader2 className="w-10 h-10 animate-spin mb-4 text-saffron" />
                      <p className="text-xs font-bold uppercase tracking-widest">AI Detection Running...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => { setPhoto(null); setAiResult(null); }}
                  className="absolute top-4 right-4 bg-white shadow-lg p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer border border-slate-100"
                  title="Retake Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* AI Insights Breakdown */}
              <AnimatePresence>
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-saffron-light/50 border border-saffron/15 rounded-3xl space-y-4"
                  >
                    <div className="flex items-center gap-2 text-saffron mb-2">
                       <CheckCircle2 className="w-4 h-4" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">AI Audit Insights</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Detection Type</p>
                          <p className="text-xs font-bold text-slate-800 capitalize">{aiResult.Category || 'Unknown'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Risk Level</p>
                          <p className="text-xs font-bold text-slate-800 capitalize">{aiResult.Severity || 'Unknown'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Priority Score</p>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-saffron rounded-full" 
                                  style={{ width: `${(aiResult['Suggested Priority'] || 5) * 10}%` }} 
                                />
                             </div>
                             <span className="text-[10px] font-bold text-slate-600">{aiResult['Suggested Priority'] || 5}/10</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="data-card p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-saffron-light rounded-xl">
                  <MapPin className="w-5 h-5 text-saffron" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">Location Details</h3>
              </div>
              <button 
                onClick={() => setIsManualLocation(!isManualLocation)}
                className="text-[10px] font-bold text-indian-green uppercase tracking-widest hover:bg-indian-green-light px-3 py-1.5 rounded-lg transition-colors border border-indian-green/10"
              >
                {isManualLocation ? 'Use GPS Instead' : 'Enter Manually'}
              </button>
           </div>
           
           <div className="space-y-4">
             {isManualLocation ? (
               <div className="p-1">
                 <input 
                   type="text"
                   value={manualAddress}
                   onChange={(e) => setManualAddress(e.target.value)}
                   placeholder="Enter street address or landmarks..."
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-saffron outline-none text-sm font-medium shadow-inner"
                 />
                 <p className="text-[10px] text-slate-400 mt-2 ml-1">Example: Connaught Place, New Delhi</p>
               </div>
             ) : (
               <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Coordinates</p>
                    <p className="text-sm font-bold text-slate-700">{address}</p>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    coords ? "bg-indian-green shadow-[0_0_10px_rgba(19,136,8,0.5)]" : "bg-slate-300 animate-pulse"
                  )} />
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-8">
        <form onSubmit={handleSubmit} className="data-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Step 2: Confirm Details</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you see? (e.g. deep pothole, piling waste)..." 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-saffron focus:border-saffron transition-all text-sm outline-none h-40 font-medium placeholder:text-slate-300 shadow-inner"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Severity</label>
                <select 
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-saffron text-slate-700 uppercase tracking-wider"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-saffron text-slate-700 uppercase tracking-wider"
                >
                  <option value="pothole">Roadway / Pothole</option>
                  <option value="waste">Trash / Sanitation</option>
                  <option value="drainage">Water / Drainage</option>
                  <option value="hazard">Hazard / Safety</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Suggested Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="group px-3 py-1.5 bg-saffron-light text-saffron-dark text-[10px] font-bold rounded-xl border border-saffron/10 flex items-center gap-2 hover:bg-saffron/20 transition-colors cursor-default"
                  >
                    #{tag}
                    <button 
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="opacity-0 group-hover:opacity-100 hover:text-saffron-dark transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 8 && (
                   <input 
                    type="text"
                    placeholder="Add tag..."
                    className="px-3 py-1.5 bg-transparent border border-dashed border-slate-200 rounded-xl text-[10px] font-medium text-slate-500 outline-none focus:border-saffron-light w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                   />
                )}
              </div>
              <p className="text-[9px] text-slate-400">Press Enter to add custom tags manually.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Add a Comment (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute top-4 left-4 w-4 h-4 text-slate-300" />
                <textarea 
                  value={initialComment}
                  onChange={(e) => setInitialComment(e.target.value)}
                  placeholder="Leave an initial note or more context for the team..." 
                  className="w-full p-5 pl-11 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-saffron focus:border-saffron transition-all text-sm outline-none h-24 font-medium placeholder:text-slate-300 shadow-inner"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isAnalyzing || !photo || (!coords && !isManualLocation) || (isManualLocation && !manualAddress)}
            className="w-full mt-10 bg-ashoka-blue text-white font-bold py-5 rounded-[20px] flex items-center justify-center gap-4 hover:bg-ashoka-blue-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl shadow-ashoka-blue/10"
          >
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-saffron" />
            <span className="uppercase tracking-widest">Submit Issue Report</span>
          </button>
        </form>
        
        <div className="p-8 border-2 border-dashed border-indian-green/10 rounded-[32px] bg-indian-green-light">
          <h4 className="text-xs font-bold text-indian-green uppercase tracking-widest mb-4">Why Report?</h4>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Your reports help public works teams prioritize repairs. Every verified submission earns you Coins that can be redeemed for local services.
          </p>
        </div>
      </div>
    </div>
  );
}
